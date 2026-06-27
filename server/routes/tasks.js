import express from 'express';
import { supabase } from '../db/supabaseClient.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper to compute priority score and urgency level
const calculatePriority = (deadline, category, estimated_minutes, user_override) => {
  let deadline_urgency = 20;
  if (deadline) {
    const diffMs = new Date(deadline) - new Date();
    const diffHrs = diffMs / (1000 * 60 * 60);
    if (diffHrs <= 0) deadline_urgency = 100;
    else if (diffHrs <= 6) deadline_urgency = 100;
    else if (diffHrs <= 24) deadline_urgency = 80;
    else if (diffHrs <= 72) deadline_urgency = 60;
    else if (diffHrs <= 168) deadline_urgency = 40;
  }

  // Work=90, Study=80, Finance=70, Health=60, Personal=50
  const categoryWeights = {
    Work: 90,
    Study: 80,
    Finance: 70,
    Health: 60,
    Personal: 50
  };
  const importance_weight = categoryWeights[category] || 50;

  const est = estimated_minutes || 30;
  // effort_inverse: longer tasks mean harder/higher effort, so they get a lower score component
  const effort_inverse = Math.max(0, 100 - (est / 480) * 100);

  let override_val = 50;
  if (user_override === 'P1') override_val = 100;
  else if (user_override === 'P2') override_val = 75;
  else if (user_override === 'P3') override_val = 50;
  else if (user_override === 'P4') override_val = 25;

  const priority_score = Math.round(
    (deadline_urgency * 0.4) +
    (importance_weight * 0.35) +
    (effort_inverse * 0.15) +
    (override_val * 0.10)
  );

  let urgency_level = 'P4';
  if (priority_score >= 80) urgency_level = 'P1';
  else if (priority_score >= 60) urgency_level = 'P2';
  else if (priority_score >= 40) urgency_level = 'P3';

  return { priority_score, urgency_level };
};

// Fetch tasks
router.get('/', protect, async (req, res) => {
  try {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', req.user.id);

    if (error) throw error;

    // Dynamically mark overdue tasks
    const updatedTasks = [];
    const now = new Date();

    for (let task of tasks) {
      if (task.status === 'pending' && task.deadline && new Date(task.deadline) < now) {
        task.status = 'overdue';
        await supabase.from('tasks').update({ status: 'overdue' }).eq('id', task.id);
        // deduct 2 XP for overdue task
        const newXp = Math.max(0, (req.user.xp_points || 0) - 2);
        await supabase.from('users').update({ xp_points: newXp }).eq('id', req.user.id);
      }
      updatedTasks.push(task);
    }

    res.json(updatedTasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create task
router.post('/', protect, async (req, res) => {
  try {
    const { title, category, deadline, estimated_minutes, user_override, notes } = req.body;

    const { priority_score, urgency_level } = calculatePriority(
      deadline,
      category,
      estimated_minutes,
      user_override
    );

    const newTask = {
      user_id: req.user.id,
      title,
      category: category || 'Personal',
      deadline,
      estimated_minutes: estimated_minutes || 30,
      priority_score,
      urgency_level,
      status: 'pending',
      notes,
      user_override: user_override || 'none'
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert(newTask)
      .select();

    if (error) throw error;
    res.status(201).json(Array.isArray(data) ? data[0] : data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update task
router.put('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, deadline, estimated_minutes, user_override, notes, status } = req.body;

    const { priority_score, urgency_level } = calculatePriority(
      deadline,
      category,
      estimated_minutes,
      user_override
    );

    const updates = {
      title,
      category,
      deadline,
      estimated_minutes,
      user_override,
      notes,
      status,
      priority_score,
      urgency_level
    };

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select();

    if (error) throw error;
    res.json(Array.isArray(data) ? data[0] : data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Complete task (marks as completed, increments XP/streaks)
router.put('/:id/complete', protect, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Fetch task
    const { data: tasks } = await supabase.from('tasks').select('*').eq('id', id).eq('user_id', req.user.id);
    if (!tasks || tasks.length === 0) {
      return res.status(404).json({ error: "Task not found." });
    }
    const task = tasks[0];
    
    if (task.status === 'completed') {
      return res.json(task);
    }

    const nowStr = new Date().toISOString();
    const { data: updatedTasks, error } = await supabase
      .from('tasks')
      .update({ status: 'completed', completed_at: nowStr })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select();

    if (error) throw error;

    // Gamification Scoring
    let xpEarned = 5; // basic completion
    const isBeforeDeadline = task.deadline ? new Date() <= new Date(task.deadline) : true;
    if (isBeforeDeadline && task.status !== 'overdue') {
      xpEarned = 10; // on-time bonus
    }

    const { data: latestUsers } = await supabase.from('users').select('*').eq('id', req.user.id);
    const currentUser = latestUsers[0];

    const newXp = (currentUser.xp_points || 0) + xpEarned;
    const newTotal = (currentUser.total_tasks_completed || 0) + 1;

    // Calculate streak
    // Fetch the most recent completed task before this one
    const { data: previousCompletions } = await supabase
      .from('tasks')
      .select('completed_at')
      .eq('user_id', req.user.id)
      .eq('status', 'completed')
      .neq('id', id)
      .order('completed_at', { ascending: false });

    let streak = currentUser.streak_count || 0;

    if (previousCompletions && previousCompletions.length > 0) {
      const lastDate = new Date(previousCompletions[0].completed_at);
      const todayDate = new Date();
      
      // Zero out the hours for exact days checking
      lastDate.setHours(0,0,0,0);
      todayDate.setHours(0,0,0,0);
      
      const diffTime = todayDate.getTime() - lastDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        streak += 1;
      } else if (diffDays > 1) {
        streak = 1;
      } else if (streak === 0) {
        streak = 1;
      }
    } else {
      streak = 1;
    }

    const longestStreak = Math.max(streak, currentUser.longest_streak || 0);

    // Sync gamification
    await supabase.from('users').update({
      xp_points: newXp,
      total_tasks_completed: newTotal,
      streak_count: streak,
      longest_streak: longestStreak
    }).eq('id', req.user.id);

    res.json({
      task: Array.isArray(updatedTasks) ? updatedTasks[0] : updatedTasks,
      xpEarned,
      streak,
      xpTotal: newXp
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete task
router.delete('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ success: true, message: "Task deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
