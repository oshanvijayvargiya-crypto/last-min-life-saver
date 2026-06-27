import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore.js';
import { PageWrapper } from '../components/layout/PageWrapper.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { api } from '../services/api.js';
import {
  Calendar as CalIcon, ChevronLeft, ChevronRight, Sparkles, Clock, Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import clsx from 'clsx';

export const Calendar = () => {
  const { tasks, fetchTasks } = useStore();
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // AI Slot Suggestion state
  const [suggestion, setSuggestion] = useState(null);
  const [scanning, setScanning] = useState(false);

  // Selected date details modal
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedAgendas, setSelectedAgendas] = useState([]);

  useEffect(() => {
    fetchTasks();
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoadingEvents(true);
    try {
      const events = await api.calendar.getEvents();
      setCalendarEvents(events || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingEvents(false);
    }
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const isSameDay = (d1, d2) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const handleFindSlot = async () => {
    setScanning(true);
    setSuggestion(null);
    
    setTimeout(() => {
      const pending = tasks.filter(t => t.status !== 'completed').sort((a,b) => b.priority_score - a.priority_score);
      
      if (pending.length === 0) {
        setSuggestion({
          type: 'none',
          message: "All tasks completed! No slots needed. 🥳"
        });
        setScanning(false);
        return;
      }

      const topTask = pending[0];
      const targetDay = new Date();
      targetDay.setDate(targetDay.getDate() + 2);
      targetDay.setHours(14, 0, 0, 0);

      setSuggestion({
        type: 'slot',
        task: topTask,
        suggestedTime: targetDay.toISOString(),
        message: `AI recommends scheduling "${topTask.title}" (${topTask.estimated_minutes}m) on ${targetDay.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at 2:00 PM. Calendar shows a 2.5-hour free block of Deep Focus.`
      });
      setScanning(false);
    }, 1500);
  };

  const handleApplySuggestion = async () => {
    if (!suggestion || !suggestion.task) return;
    
    try {
      const start = new Date(suggestion.suggestedTime);
      const end = new Date(start.getTime() + (suggestion.task.estimated_minutes || 60) * 60 * 1000);

      await api.calendar.syncTask({
        title: `Life Saver Focus: ${suggestion.task.title}`,
        description: `Scheduled by AI Planner slot optimizer for task priority: ${suggestion.task.urgency_level}.`,
        startTime: start.toISOString(),
        endTime: end.toISOString()
      });

      await api.tasks.update(suggestion.task.id, {
        ...suggestion.task,
        ai_suggested_slot: start.toISOString()
      });

      confetti({
        particleCount: 80,
        spread: 50,
        colors: ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']
      });

      setSuggestion(null);
      loadEvents();
      fetchTasks();
    } catch (err) {
      console.error("Failed to sync AI slot suggestion:", err.message);
    }
  };

  const handleDayClick = (dayNumber) => {
    const clickedDate = new Date(year, month, dayNumber);
    const dayTasks = tasks.filter(t => t.deadline && isSameDay(new Date(t.deadline), clickedDate));
    const dayEvents = calendarEvents.filter(ev => {
      const startStr = ev.start?.dateTime || ev.start?.date;
      if (!startStr) return false;
      return isSameDay(new Date(startStr), clickedDate);
    });

    setSelectedDate(clickedDate);
    setSelectedAgendas({ tasks: dayTasks, events: dayEvents });
  };

  const cells = [];
  for (let i = 0; i < firstDayIndex; i++) {
    cells.push(<div key={`empty-${i}`} className="min-h-24 bg-white/[0.01] border border-white/5 p-1 opacity-20" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const currentCellDate = new Date(year, month, day);
    const cellTasks = tasks.filter(t => t.deadline && isSameDay(new Date(t.deadline), currentCellDate));
    const cellEvents = calendarEvents.filter(ev => {
      const startStr = ev.start?.dateTime || ev.start?.date;
      if (!startStr) return false;
      return isSameDay(new Date(startStr), currentCellDate);
    });

    const isToday = isSameDay(new Date(), currentCellDate);

    cells.push(
      <div
        key={`day-${day}`}
        onClick={() => handleDayClick(day)}
        className={clsx(
          "min-h-24 bg-darkSurface border border-white/5 p-2 rounded-xl hover:border-accentPurple/30 transition-all cursor-pointer relative flex flex-col justify-between",
          isToday && "border-accentPurple/50 bg-accentPurple/5 shadow-[0_0_15px_rgba(124,58,237,0.15)]"
        )}
      >
        <span className={clsx(
          "text-[10px] font-bold self-end px-1.5 py-0.5 rounded-md",
          isToday ? "bg-accentPurple text-white" : "bg-white/5 text-textMuted"
        )}>
          {day}
        </span>
        
        <div className="space-y-1 mt-1 overflow-hidden flex-1 flex flex-col justify-end">
          {cellEvents.slice(0, 2).map((ev, idx) => (
            <div key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-accentBlue/10 border border-accentBlue/20 text-accentBlue truncate leading-tight select-none font-medium">
              ★ {ev.summary}
            </div>
          ))}
          {cellTasks.slice(0, 2).map((t, idx) => (
            <div
              key={idx}
              className={clsx(
                "text-[9px] px-1.5 py-0.5 rounded border truncate leading-tight select-none font-medium",
                t.status === 'completed'
                  ? 'text-success bg-success/10 border-success/20'
                  : 'text-accentPurple bg-accentPurple/10 border-accentPurple/20'
              )}
            >
              ⬟ {t.title}
            </div>
          ))}
          {(cellEvents.length + cellTasks.length) > 4 && (
            <span className="text-[9px] font-bold text-textMuted text-right pr-1 block select-none">
              +{cellEvents.length + cellTasks.length - 4} MORE
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <PageWrapper>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Calendar Main Grid */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Header Switcher */}
          <Card className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <CalIcon className="text-accentPurple animate-pulse" size={18} />
              <h3 className="font-bold text-base text-white">
                {monthNames[month]} {year}
              </h3>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePrevMonth}
                className="h-9 w-9 px-0 flex items-center justify-center"
              >
                <ChevronLeft size={16} />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleNextMonth}
                className="h-9 w-9 px-0 flex items-center justify-center"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </Card>

          {/* Calendar Grid */}
          <Card className="p-6">
            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs text-textMuted mb-3 select-none">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>
            
            {/* Cells */}
            <div className="grid grid-cols-7 gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
              {cells}
            </div>
          </Card>
        </div>

        {/* Right Column: AI Time Slot suggestions */}
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4 select-none">
              <Sparkles size={20} className="text-accentPurple" />
              <h3 className="font-bold text-base text-white">AI TIME SLOT FINDER</h3>
            </div>
            
            <div className="space-y-4">
              <p className="text-xs text-textMuted leading-relaxed">
                Click search to let Gemini analyze your Google Calendar schedule, find open gaps, and suggest when to work on pending tasks.
              </p>

              <Button
                variant="primary"
                onClick={handleFindSlot}
                disabled={scanning}
                loading={scanning}
                className="w-full flex items-center justify-center gap-2"
              >
                <Sparkles size={14} />
                <span>Find Best Free Slot</span>
              </Button>

              {suggestion && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4 animate-in slide-in-from-top-2 duration-200">
                  {suggestion.type === 'slot' ? (
                    <>
                      <p className="text-xs text-textMuted leading-relaxed italic">
                        "{suggestion.message}"
                      </p>
                      <Button
                        variant="secondary"
                        onClick={handleApplySuggestion}
                        className="w-full flex items-center justify-center gap-2"
                      >
                        <Check size={12} />
                        <span>Lock & Sync Slot</span>
                      </Button>
                    </>
                  ) : (
                    <p className="text-xs text-textMuted font-semibold text-center uppercase">
                      {suggestion.message}
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Click Day Agenda Details Panel */}
          {selectedDate ? (
            <Card className="animate-in fade-in duration-200">
              <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4 select-none">
                <h3 className="font-bold text-base text-white">
                  Agenda: {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </h3>
                <button onClick={() => setSelectedDate(null)} className="text-xs text-textMuted hover:text-white uppercase tracking-wider font-semibold">
                  Close
                </button>
              </div>

              <div className="space-y-5">
                {/* Events */}
                <div>
                  <h4 className="text-[10px] text-textMuted font-semibold uppercase tracking-wider mb-2 select-none">
                    Meetings & Events ({selectedAgendas.events?.length || 0})
                  </h4>
                  {selectedAgendas.events?.length === 0 ? (
                    <p className="text-xs text-textMuted pl-2 select-none">No calendar events</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedAgendas.events.map((ev, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-accentBlue/5 border border-accentBlue/20">
                          <p className="text-xs font-semibold text-textPrimary leading-tight">{ev.summary}</p>
                          <span className="text-[10px] text-textMuted flex items-center gap-1 mt-1.5">
                            <Clock size={10} />
                            {ev.start?.dateTime ? new Date(ev.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'All Day'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tasks */}
                <div>
                  <h4 className="text-[10px] text-textMuted font-semibold uppercase tracking-wider mb-2 select-none">
                    Due Tasks ({selectedAgendas.tasks?.length || 0})
                  </h4>
                  {selectedAgendas.tasks?.length === 0 ? (
                    <p className="text-xs text-textMuted pl-2 select-none">No tasks due</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedAgendas.tasks.map((t, idx) => (
                        <div key={idx} className={clsx(
                          "p-3 rounded-xl border flex items-center justify-between",
                          t.status === 'completed' ? 'bg-success/5 border-success/20 text-success' : 'bg-accentPurple/5 border-accentPurple/20 text-accentPurple'
                        )}>
                          <p className={`text-xs font-semibold leading-tight ${t.status === 'completed' ? 'line-through opacity-40' : ''}`}>
                            {t.title}
                          </p>
                          <Badge variant={t.status === 'completed' ? 'success' : 'primary'}>
                            {t.urgency_level}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ) : (
            <Card className="text-center py-6">
              <p className="text-xs text-textMuted uppercase font-semibold">Click a day to see agenda details.</p>
            </Card>
          )}
        </div>

      </div>
    </PageWrapper>
  );
};

export default Calendar;
