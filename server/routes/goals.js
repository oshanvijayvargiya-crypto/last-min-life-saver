import express from 'express';
import { supabase } from '../db/supabaseClient.js';
import { protect } from '../middleware/authMiddleware.js';
import { breakGoalIntoMilestones } from '../services/geminiService.js';

const router = express.Router();

// Retrieve all goals, milestones, and habits
router.get('/', protect, async (req, res) => {
  try {
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', req.user.id);
      
    if (goalsError) throw goalsError;

    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', req.user.id);

    if (habitsError) throw habitsError;

    // Gather milestones for each goal
    const goalsWithMilestones = [];
    for (let goal of goals) {
      const { data: milestones } = await supabase
        .from('milestones')
        .select('*')
        .eq('goal_id', goal.id);
      goalsWithMilestones.push({ ...goal, milestones: milestones || [] });
    }

    // Gather completed dates (logs) for habits
    const habitsWithLogs = [];
    for (let habit of habits) {
      const { data: logs } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('habit_id', habit.id);
      habitsWithLogs.push({ ...habit, logs: logs || [] });
    }

    res.json({ goals: goalsWithMilestones, habits: habitsWithLogs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new goal with AI milestone breakdown
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, target_date } = req.body;

    // 1. Insert goal
    const newGoal = {
      user_id: req.user.id,
      title,
      description,
      target_date,
      progress_percentage: 0,
      status: 'in_progress'
    };

    const { data: insertedGoal, error: goalError } = await supabase
      .from('goals')
      .insert(newGoal)
      .select();

    if (goalError) throw goalError;
    const goal = Array.isArray(insertedGoal) ? insertedGoal[0] : insertedGoal;

    // 2. Call Gemini to break goal into milestones & habits
    let aiBreakdown;
    try {
      aiBreakdown = await breakGoalIntoMilestones(title, target_date);
    } catch (aiErr) {
      console.error("Gemini breakdown error, using fallback milestones:", aiErr.message);
      // fallback
      aiBreakdown = {
        milestones: [
          { title: "Define roadmap and core requirements", target_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
          { title: "Complete first milestone review", target_date: new Date(target_date).toISOString() }
        ],
        habits: [`Practice skills for "${title}" daily`]
      };
    }

    // 3. Insert generated milestones
    const milestonesToInsert = (aiBreakdown.milestones || []).map(m => ({
      goal_id: goal.id,
      title: m.title,
      target_date: m.target_date,
      completed: false
    }));
    
    if (milestonesToInsert.length > 0) {
      await supabase.from('milestones').insert(milestonesToInsert);
    }

    // 4. Insert generated habits linked to this goal
    const habitsToInsert = (aiBreakdown.habits || []).map(h => ({
      user_id: req.user.id,
      goal_id: goal.id,
      title: h,
      frequency: 'daily',
      current_streak: 0,
      longest_streak: 0
    }));

    if (habitsToInsert.length > 0) {
      await supabase.from('habits').insert(habitsToInsert);
    }

    // Refetch the full goal object to return
    const { data: finalMilestones } = await supabase.from('milestones').select('*').eq('goal_id', goal.id);
    res.status(201).json({ ...goal, milestones: finalMilestones || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Goal progress or status
router.put('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { progress_percentage, status } = req.body;
    const { data, error } = await supabase
      .from('goals')
      .update({ progress_percentage, status })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle milestone completion
router.put('/milestones/:id/toggle', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { completed } = req.body;

    const { data: milestone, error: mError } = await supabase
      .from('milestones')
      .update({ completed })
      .eq('id', id)
      .select();

    if (mError) throw mError;

    // Recalculate goal progress
    const mRecord = Array.isArray(milestone) ? milestone[0] : milestone;
    if (mRecord) {
      const { data: siblings } = await supabase.from('milestones').select('completed').eq('goal_id', mRecord.goal_id);
      const total = siblings.length;
      const done = siblings.filter(s => s.completed).length;
      const progress = total > 0 ? Math.round((done / total) * 100) : 0;
      
      await supabase.from('goals').update({ progress_percentage: progress }).eq('id', mRecord.goal_id);
    }

    res.json({ success: true, completed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Log habit completion for today
router.post('/habits/:id/log', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { completed_date, notes } = req.body;
    const todayStr = completed_date || new Date().toISOString().split('T')[0];

    // Check if habit belongs to user
    const { data: habits } = await supabase.from('habits').select('*').eq('id', id).eq('user_id', req.user.id);
    if (!habits || habits.length === 0) {
      return res.status(404).json({ error: "Habit not found." });
    }
    const habit = habits[0];

    // Log completion
    const { data: insertedLog, error: logError } = await supabase
      .from('habit_logs')
      .insert({
        habit_id: id,
        completed_date: todayStr,
        notes
      })
      .select();

    if (logError) {
      if (logError.code === '23505' || logError.message?.includes('duplicate')) {
        return res.status(400).json({ error: "Habit already completed today." });
      }
      throw logError;
    }

    // Recalculate habit streak
    // Fetch last completed date (yesterday) to determine if streak is continuous
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const { data: logs } = await supabase
      .from('habit_logs')
      .select('completed_date')
      .eq('habit_id', id)
      .order('completed_date', { ascending: false });

    let currentStreak = habit.current_streak || 0;
    
    // Check if logged yesterday
    const completedDates = logs.map(l => l.completed_date);
    if (completedDates.includes(yesterdayStr)) {
      currentStreak += 1;
    } else {
      // If there was no log yesterday, reset streak to 1
      currentStreak = 1;
    }

    const longestStreak = Math.max(currentStreak, habit.longest_streak || 0);

    // Update habit record
    await supabase
      .from('habits')
      .update({ current_streak: currentStreak, longest_streak: longestStreak })
      .eq('id', id)
      .select();

    // Award +5 XP to user
    const newXp = (req.user.xp_points || 0) + 5;
    await supabase.from('users').update({ xp_points: newXp }).eq('id', req.user.id);

    res.json({
      success: true,
      currentStreak,
      xpEarned: 5,
      xpTotal: newXp
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete goal
router.delete('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ success: true, message: "Goal deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
