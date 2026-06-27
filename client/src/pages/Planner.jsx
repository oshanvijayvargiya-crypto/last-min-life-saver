import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore.js';
import { PageWrapper } from '../components/layout/PageWrapper.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { api } from '../services/api.js';
import {
  Brain, Play, Pause, RotateCcw, Calendar, Check,
  Clock, Sparkles, Send, Coffee, Flame, AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import clsx from 'clsx';

export const Planner = () => {
  const { tasks, fetchTasks } = useStore();
  const [promptText, setPromptText] = useState('');
  const [scheduleData, setScheduleData] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  // Pomodoro Timer States
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isBreakMode, setIsBreakMode] = useState(false);
  const timerIntervalRef = useRef(null);

  const playNativeChime = (type = 'sine') => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(type === 'sine' ? 523.25 : 349.23, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.warn("AudioContext failed to start (interaction required first).");
    }
  };

  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        if (timerSeconds > 0) {
          setTimerSeconds((prev) => prev - 1);
        } else if (timerSeconds === 0) {
          if (timerMinutes > 0) {
            setTimerMinutes((prev) => prev - 1);
            setTimerSeconds(59);
          } else {
            handleTimerComplete();
          }
        }
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning, timerMinutes, timerSeconds]);

  const handleTimerComplete = () => {
    setIsTimerRunning(false);
    playNativeChime(isBreakMode ? 'sine' : 'triangle');
    confetti({
      particleCount: 50,
      spread: 60,
      colors: ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']
    });

    if (isBreakMode) {
      setIsBreakMode(false);
      setTimerMinutes(25);
    } else {
      setIsBreakMode(true);
      setTimerMinutes(5);
    }
    setTimerSeconds(0);
  };

  const handleStartPause = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTimerMinutes(isBreakMode ? 5 : 25);
    setTimerSeconds(0);
  };

  const handleSwitchMode = () => {
    setIsTimerRunning(false);
    const newMode = !isBreakMode;
    setIsBreakMode(newMode);
    setTimerMinutes(newMode ? 5 : 25);
    setTimerSeconds(0);
  };

  const handleGenerateWeeklyPlan = async (e) => {
    e.preventDefault();
    if (!promptText.trim()) return;

    setGenerating(true);
    setSyncSuccess(false);
    try {
      const plan = await api.ai.getDailyPlan([]);
      setScheduleData(plan);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleSyncToCalendar = async () => {
    if (!scheduleData || !scheduleData.schedule) return;
    
    setSyncing(true);
    setSyncSuccess(false);
    try {
      const workItems = scheduleData.schedule.filter(item => item.type === 'focus' || item.type === 'work');
      
      for (const item of workItems) {
        const today = new Date();
        const [hour, minute] = item.time.split(' ')[0].split(':');
        const isPM = item.time.includes('PM');
        
        const startTime = new Date(today);
        let startHr = parseInt(hour, 10);
        if (isPM && startHr < 12) startHr += 12;
        if (!isPM && startHr === 12) startHr = 0;
        
        startTime.setHours(startHr, parseInt(minute, 10), 0, 0);
        const endTime = new Date(startTime.getTime() + item.duration * 60 * 1000);

        await api.calendar.syncTask({
          title: item.label,
          description: "Auto-synced focus block from Last-Minute Life Saver.",
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString()
        });
      }
      
      setSyncSuccess(true);
      confetti({
        particleCount: 70,
        colors: ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']
      });
    } catch (err) {
      console.error("Sync calendar failed:", err.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <PageWrapper>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Pomodoro Focus Timer */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <Card className={clsx(
            "flex flex-col items-center justify-center pb-8 transition-colors duration-300",
            isTimerRunning && "border-accentPurple/30 pomodoro-active"
          )}>
            <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4 w-full select-none">
              {isBreakMode ? <Coffee size={20} className="text-success" /> : <Flame size={20} className="text-accentPurple" />}
              <h3 className="font-bold text-base text-white">
                {isBreakMode ? "Coffee Break Timer" : "Deep Work Timer"}
              </h3>
            </div>

            {/* Circular Timer Widget */}
            <div className="relative w-56 h-56 rounded-full border-4 border-white/5 bg-white/[0.02] flex items-center justify-center shadow-2xl my-6">
              <span className="text-6xl font-bold font-mono tracking-tighter text-white select-none">
                {timerMinutes.toString().padStart(2, '0')}:
                {timerSeconds.toString().padStart(2, '0')}
              </span>
              
              {/* Spinning dashed ring when running */}
              {isTimerRunning && (
                <div className="absolute inset-2 border-2 border-dashed border-accentPurple/40 rounded-full animate-spin-slow" />
              )}

              {/* Status Tag */}
              <Badge variant="primary" className="absolute -bottom-2 select-none">
                {isBreakMode ? "Rest Mode" : "Focus Zone"}
              </Badge>
            </div>

            {/* Controls */}
            <div className="flex gap-4 px-6 w-full mt-4">
              <Button
                variant="primary"
                onClick={handleStartPause}
                className="flex-1"
              >
                {isTimerRunning ? <Pause size={16} /> : <Play size={16} />}
                <span>{isTimerRunning ? "Pause" : "Start Focus"}</span>
              </Button>
              
              <Button
                variant="secondary"
                onClick={handleResetTimer}
                className="px-4"
                title="Reset timer"
              >
                <RotateCcw size={16} />
              </Button>
            </div>

            {/* Switch Mode Button */}
            <button
              onClick={handleSwitchMode}
              className="text-xs text-textMuted hover:text-white uppercase tracking-wider font-semibold mt-4 underline decoration-dotted transition-colors"
            >
              Switch to {isBreakMode ? "Focus Mode" : "Break Mode"}
            </button>
          </Card>

          {/* Productivity Tip Card */}
          <Card className="flex gap-4 items-start border-l-4 border-accentPurple/40 bg-white/[0.01]">
            <AlertCircle size={18} className="text-accentPurple mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-xs font-semibold text-textMuted uppercase tracking-wider">The Pomodoro Method</h4>
              <p className="text-sm text-textMuted mt-1.5 leading-relaxed">
                Focus entirely on a single task for 25 minutes. Do not check social networks or other windows. Break for 5 minutes when the alarm rings. Repeat 4 times.
              </p>
            </div>
          </Card>
        </div>

        {/* Right Column: AI Schedule Blocks */}
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4 select-none">
              <Brain size={20} className="text-accentPurple" />
              <h3 className="font-bold text-base text-white">AI SCHEDULE GENERATOR</h3>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-textMuted leading-relaxed">
                Describe your weekly workload, tasks, or procrastination bottlenecks below. The AI Coach will outline a time-blocked day plan, optimizing break times.
              </p>

              <form onSubmit={handleGenerateWeeklyPlan} className="flex flex-col md:flex-row gap-3 items-end">
                <div className="flex-1 w-full">
                  <Input
                    placeholder="e.g. I have a design review on Friday, an exam tomorrow, and want to hit the gym."
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={generating}
                  loading={generating}
                  className="w-full md:w-auto h-[46px]"
                >
                  <span>Plan</span>
                </Button>
              </form>
            </div>
          </Card>

          {scheduleData && (
            <Card className="animate-in fade-in duration-200">
              <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4 select-none flex-wrap gap-4">
                <h3 className="font-bold text-base text-white">GENERATED WAR PLAN</h3>
                
                <div className="flex items-center gap-2 flex-wrap">
                  {syncSuccess ? (
                    <Badge variant="success">
                      ✓ Synced!
                    </Badge>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleSyncToCalendar}
                      disabled={syncing}
                      loading={syncing}
                      className="flex items-center gap-1.5"
                    >
                      <Calendar size={14} />
                      <span>Sync Calendar</span>
                    </Button>
                  )}
                  
                  <Button
                    variant="glass"
                    size="sm"
                    onClick={handleGenerateWeeklyPlan}
                  >
                    Regenerate
                  </Button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="border-l-4 border-accentPurple bg-white/5 p-4 rounded-xl font-medium text-sm text-textMuted italic">
                  "{scheduleData.plan_summary}"
                </div>

                <div className="space-y-3.5">
                  {scheduleData.schedule?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                      <div className="flex items-center gap-3">
                        {/* Round color indicators */}
                        <span className={clsx(
                          "h-2 w-2 rounded-full",
                          item.type === 'focus' ? 'bg-accentPurple shadow-[0_0_8px_rgba(255, 107, 0, 0.4)]' :
                          item.type === 'break' ? 'bg-success shadow-[0_0_8px_rgba(16,185,129,0.4)]' :
                          'bg-accentBlue shadow-[0_0_8px_rgba(255, 170, 0, 0.4)]'
                        )} />
                        <div>
                          <p className="text-sm font-semibold text-textPrimary leading-tight">{item.label}</p>
                          <span className="text-xs text-textMuted block mt-1 font-medium">
                            {item.time} ({item.duration} minutes)
                          </span>
                        </div>
                      </div>
                      
                      <Badge variant={
                        item.type === 'focus' ? 'primary' :
                        item.type === 'break' ? 'success' : 'secondary'
                      }>
                        {item.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>

      </div>
    </PageWrapper>
  );
};

export default Planner;
