import express from 'express';
import { supabase } from '../db/supabaseClient.js';
import { protect } from '../middleware/authMiddleware.js';
import {
  generateDailyPlan,
  getProductivityCoaching,
  analyzeWeeklyPerformance
} from '../services/geminiService.js';

const router = express.Router();

// Generate daily planner schedule block
router.post('/daily-plan', protect, async (req, res) => {
  try {
    const { calendarEvents } = req.body;
    
    // Fetch pending tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('status', 'pending');

    const userPreferences = {
      work_hours_start: req.user.work_hours_start,
      work_hours_end: req.user.work_hours_end,
      productivity_style: req.user.productivity_style
    };

    const dailyPlan = await generateDailyPlan(tasks || [], calendarEvents || [], userPreferences);
    res.json(dailyPlan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Chat with AI Coach & persist history
router.post('/coach', protect, async (req, res) => {
  try {
    const { message } = req.body;

    // Fetch active task context
    const { data: tasks } = await supabase
      .from('tasks')
      .select('title, category, deadline, status')
      .eq('user_id', req.user.id)
      .eq('status', 'pending');

    const streakData = {
      streak_count: req.user.streak_count,
      longest_streak: req.user.longest_streak,
      total_tasks_completed: req.user.total_tasks_completed,
      xp_points: req.user.xp_points
    };

    // Get coaching advice
    const coachResponse = await getProductivityCoaching(message, tasks || [], streakData);

    // Save message thread to DB
    const { data: conversations } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('user_id', req.user.id);

    let chatSession = conversations?.[0];
    let thread = chatSession ? chatSession.messages : [];

    thread.push({ role: 'user', content: message, timestamp: new Date().toISOString() });
    thread.push({ role: 'coach', content: coachResponse.message, action_steps: coachResponse.action_steps, timestamp: new Date().toISOString() });

    if (chatSession) {
      await supabase
        .from('ai_conversations')
        .update({ messages: thread })
        .eq('id', chatSession.id);
    } else {
      await supabase
        .from('ai_conversations')
        .insert({
          user_id: req.user.id,
          messages: thread
        });
    }

    res.json(coachResponse);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Retrieve conversation history
router.get('/coach/history', protect, async (req, res) => {
  try {
    const { data: conversations } = await supabase
      .from('ai_conversations')
      .select('messages')
      .eq('user_id', req.user.id);

    const history = conversations?.[0]?.messages || [];
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate weekly performance metrics review
router.post('/weekly-review', protect, async (req, res) => {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Fetch tasks completed this week
    const { data: completedTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('status', 'completed')
      .gte('completed_at', oneWeekAgo.toISOString());

    // Fetch tasks overdue / missed
    const { data: missedTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('status', 'overdue');

    // Fetch active habits
    const { data: habits } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', req.user.id);

    const review = await analyzeWeeklyPerformance(completedTasks || [], missedTasks || [], habits || []);
    res.json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
