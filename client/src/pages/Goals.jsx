import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore.js';
import { PageWrapper } from '../components/layout/PageWrapper.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import {
  Award, CheckSquare, Calendar, Plus, Trash2, Flame, Sparkles, Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import clsx from 'clsx';

export const Goals = () => {
  const {
    goals,
    habits,
    fetchGoalsHabits,
    addGoal,
    deleteGoal,
    toggleMilestone,
    logHabit,
    user
  } = useStore();

  const [goalTitle, setGoalTitle] = useState('');
  const [goalDesc, setGoalDesc] = useState('');
  const [goalTargetDate, setGoalTargetDate] = useState('');
  const [addingGoal, setAddingGoal] = useState(false);

  useEffect(() => {
    fetchGoalsHabits();
  }, []);

  const handleGoalSubmit = async (e) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;

    setAddingGoal(true);
    try {
      await addGoal({
        title: goalTitle,
        description: goalDesc,
        target_date: goalTargetDate || null
      });

      setGoalTitle('');
      setGoalDesc('');
      setGoalTargetDate('');
    } catch (err) {
      console.error(err);
    } finally {
      setAddingGoal(false);
    }
  };

  const handleHabitComplete = async (habitId) => {
    try {
      await logHabit(habitId);
      confetti({
        particleCount: 50,
        spread: 45,
        colors: ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
        origin: { y: 0.8 }
      });
    } catch (e) {
      alert("Habit already completed today!");
    }
  };

  // Generate GitHub-style heatmap (12 weeks = 84 days)
  const renderHeatmap = () => {
    const totalDays = 84;
    const today = new Date();
    const cells = [];

    const logCounts = {};
    habits.forEach(h => {
      h.logs?.forEach(log => {
        const dateKey = new Date(log.completed_date).toISOString().split('T')[0];
        logCounts[dateKey] = (logCounts[dateKey] || 0) + 1;
      });
    });

    for (let i = totalDays - 1; i >= 0; i--) {
      const cellDate = new Date();
      cellDate.setDate(today.getDate() - i);
      const dateKey = cellDate.toISOString().split('T')[0];
      const count = logCounts[dateKey] || 0;

      // Solid color stops mapped to glassmorphism styles
      let colorClass = "bg-white/5 border-white/5";
      if (count === 1) colorClass = "bg-[#ff6b00]/20 border-accentPurple/10";
      else if (count === 2) colorClass = "bg-[#ff6b00]/50 border-accentPurple/30";
      else if (count >= 3) colorClass = "bg-[#ff6b00] border-accentPurple shadow-[0_0_8px_rgba(255, 107, 0, 0.4)]";

      cells.push(
        <div
          key={dateKey}
          className={`w-3.5 h-3.5 rounded border ${colorClass} transition-all duration-200 hover:scale-125`}
          title={`${dateKey}: ${count} habits completed`}
        />
      );
    }

    return (
      <div className="flex flex-col gap-2 select-none">
        <div className="grid grid-flow-col grid-rows-7 gap-1.5 justify-start">
          {cells}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-textMuted font-semibold uppercase justify-end pr-6 mt-2">
          <span>Less</span>
          <div className="w-2.5 h-2.5 rounded border border-white/5 bg-white/5" />
          <div className="w-2.5 h-2.5 rounded border border-accentPurple/10 bg-[#ff6b00]/20" />
          <div className="w-2.5 h-2.5 rounded border border-accentPurple/30 bg-[#ff6b00]/50" />
          <div className="w-2.5 h-2.5 rounded border border-accentPurple bg-[#ff6b00]" />
          <span>More</span>
        </div>
      </div>
    );
  };

  const getMotivationalNudge = () => {
    const streak = user?.streak_count || 0;
    if (streak === 0) return "Start a streak today by logging a habit or completing a task! Every climb starts with a single step. 🌱";
    if (streak < 3) return "Great start! Keep the momentum alive. Consistency is the secret formula. ⚡";
    if (streak < 7) return `${streak} days! You're building solid muscle memory. Focus on the next milestone. 🔥`;
    return `${streak}-Day Streak! You are a productivity legend. Nothing can stop you now! 👑`;
  };

  return (
    <PageWrapper>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Habits & Contribution map */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Streak Nudge Card */}
          <Card className="border-l-4 border-orange-500 bg-orange-500/5">
            <h3 className="font-semibold text-xs text-orange-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 select-none">
              <Sparkles size={14} className="text-orange-400 animate-pulse" />
              <span>STREAK CATALYST NUDGE</span>
            </h3>
            <p className="text-sm font-medium leading-relaxed text-textMuted italic">
              "{getMotivationalNudge()}"
            </p>
          </Card>

          {/* Daily Habits Checklist */}
          <Card>
            <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4 select-none">
              <Flame size={20} className="text-warning" />
              <h3 className="font-bold text-base text-white">DAILY HABITS</h3>
            </div>

            <div className="space-y-3">
              {habits.length === 0 ? (
                <p className="text-center py-8 text-xs text-textMuted font-semibold uppercase select-none">
                  Create a Goal to generate habits!
                </p>
              ) : (
                habits.map(h => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const completedToday = h.logs?.some(l => l.completed_date.startsWith(todayStr));

                  return (
                    <div
                      key={h.id}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <button
                          onClick={() => !completedToday && handleHabitComplete(h.id)}
                          className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all ${
                            completedToday
                              ? 'bg-success border-success text-white'
                              : 'bg-white/5 border-white/10 hover:border-accentPurple/50 hover:bg-accentPurple/5 text-transparent hover:text-accentPurple/50'
                          }`}
                          disabled={completedToday}
                        >
                          <Check size={12} />
                        </button>
                        <div>
                          <p className={`text-xs font-semibold text-textPrimary leading-tight ${completedToday ? 'line-through text-textMuted' : ''}`}>
                            {h.title}
                          </p>
                          <span className="text-[10px] text-textMuted font-medium mt-1 block select-none">
                            🔥 {h.current_streak || 0}d streak (max {h.longest_streak || 0}d)
                          </span>
                        </div>
                      </div>

                      <Badge variant={completedToday ? 'success' : 'warning'}>
                        {completedToday ? 'Done' : 'Active'}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* Contribution Heatmap */}
          <Card>
            <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4 select-none">
              <Calendar size={20} className="text-accentBlue" />
              <h3 className="font-bold text-base text-white">HABIT CATALYST HEATMAP</h3>
            </div>
            
            <div>
              <p className="text-xs text-textMuted mb-4 leading-relaxed select-none">
                Visual log grid showing daily habit completions across the past 12 weeks.
              </p>
              {renderHeatmap()}
            </div>
          </Card>
        </div>

        {/* Right Column: Goals */}
        <div className="lg:col-span-7 space-y-6">
          {/* Add Goal Card */}
          <Card>
            <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4 select-none">
              <Award size={20} className="text-accentPurple" />
              <h3 className="font-bold text-base text-white">ENGAGE LONG-TERM GOAL</h3>
            </div>

            <form onSubmit={handleGoalSubmit} className="space-y-4">
              <Input
                label="Goal Title"
                placeholder="e.g. Master React and Node.js Full-Stack"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Description"
                  placeholder="e.g. Complete portfolio apps and database schemas."
                  value={goalDesc}
                  onChange={(e) => setGoalDesc(e.target.value)}
                />
                
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-1.5 select-none">Target Date</span>
                  <input
                    type="date"
                    value={goalTargetDate}
                    onChange={(e) => setGoalTargetDate(e.target.value)}
                    className="glass-input px-4 py-2.5 rounded-xl text-sm w-full focus:outline-none focus:border-accentPurple transition-all"
                    required
                  />
                </div>
              </div>

              <Button type="submit" loading={addingGoal} className="w-full">
                <Plus size={14} />
                <span>Generate AI Goal Breakdown</span>
              </Button>
            </form>
          </Card>

          {/* Goal List */}
          <div className="space-y-4">
            {goals.length === 0 ? (
              <Card className="text-center py-6">
                <p className="text-xs text-textMuted uppercase font-semibold">No active goals. Add one above to generate AI breakdowns.</p>
              </Card>
            ) : (
              goals.map((g) => (
                <Card key={g.id} className="p-0 overflow-hidden bg-white">
                  <div className="flex items-center justify-between p-4 bg-white/5 border-b border-white/5">
                    <h4 className="font-semibold text-sm text-textPrimary truncate pr-4">{g.title}</h4>
                    
                    <button
                      onClick={() => deleteGoal(g.id)}
                      className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-textMuted hover:text-danger hover:bg-danger/10 hover:border-danger/20 transition-all"
                      title="Delete Goal"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="p-6 space-y-4 bg-white/[0.01]">
                    <p className="text-sm text-textMuted leading-relaxed">{g.description || 'No description provided.'}</p>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 select-none">
                      <div className="flex justify-between items-center text-[10px] font-semibold text-textMuted uppercase tracking-wider">
                        <span>Progress</span>
                        <span>{g.progress_percentage || 0}% Complete</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden mt-1.5 border border-white/5">
                        <div
                          className="bg-gradient-to-r from-accentPurple to-accentBlue h-full transition-all duration-300 ease-linear"
                          style={{ width: `${g.progress_percentage || 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Milestones */}
                    <div className="space-y-3 pt-4 border-t border-white/5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-textMuted select-none block">
                        AI Generated Milestones
                      </span>
                      
                      <div className="space-y-2.5">
                        {g.milestones?.map((m) => (
                          <div key={m.id} className="flex items-center gap-2.5">
                            <button
                              onClick={() => toggleMilestone(m.id, !m.completed)}
                              className={`h-4 w-4 rounded-md border flex items-center justify-center transition-all ${
                                m.completed
                                  ? 'bg-accentPurple border-accentPurple text-white'
                                  : 'bg-white/5 border-white/10 hover:border-accentPurple/50 hover:bg-accentPurple/5 text-transparent hover:text-accentPurple/50'
                              }`}
                            >
                              <Check size={10} />
                            </button>
                            
                            <span className={`text-xs font-medium ${m.completed ? 'line-through text-textMuted' : 'text-textPrimary'}`}>
                              {m.title}
                            </span>
                            
                            {m.target_date && (
                              <span className="text-[10px] font-medium text-textMuted ml-auto select-none">
                                due {new Date(m.target_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

      </div>
    </PageWrapper>
  );
};

export default Goals;
