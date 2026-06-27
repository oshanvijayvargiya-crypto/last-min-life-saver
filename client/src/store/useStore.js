import { create } from 'zustand';
import { api } from '../services/api.js';

export const useStore = create((set, get) => ({
  user: null,
  tasks: [],
  goals: [],
  habits: [],
  coachHistory: [],
  notifications: [],
  loading: false,
  error: null,

  // User Actions
  fetchUser: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.auth.me();
      set({ user: res.user, loading: false });
    } catch (err) {
      set({ user: null, loading: false }); // Unauthenticated
    }
  },

  updateSettings: async (settings) => {
    set({ loading: true });
    try {
      await api.users.updateSettings(settings);
      const { user } = get();
      if (user) {
        set({ user: { ...user, ...settings } });
      }
      set({ loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  logout: async () => {
    try {
      await api.auth.logout();
    } catch (err) {
      console.error("Logout error on server:", err);
    }
    localStorage.removeItem('token');
    set({ user: null, tasks: [], goals: [], habits: [], coachHistory: [] });
  },

  // Task Actions
  fetchTasks: async () => {
    set({ loading: true });
    try {
      const tasks = await api.tasks.getAll();
      set({ tasks, loading: false });
      
      // Auto-scan for critical deadlines to add smart notification alerts
      get().scanForReminders(tasks);
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  addTask: async (taskData) => {
    set({ loading: true });
    try {
      const newTask = await api.tasks.create(taskData);
      set((state) => ({ 
        tasks: [...state.tasks, newTask],
        loading: false 
      }));
      get().fetchTasks(); // Reload to get sorted scoring
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  updateTask: async (id, taskData) => {
    set({ loading: true });
    try {
      const updated = await api.tasks.update(id, taskData);
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updated } : t)),
        loading: false
      }));
      get().fetchTasks();
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  completeTask: async (id) => {
    try {
      const res = await api.tasks.complete(id);
      
      // Update task list and user state (XP, streak)
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? res.task : t)),
        user: state.user ? {
          ...state.user,
          xp_points: res.xpTotal,
          streak_count: res.streak,
          longest_streak: Math.max(res.streak, state.user.longest_streak || 0),
          total_tasks_completed: (state.user.total_tasks_completed || 0) + 1
        } : null
      }));
      
      return res; // return to component for confetti trigger!
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  deleteTask: async (id) => {
    try {
      await api.tasks.delete(id);
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id)
      }));
    } catch (err) {
      set({ error: err.message });
    }
  },

  // Goals & Habits Actions
  fetchGoalsHabits: async () => {
    set({ loading: true });
    try {
      const res = await api.goals.getAll();
      set({ goals: res.goals || [], habits: res.habits || [], loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  addGoal: async (goalData) => {
    set({ loading: true });
    try {
      const newGoal = await api.goals.create(goalData);
      set((state) => ({
        goals: [...state.goals, newGoal],
        loading: false
      }));
      get().fetchGoalsHabits(); // refetch to get generated habits & milestones
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  toggleMilestone: async (id, completed) => {
    try {
      await api.goals.toggleMilestone(id, completed);
      // update progress local state
      get().fetchGoalsHabits();
    } catch (err) {
      set({ error: err.message });
    }
  },

  logHabit: async (id, completedDate = null) => {
    try {
      const res = await api.goals.logHabit(id, { completed_date: completedDate });
      
      // Update XP and habits streak locally
      set((state) => ({
        user: state.user ? { ...state.user, xp_points: res.xpTotal } : null,
        habits: state.habits.map(h => h.id === id ? {
          ...h,
          current_streak: res.currentStreak,
          longest_streak: Math.max(res.currentStreak, h.longest_streak || 0)
        } : h)
      }));
      get().fetchGoalsHabits();
      return res;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  deleteGoal: async (id) => {
    try {
      await api.goals.delete(id);
      set((state) => ({
        goals: state.goals.filter(g => g.id !== id),
        habits: state.habits.filter(h => h.goal_id !== id)
      }));
    } catch (err) {
      set({ error: err.message });
    }
  },

  // AI Coach Actions
  fetchCoachHistory: async () => {
    try {
      const history = await api.ai.getCoachHistory();
      set({ coachHistory: history });
    } catch (err) {
      console.error("Failed to load coach history:", err.message);
    }
  },

  sendMessageToCoach: async (message) => {
    // Add user message optimistically
    const userMsg = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    
    set((state) => ({
      coachHistory: [...state.coachHistory, userMsg]
    }));

    try {
      const response = await api.ai.coachChat(message);
      
      const coachMsg = {
        role: 'coach',
        content: response.message,
        action_steps: response.action_steps,
        timestamp: new Date().toISOString()
      };
      
      set((state) => ({
        coachHistory: [...state.coachHistory, coachMsg]
      }));
    } catch (err) {
      set((state) => ({
        coachHistory: [...state.coachHistory, {
          role: 'coach',
          content: "Sorry, I had trouble thinking about that. Please check your network or API keys.",
          timestamp: new Date().toISOString()
        }]
      }));
    }
  },

  // Notification Banners (Smart Reminders Escalation system)
  scanForReminders: (tasksList) => {
    const alerts = [];
    const now = new Date();
    
    tasksList.forEach(task => {
      if (task.status === 'completed' || !task.deadline) return;
      
      const deadline = new Date(task.deadline);
      const hoursLeft = (deadline - now) / (1000 * 60 * 60);

      if (hoursLeft > 0) {
        if (hoursLeft <= 1) {
          alerts.push({
            id: `alert-critical-${task.id}`,
            type: 'CRITICAL',
            title: `CRITICAL ALERT 🚨`,
            message: `Emergency! Only 1 hour left for "${task.title}". Set aside all distractions.`,
            actionText: "Focus Now",
            task
          });
        } else if (hoursLeft <= 3) {
          alerts.push({
            id: `alert-urgent-${task.id}`,
            type: 'URGENT',
            title: `URGENT DEADLINE ⚠️`,
            message: `"${task.title}" is due in less than 3 hours. Time to build your salvage plan!`,
            actionText: "Open Task",
            task
          });
        } else if (hoursLeft <= 24) {
          alerts.push({
            id: `alert-prep-${task.id}`,
            type: 'PREP',
            title: `Due Tomorrow ⏰`,
            message: `Final prep reminder for "${task.title}". Review checklist and make final changes.`,
            actionText: "Prepare",
            task
          });
        }
      } else {
        alerts.push({
          id: `alert-overdue-${task.id}`,
          type: 'OVERDUE',
          title: `Overdue Task 🩹`,
          message: `"${task.title}" was due recently. AI suggests rescheduling to recover your streak.`,
          actionText: "Reschedule",
          task
        });
      }
    });

    set({ notifications: alerts });
  },

  dismissNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  }
}));
export default useStore;
