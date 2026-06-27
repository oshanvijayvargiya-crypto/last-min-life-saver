import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore.js';
import { PageWrapper } from '../components/layout/PageWrapper.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { api } from '../services/api.js';
import { Badge } from '../components/ui/Badge.jsx';
import {
  Flame, CheckCircle, Brain, Sparkles,
  ChevronRight, CalendarDays, ShieldAlert, Award, X, Plus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import clsx from 'clsx';

export const Dashboard = () => {
  const { user, tasks, fetchTasks, completeTask, addTask } = useStore();
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [aiPlan, setAiPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  
  // Quick-Add Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Work');
  const [newDeadline, setNewDeadline] = useState('');
  const [newMinutes, setNewMinutes] = useState(30);
  const [newOverride, setNewOverride] = useState('none');
  const [newNotes, setNewNotes] = useState('');

  useEffect(() => {
    fetchTasks();
    loadCalendarAndPlan();
  }, []);

  const loadCalendarAndPlan = async () => {
    setLoadingPlan(true);
    try {
      const events = await api.calendar.getEvents();
      setCalendarEvents(events || []);
      const plan = await api.ai.getDailyPlan(events || []);
      setAiPlan(plan);
    } catch (err) {
      console.error("Failed to load AI daily plan:", err.message);
    } finally {
      setLoadingPlan(false);
    }
  };

  // Metrics Calculations
  const todayStr = new Date().toDateString();
  
  const tasksDueToday = (tasks || []).filter(t => {
    if (!t) return false;
    if (t.status === 'completed' || !t.deadline) return false;
    return new Date(t.deadline).toDateString() === todayStr;
  }).length;

  const completedToday = (tasks || []).filter(t => {
    if (!t) return false;
    if (t.status !== 'completed' || !t.completed_at) return false;
    return new Date(t.completed_at).toDateString() === todayStr;
  }).length;

  const focusTimeToday = (tasks || []).filter(t => {
    if (!t) return false;
    if (t.status !== 'completed' || !t.completed_at) return false;
    return new Date(t.completed_at).toDateString() === todayStr;
  }).reduce((acc, t) => acc + (t?.estimated_minutes || 0), 0);

  // Quadrants filtering
  const p1Tasks = (tasks || []).filter(t => t && t.status !== 'completed' && t.urgency_level === 'P1');
  const p2Tasks = (tasks || []).filter(t => t && t.status !== 'completed' && t.urgency_level === 'P2');
  const p3Tasks = (tasks || []).filter(t => t && t.status !== 'completed' && t.urgency_level === 'P3');
  const p4Tasks = (tasks || []).filter(t => t && t.status !== 'completed' && t.urgency_level === 'P4');

  // Next 7 days deadlines
  const next7DaysTasks = (tasks || []).filter(t => {
    if (!t) return false;
    if (t.status === 'completed' || !t.deadline) return false;
    const diff = (new Date(t.deadline) - new Date()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  }).sort((a, b) => {
    if (!a || !b) return 0;
    return new Date(a.deadline) - new Date(b.deadline);
  });

  const handleQuickComplete = async (id) => {
    try {
      await completeTask(id);
      confetti({
        particleCount: 80,
        spread: 60,
        colors: ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
        origin: { y: 0.8 }
      });
      loadCalendarAndPlan(); // reload plan
    } catch (e) {
      console.error(e);
    }
  };

  const handleQuickAddSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await addTask({
      title: newTitle,
      category: newCategory,
      deadline: newDeadline || null,
      estimated_minutes: parseInt(newMinutes, 10),
      user_override: newOverride,
      notes: newNotes
    });

    setNewTitle('');
    setNewCategory('Work');
    setNewDeadline('');
    setNewMinutes(30);
    setNewOverride('none');
    setNewNotes('');
    setIsModalOpen(false);
    loadCalendarAndPlan();
  };

  return (
    <PageWrapper>
      {/* 4 Metrics Cards Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="flex flex-col items-center justify-center text-center p-6">
          <p className="text-4xl font-bold text-accentPurple">{tasksDueToday}</p>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-textMuted block mt-2">DUE TODAY</span>
        </Card>

        <Card className="flex flex-col items-center justify-center text-center p-6">
          <p className="text-4xl font-bold text-warning">{user?.streak_count || 0}</p>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-textMuted block mt-2">HABIT STREAK</span>
        </Card>

        <Card className="flex flex-col items-center justify-center text-center p-6">
          <p className="text-4xl font-bold text-success">{completedToday}</p>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-textMuted block mt-2">DONE TODAY</span>
        </Card>

        <Card className="flex flex-col items-center justify-center text-center p-6">
          <p className="text-4xl font-bold text-accentBlue">{focusTimeToday}</p>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-textMuted block mt-2">MINUTES FOCUS</span>
        </Card>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Today's AI Plan */}
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4 select-none">
              <Brain size={20} className="text-accentPurple" />
              <h3 className="font-bold text-base text-white">TODAY'S AI WAR PLAN</h3>
            </div>
            
            <div>
              {loadingPlan ? (
                <div className="py-12 flex flex-col items-center select-none">
                  <div className="animate-spin h-10 w-10 border-2 border-accentPurple border-r-transparent rounded-full" />
                  <span className="text-xs text-textMuted mt-4 font-semibold uppercase tracking-wider animate-pulse">
                    Structuring Blocks...
                  </span>
                </div>
              ) : aiPlan ? (
                <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm font-medium leading-relaxed text-textMuted italic">
                      "{aiPlan.plan_summary}"
                    </p>
                  </div>

                  {/* Timeline display */}
                  <div className="space-y-6 pl-4 border-l-2 border-accentPurple/20 relative">
                    {aiPlan.schedule?.map((item, idx) => (
                      <div key={idx} className="relative pl-4">
                        {/* Timeline Marker dot */}
                        <span className={clsx(
                          "absolute left-[-21px] top-1.5 h-2 w-2 rounded-full",
                          item.type === 'focus' ? 'bg-accentPurple shadow-[0_0_8px_rgba(255,107,0,0.5)]' :
                          item.type === 'break' ? 'bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                          'bg-accentBlue shadow-[0_0_8px_rgba(255,170,0,0.5)]'
                        )} />
                        
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-textPrimary leading-tight">
                              {item.label}
                            </p>
                            <span className="text-[10px] text-textMuted mt-1 block font-medium">
                              {item.time} • {item.duration}m
                            </span>
                          </div>
                          
                          {item.taskId && (
                            <button
                              onClick={() => handleQuickComplete(item.taskId)}
                              className="h-8 w-8 rounded-lg bg-white/5 hover:bg-success hover:text-white flex items-center justify-center border border-white/10 transition-all"
                              title="Complete Task"
                            >
                              <CheckCircle size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5 select-none">
                    <Badge variant="primary">🎯 {aiPlan.focus_blocks_count || 0} Focus Blocks</Badge>
                    <Badge variant="secondary">☕ {aiPlan.break_minutes_total || 0}m Break Time</Badge>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-xs font-semibold text-textMuted uppercase">No schedule generated.</p>
                  <Button variant="secondary" size="sm" className="mt-4" onClick={loadCalendarAndPlan}>
                    Generate Plan
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Eisenhower Matrix & Timeline */}
        <div className="lg:col-span-7 space-y-6">
          {/* Priority Matrix */}
          <Card>
            <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4 select-none">
              <h3 className="font-bold text-base text-white">PRIORITY MATRIX</h3>
              <span className="text-xs text-textMuted">Eisenhower Grid</span>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Q1: Urgent & Important */}
                <div className="glass-panel p-4 rounded-xl flex flex-col h-48 overflow-hidden bg-danger/5 border-danger/20">
                  <span className="text-[10px] font-semibold text-danger uppercase tracking-wider mb-3 select-none">
                    🔴 Q1: Urgent & Important
                  </span>
                  
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                    {p1Tasks.length === 0 ? (
                      <span className="text-[10px] font-medium text-textMuted uppercase block py-2">No urgent tasks</span>
                    ) : (
                      p1Tasks.map(t => (
                        <div key={t.id} className="flex justify-between items-center p-2 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all group">
                          <span className="text-xs font-medium text-textPrimary truncate pr-1">{t.title}</span>
                          <button
                            onClick={() => handleQuickComplete(t.id)}
                            className="h-6 w-6 rounded bg-white/5 border border-white/10 hover:bg-success hover:border-success text-textMuted hover:text-white flex items-center justify-center transition-all"
                          >
                            <CheckCircle size={10} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Q2: Important but Not Urgent */}
                <div className="glass-panel p-4 rounded-xl flex flex-col h-48 overflow-hidden bg-warning/5 border-warning/20">
                  <span className="text-[10px] font-semibold text-warning uppercase tracking-wider mb-3 select-none">
                    🟠 Q2: Important • Schedule
                  </span>
                  
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                    {p2Tasks.length === 0 ? (
                      <span className="text-[10px] font-medium text-textMuted uppercase block py-2">Queue is clear</span>
                    ) : (
                      p2Tasks.map(t => (
                        <div key={t.id} className="flex justify-between items-center p-2 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all group">
                          <span className="text-xs font-medium text-textPrimary truncate pr-1">{t.title}</span>
                          <button
                            onClick={() => handleQuickComplete(t.id)}
                            className="h-6 w-6 rounded bg-white/5 border border-white/10 hover:bg-success hover:border-success text-textMuted hover:text-white flex items-center justify-center transition-all"
                          >
                            <CheckCircle size={10} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Q3: Urgent but Not Important */}
                <div className="glass-panel p-4 rounded-xl flex flex-col h-48 overflow-hidden bg-accentPurple/5 border-accentPurple/20">
                  <span className="text-[10px] font-semibold text-accentPurple uppercase tracking-wider mb-3 select-none">
                    🟡 Q3: Urgent • Delegate
                  </span>
                  
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                    {p3Tasks.length === 0 ? (
                      <span className="text-[10px] font-medium text-textMuted uppercase block py-2">No delegated tasks</span>
                    ) : (
                      p3Tasks.map(t => (
                        <div key={t.id} className="flex justify-between items-center p-2 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all group">
                          <span className="text-xs font-medium text-textPrimary truncate pr-1">{t.title}</span>
                          <button
                            onClick={() => handleQuickComplete(t.id)}
                            className="h-6 w-6 rounded bg-white/5 border border-white/10 hover:bg-success hover:border-success text-textMuted hover:text-white flex items-center justify-center transition-all"
                          >
                            <CheckCircle size={10} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Q4: Neither */}
                <div className="glass-panel p-4 rounded-xl flex flex-col h-48 overflow-hidden bg-white/5 border-white/10">
                  <span className="text-[10px] font-semibold text-textMuted uppercase tracking-wider mb-3 select-none">
                    🟢 Q4: Flexible • Backburner
                  </span>
                  
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                    {p4Tasks.length === 0 ? (
                      <span className="text-[10px] font-medium text-textMuted uppercase block py-2">No backburner tasks</span>
                    ) : (
                      p4Tasks.map(t => (
                        <div key={t.id} className="flex justify-between items-center p-2 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all group">
                          <span className="text-xs font-medium text-textPrimary truncate pr-1">{t.title}</span>
                          <button
                            onClick={() => handleQuickComplete(t.id)}
                            className="h-6 w-6 rounded bg-white/5 border border-white/10 hover:bg-success hover:border-success text-textMuted hover:text-white flex items-center justify-center transition-all"
                          >
                            <CheckCircle size={10} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Upcoming Deadlines (next 7 days) */}
          <Card>
            <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4 select-none">
              <h3 className="font-bold text-base text-white">UPCOMING DEADLINES (NEXT 7 DAYS)</h3>
              <Badge variant="info">{next7DaysTasks.length} Total</Badge>
            </div>

            <div className="space-y-3.5 max-h-56 overflow-y-auto pr-1">
              {next7DaysTasks.length === 0 ? (
                <p className="text-center py-6 text-xs text-textMuted uppercase font-medium">
                  No upcoming deadlines this week. Relax! 🧘‍♂️
                </p>
              ) : (
                next7DaysTasks.map((t) => {
                  const daysLeft = Math.ceil((new Date(t.deadline) - new Date()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={t.id} className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="text-xs select-none">
                          {t.urgency_level === 'P1' ? '🔴' : t.urgency_level === 'P2' ? '🟠' : t.urgency_level === 'P3' ? '🟡' : '🟢'}
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-textPrimary truncate leading-none">{t.title}</p>
                          <p className="text-[10px] text-textMuted mt-1.5 font-medium uppercase">
                            Due {daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `in ${daysLeft} days`} • {t.category}
                          </p>
                        </div>
                      </div>
                      
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleQuickComplete(t.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Complete
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-20 right-6 md:bottom-8 md:right-8 h-14 w-14 rounded-full bg-gradient-to-tr from-accentPurple to-accentBlue text-white shadow-lg shadow-accentPurple/25 hover:shadow-accentPurple/40 active:scale-95 flex items-center justify-center transition-all z-20"
      >
        <Plus size={28} />
      </button>

      {/* Quick Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-darkBg/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-100">
          <Card className="w-full max-w-md p-6 relative shadow-2xl animate-in zoom-in-95 duration-100">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-textMuted hover:text-white"
            >
              <X size={18} />
            </button>
            
            <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4 select-none">
              <Plus size={20} className="text-accentPurple" />
              <h3 className="font-bold text-base text-white">QUICK ADD TASK</h3>
            </div>

            <form onSubmit={handleQuickAddSubmit} className="space-y-4">
              <Input
                label="Task Title"
                placeholder="What needs to be done?"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-[10px] font-semibold text-textMuted uppercase tracking-wider mb-1.5 select-none">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="glass-input rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:border-accentPurple transition-all"
                  >
                    <option value="Work" className="bg-darkSurface text-textPrimary">Work</option>
                    <option value="Study" className="bg-darkSurface text-textPrimary">Study</option>
                    <option value="Personal" className="bg-darkSurface text-textPrimary">Personal</option>
                    <option value="Finance" className="bg-darkSurface text-textPrimary">Finance</option>
                    <option value="Health" className="bg-darkSurface text-textPrimary">Health</option>
                  </select>
                </div>

                <Input
                  label="Estimated Min"
                  type="number"
                  min="5"
                  max="480"
                  value={newMinutes}
                  onChange={(e) => setNewMinutes(e.target.value)}
                />
              </div>

              <Input
                label="Deadline Date & Time"
                type="datetime-local"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
              />

              <div className="flex flex-col">
                <label className="text-[10px] font-semibold text-textMuted uppercase tracking-wider mb-1.5 select-none">
                  Priority Override
                </label>
                <select
                  value={newOverride}
                  onChange={(e) => setNewOverride(e.target.value)}
                  className="glass-input rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:border-accentPurple transition-all"
                >
                  <option value="none" className="bg-darkSurface text-textPrimary">Let AI Decide</option>
                  <option value="P1" className="bg-darkSurface text-textPrimary">P1 (Emergency)</option>
                  <option value="P2" className="bg-darkSurface text-textPrimary">P2 (Important)</option>
                  <option value="P3" className="bg-darkSurface text-textPrimary">P3 (Medium)</option>
                  <option value="P4" className="bg-darkSurface text-textPrimary">P4 (Low)</option>
                </select>
              </div>

              <Input
                label="Notes"
                placeholder="Additional details..."
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
              />

              <div className="flex gap-4 justify-end pt-3">
                <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                
                <Button type="submit" size="sm">
                  Add Task
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </PageWrapper>
  );
};

export default Dashboard;
