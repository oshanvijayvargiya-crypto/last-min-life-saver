import React from 'react';
import { Flame, ArrowRight, Zap, Brain, Calendar, ShieldCheck, Volume2 } from 'lucide-react';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';

export const Landing = () => {
  const handleGoogleLogin = () => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    window.location.href = `${apiBase}/auth/google`;
  };

  const handleMockLogin = () => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    window.location.href = `${apiBase}/auth/mock-login`;
  };

  const features = [
    {
      title: "AI Prioritization",
      desc: "Our priority algorithm parses tasks, effort, and deadlines automatically with Gemini.",
      icon: Brain,
      color: "text-accentPurple"
    },
    {
      title: "Google Calendar Sync",
      desc: "Instantly fetch meetings and overlay tasks to find the best scheduling slots.",
      icon: Calendar,
      color: "text-accentBlue"
    },
    {
      title: "Voice Task Intake",
      desc: "Speak naturally in English or Hindi. Speak your tasks directly into existence.",
      icon: Volume2,
      color: "text-success"
    },
    {
      title: "Smart Escalations",
      desc: "Receive smart nudge reminders at critical windows: 7 days, 3 days, 1 day, and 3 hours.",
      icon: Zap,
      color: "text-warning"
    }
  ];

  return (
    <div className="min-h-screen bg-darkBg text-textPrimary relative flex flex-col justify-between overflow-hidden">
      {/* Ambient BG Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-accentPurple/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accentBlue/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Navbar Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-accentPurple to-accentBlue p-2 rounded-xl text-white shadow-lg">
            <Flame size={20} className="animate-pulse" />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight text-white tracking-wide">
              Last-Minute
            </h1>
            <span className="text-xs text-accentBlue font-medium">Life Saver</span>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleMockLogin}
        >
          Demo Mode
        </Button>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto w-full px-6 flex-1 flex flex-col lg:grid lg:grid-cols-12 items-center justify-center gap-12 z-10 py-16">
        
        {/* Left column */}
        <div className="lg:col-span-7 flex flex-col text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-xs text-textMuted font-semibold mb-6 w-fit mx-auto lg:mx-0">
            <Zap size={14} className="text-accentPurple" />
            <span>AI Productivity Companion</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.1] text-center lg:text-left">
            Never Miss a <br />
            <span className="gradient-text">Deadline</span> <br />
            Again.
          </h1>

          <p className="text-textMuted text-base md:text-lg mb-8 max-w-xl leading-relaxed text-center lg:text-left">
            An intelligent companion powered by Google Gemini AI that organizes your schedule, prioritizes tasks automatically, syncs calendar events, and coaches you past procrastinations.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
            <Button
              variant="primary"
              size="lg"
              onClick={handleGoogleLogin}
              className="flex items-center gap-2 group w-full sm:w-auto"
            >
              <span>Login with Google</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button
              variant="secondary"
              size="lg"
              onClick={handleMockLogin}
              className="w-full sm:w-auto"
            >
              Quick Test Drive
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4 justify-center lg:justify-start text-xs text-textMuted select-none">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-success" /> Free & Open API
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-success" /> Secure Google OAuth
            </span>
          </div>
        </div>

        {/* Right column (Dashboard Preview Mockup) */}
        <div className="lg:col-span-5 w-full max-w-lg lg:max-w-none flex justify-center items-center">
          <div className="glass-panel p-6 rounded-2xl w-full shadow-2xl relative overflow-hidden">
            {/* Mockup Dot Controls */}
            <div className="flex gap-1.5 mb-6">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            
            <div className="flex flex-col gap-4">
              {/* Mini dashboard grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col justify-between h-24">
                  <span className="text-[10px] text-textMuted uppercase font-semibold tracking-wider">Today's Focus</span>
                  <span className="text-xs font-semibold text-textPrimary leading-tight">Complete Web App Refactor</span>
                  <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden mt-1">
                    <div className="bg-accentPurple h-full w-[65%]" />
                  </div>
                </div>
                
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col justify-between h-24 items-center text-center">
                  <span className="text-[9px] text-textMuted uppercase font-semibold">Habit Flame</span>
                  <span className="text-xl font-bold text-orange-400">🔥 7</span>
                  <span className="text-[9px] text-textMuted uppercase font-semibold">Streak</span>
                </div>
              </div>

              {/* List Preview */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col gap-2">
                <span className="text-[10px] text-textMuted font-semibold uppercase tracking-wider">Priority Pipeline</span>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-xs font-medium text-textPrimary">🔴 Finalize Supabase Schema</span>
                  <span className="px-2 py-0.5 rounded bg-danger/10 border border-danger/20 text-danger text-[8px] font-semibold">P1 • 2h</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-xs font-medium text-textPrimary">🧡 OAuth Redirect URL Config</span>
                  <span className="px-2 py-0.5 rounded bg-warning/10 border border-warning/20 text-warning text-[8px] font-semibold">P2 • 1d</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Feature Grid */}
      <section className="py-20 z-10 w-full max-w-7xl mx-auto px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-center text-white font-bold text-3xl md:text-4xl mb-12 tracking-tight">
            Features Packed for Productivity
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <Card key={idx} className="hover:border-white/10 transition-colors duration-300">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 mb-4 ${feat.color}`}>
                    <Icon size={24} />
                  </div>
                  <h3 className="font-bold text-lg text-white mb-2">{feat.title}</h3>
                  <p className="text-sm text-textMuted leading-relaxed">{feat.desc}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 w-full max-w-7xl mx-auto px-6 text-center text-xs text-textMuted">
        <p className="font-medium tracking-wide">
          © 2026 Last-Minute Life Saver. Powered by Gemini & Google Calendar API.
        </p>
      </footer>
    </div>
  );
};

export default Landing;
