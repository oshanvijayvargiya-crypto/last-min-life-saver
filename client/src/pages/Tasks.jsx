import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore.js';
import { PageWrapper } from '../components/layout/PageWrapper.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { calculatePriorityScore, getPriorityBadgeColor } from '../utils/priorityCalculator.js';
import { useVoice } from '../hooks/useVoice.js';
import {
  Mic, MicOff, Check, Trash2, Calendar, Clock,
  Filter, Sparkles, SlidersHorizontal, Plus
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const Tasks = () => {
  const { tasks, addTask, completeTask, deleteTask, fetchTasks } = useStore();

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Work');
  const [deadline, setDeadline] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [userOverride, setUserOverride] = useState('none');
  const [notes, setNotes] = useState('');

  // Filtering State
  const [timeFilter, setTimeFilter] = useState('all'); // all, today, week, overdue
  const [catFilter, setCatFilter] = useState('all'); // all, Work, Study, etc.

  useEffect(() => {
    fetchTasks();
  }, []);

  // Voice Input Setup
  const {
    isListening,
    startListening,
    stopListening,
    browserSupportsSpeech,
    error: voiceError
  } = useVoice((text) => {
    setTitle(text);
  });

  // Calculate live preview score for the form
  const { priorityScore, urgencyLevel } = calculatePriorityScore(
    deadline,
    category,
    estimatedMinutes,
    userOverride
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    await addTask({
      title,
      category,
      deadline: deadline || null,
      estimated_minutes: parseInt(estimatedMinutes, 10),
      user_override: userOverride,
      notes
    });

    // Reset Form
    setTitle('');
    setCategory('Work');
    setDeadline('');
    setEstimatedMinutes(30);
    setUserOverride('none');
    setNotes('');
  };

  const handleComplete = async (id) => {
    try {
      await completeTask(id);
      confetti({
        particleCount: 100,
        spread: 70,
        colors: ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
        origin: { y: 0.8 }
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Helper to format deadline text
  const getDeadlineText = (dateStr) => {
    if (!dateStr) return 'No deadline';
    const dl = new Date(dateStr);
    const now = new Date();
    const diffMs = dl - now;
    
    if (diffMs < 0) {
      return <span className="text-danger font-semibold">Overdue 🩹</span>;
    }

    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHrs < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return <span className="text-danger font-semibold">Due in {diffMins} mins 🚨</span>;
    }
    if (diffHrs < 24) {
      return <span className="text-warning font-semibold">Due in {diffHrs}h ⏰</span>;
    }

    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
  };

  // Apply filters
  const filteredTasks = (tasks || []).filter(task => {
    if (!task) return false;
    
    // 1. Category Filter
    if (catFilter !== 'all' && task.category !== catFilter) return false;

    // 2. Status/Time Filter
    const now = new Date();
    const todayStr = now.toDateString();

    if (timeFilter === 'today') {
      if (task.status === 'completed' || !task.deadline) return false;
      return new Date(task.deadline).toDateString() === todayStr;
    }

    if (timeFilter === 'week') {
      if (task.status === 'completed' || !task.deadline) return false;
      const diffDays = (new Date(task.deadline) - now) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 7;
    }

    if (timeFilter === 'overdue') {
      return task.status === 'overdue';
    }

    return true; // "all"
  }).sort((a, b) => {
    if (!a || !b) return 0;
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;
    return b.priority_score - a.priority_score;
  });

  return (
    <PageWrapper>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Intake Creation Form */}
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4 select-none">
              <Sparkles size={20} className="text-accentPurple" />
              <h3 className="font-bold text-base text-white">ADD NEW TASK</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Task Title with Voice Input */}
              <div className="relative">
                <Input
                  label="Task Title"
                  placeholder="e.g. Code auth callback endpoints"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
                
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`absolute right-2 top-8 p-1.5 rounded-lg text-textMuted hover:text-white transition-all ${
                    isListening ? 'bg-danger/20 text-danger animate-pulse' : 'hover:bg-white/5'
                  }`}
                  title={isListening ? "Stop listening" : "Start voice dictation"}
                >
                  {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
              </div>

              {voiceError && (
                <p className="text-[10px] text-danger font-semibold mt-1 uppercase">{voiceError}</p>
              )}

              {/* Category selector */}
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-1.5 select-none">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="glass-input rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:border-accentPurple transition-all"
                >
                  <option value="Work" className="bg-darkSurface text-textPrimary">Work</option>
                  <option value="Study" className="bg-darkSurface text-textPrimary">Study</option>
                  <option value="Personal" className="bg-darkSurface text-textPrimary">Personal</option>
                  <option value="Finance" className="bg-darkSurface text-textPrimary">Finance</option>
                  <option value="Health" className="bg-darkSurface text-textPrimary">Health</option>
                </select>
              </div>

              {/* Estimated duration slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-[10px] text-textMuted font-semibold uppercase tracking-wider select-none">
                  <span>Effort Duration</span>
                  <span className="text-accentPurple font-bold">{estimatedMinutes} Mins</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="240"
                  step="5"
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(parseInt(e.target.value, 10))}
                  className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-accentPurple"
                />
              </div>

              {/* Deadline Picker */}
              <Input
                label="Deadline Date & Time"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />

              {/* Override Priority option */}
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-1.5 select-none">
                  Manual Priority Override
                </label>
                <select
                  value={userOverride}
                  onChange={(e) => setUserOverride(e.target.value)}
                  className="glass-input rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:border-accentPurple transition-all"
                >
                  <option value="none" className="bg-darkSurface text-textPrimary">Let AI Decide Priority</option>
                  <option value="P1" className="bg-darkSurface text-textPrimary">P1 (Emergency Alert)</option>
                  <option value="P2" className="bg-darkSurface text-textPrimary">P2 (High Priority)</option>
                  <option value="P3" className="bg-darkSurface text-textPrimary">P3 (Medium Priority)</option>
                  <option value="P4" className="bg-darkSurface text-textPrimary">P4 (Low Priority)</option>
                </select>
              </div>

              {/* Notes */}
              <Input
                label="Notes"
                placeholder="Additional instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              {/* Live Preview Indicator */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs select-none">
                <div className="flex items-center gap-1.5 text-textMuted font-semibold uppercase">
                  <SlidersHorizontal size={14} />
                  <span>Real-time AI Score:</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-textPrimary bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg">
                    {priorityScore}
                  </span>
                  <Badge variant={
                    urgencyLevel === 'P1' ? 'danger' :
                    urgencyLevel === 'P2' ? 'warning' :
                    urgencyLevel === 'P3' ? 'primary' : 'info'
                  }>
                    {urgencyLevel}
                  </Badge>
                </div>
              </div>

              <Button type="submit" className="w-full flex items-center justify-center gap-2">
                <Plus size={16} />
                Create Task
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Column: Task List and Filters */}
        <div className="lg:col-span-8 space-y-6">
          {/* Filters Bar */}
          <Card className="flex flex-col md:flex-row gap-4 items-center justify-between p-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {['all', 'today', 'week', 'overdue'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTimeFilter(filter)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                    timeFilter === filter
                      ? 'bg-accentPurple text-white shadow-lg shadow-accentPurple/25'
                      : 'bg-white/5 text-textMuted hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <Filter size={14} className="text-textMuted" />
              <select
                value={catFilter}
                onChange={(e) => setCatFilter(e.target.value)}
                className="glass-input rounded-xl px-4 py-2 text-xs w-40 focus:outline-none h-9"
              >
                <option value="all" className="bg-darkSurface text-textPrimary">All Categories</option>
                <option value="Work" className="bg-darkSurface text-textPrimary">Work</option>
                <option value="Study" className="bg-darkSurface text-textPrimary">Study</option>
                <option value="Personal" className="bg-darkSurface text-textPrimary">Personal</option>
                <option value="Finance" className="bg-darkSurface text-textPrimary">Finance</option>
                <option value="Health" className="bg-darkSurface text-textPrimary">Health</option>
              </select>
            </div>
          </Card>

          {/* List display */}
          <div className="space-y-4">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-16 flex flex-col items-center justify-center gap-6">
                <p className="text-5xl md:text-6xl font-bold text-white/5 uppercase select-none tracking-tight">
                  NO TASKS YET
                </p>
                <Button onClick={() => setTimeFilter('all')} variant="secondary" size="sm">
                  Show All Tasks
                </Button>
              </div>
            ) : (
              filteredTasks.map((task) => {
                const isCompleted = task.status === 'completed';
                const accentColor = 
                  task.urgency_level === 'P1' ? 'bg-danger' :
                  task.urgency_level === 'P2' ? 'bg-warning' :
                  task.urgency_level === 'P3' ? 'bg-accentPurple' : 'bg-textMuted/40';

                return (
                  <Card
                    key={task.id}
                    className={`flex items-center justify-between p-4 relative pl-6 transition-all duration-200 hover:border-white/10 ${
                      isCompleted ? 'opacity-50' : ''
                    }`}
                  >
                    {/* Left Accent Strip */}
                    <span className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl ${accentColor}`} />

                    <div className="flex items-center gap-4 flex-1 overflow-hidden pr-4">
                      {/* Checkbox button */}
                      <button
                        onClick={() => !isCompleted && handleComplete(task.id)}
                        className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all ${
                          isCompleted
                            ? 'bg-success border-success text-white'
                            : 'bg-white/5 border-white/10 hover:border-accentPurple/50 hover:bg-accentPurple/5 text-transparent hover:text-accentPurple/50'
                        }`}
                        disabled={isCompleted}
                      >
                        <Check size={12} />
                      </button>

                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2.5">
                          <h4 className={`text-sm font-semibold text-textPrimary truncate ${isCompleted ? 'line-through text-textMuted' : ''}`}>
                            {task.title}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] text-textMuted font-medium uppercase select-none">
                            {task.category}
                          </span>
                        </div>
                        
                        {task.notes && (
                          <p className="text-[11px] text-textMuted mt-1 truncate max-w-md">
                            {task.notes}
                          </p>
                        )}

                        <div className="flex items-center gap-4 mt-2 text-[10px] text-textMuted select-none">
                          <span className="flex items-center gap-1 font-semibold">
                            <Calendar size={10} />
                            {getDeadlineText(task.deadline)}
                          </span>
                          <span className="flex items-center gap-1 font-semibold">
                            <Clock size={10} />
                            {task.estimated_minutes} mins
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Badge and actions */}
                    <div className="flex items-center gap-3">
                      <Badge variant={
                        task.urgency_level === 'P1' ? 'danger' :
                        task.urgency_level === 'P2' ? 'warning' :
                        task.urgency_level === 'P3' ? 'primary' : 'info'
                      }>
                        {task.urgency_level} ({Math.round(task.priority_score)})
                      </Badge>
                      
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-2 rounded-lg bg-white/5 border border-white/10 text-textMuted hover:text-danger hover:bg-danger/10 hover:border-danger/20 transition-all"
                        title="Delete Task"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>

      </div>
    </PageWrapper>
  );
};

export default Tasks;
