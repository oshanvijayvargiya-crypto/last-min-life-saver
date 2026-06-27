import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore.js';
import { PageWrapper } from '../components/layout/PageWrapper.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import {
  Settings as SettingsIcon, Calendar, Bell, Download, ShieldCheck,
  User, Sun, Moon, Info
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const Settings = () => {
  const { user, updateSettings, tasks } = useStore();

  // Local Form state
  const [workStart, setWorkStart] = useState('09:00');
  const [workEnd, setWorkEnd] = useState('17:00');
  const [style, setStyle] = useState('Deep Work');
  const [notifsEnabled, setNotifsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [calendarConnected, setCalendarConnected] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setWorkStart(user.work_hours_start?.substring(0, 5) || '09:00');
      setWorkEnd(user.work_hours_end?.substring(0, 5) || '17:00');
      setStyle(user.productivity_style || 'Deep Work');
    }
  }, [user]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    
    try {
      await updateSettings({
        work_hours_start: workStart + ':00',
        work_hours_end: workEnd + ':00',
        productivity_style: style
      });

      setSaveSuccess(true);
      confetti({
        particleCount: 40,
        spread: 30,
        colors: ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']
      });

      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleExportCSV = () => {
    if (tasks.length === 0) {
      alert("No task history available to export.");
      return;
    }

    const headers = ["ID", "Title", "Category", "Deadline", "Est Minutes", "Priority Score", "Urgency", "Status", "Notes", "Created At", "Completed At"];
    const rows = tasks.map(t => [
      t.id,
      `"${t.title.replace(/"/g, '""')}"`,
      t.category,
      t.deadline || '',
      t.estimated_minutes,
      t.priority_score,
      t.urgency_level,
      t.status,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
      t.created_at,
      t.completed_at || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "life_saver_productivity_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PageWrapper>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Form Settings */}
        <div className="lg:col-span-8 space-y-6">
          <Card>
            <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4 select-none">
              <SettingsIcon size={20} className="text-accentPurple" />
              <h3 className="font-bold text-base text-white">AI SCHEDULING RULES</h3>
            </div>
            
            <form onSubmit={handleSaveSettings} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-1.5 select-none">Work Hours Start</span>
                  <input
                    type="time"
                    value={workStart}
                    onChange={(e) => setWorkStart(e.target.value)}
                    className="glass-input px-4 py-2.5 rounded-xl text-sm w-full focus:outline-none focus:border-accentPurple transition-all"
                  />
                </div>
                
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-1.5 select-none">Work Hours End</span>
                  <input
                    type="time"
                    value={workEnd}
                    onChange={(e) => setWorkEnd(e.target.value)}
                    className="glass-input px-4 py-2.5 rounded-xl text-sm w-full focus:outline-none focus:border-accentPurple transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-1.5 select-none">
                  Productivity Style Focus
                </label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="glass-input rounded-xl px-4 py-2.5 text-sm w-full focus:outline-none focus:border-accentPurple transition-all"
                >
                  <option value="Deep Work" className="bg-darkSurface text-textPrimary">Deep Work (long, high-focus time blocks)</option>
                  <option value="Flexible" className="bg-darkSurface text-textPrimary">Flexible (balanced meetings + quick tasks)</option>
                  <option value="Sprints" className="bg-darkSurface text-textPrimary">Sprints (25m sprints + frequent breaks)</option>
                </select>
              </div>

              <hr className="border-t border-white/5 my-6" />

              <div className="flex items-center justify-between pt-2">
                {saveSuccess ? (
                  <Badge variant="success">
                    ✓ Settings Saved
                  </Badge>
                ) : <span />}
                
                <Button
                  type="submit"
                  disabled={saving}
                  loading={saving}
                  className="h-12 px-8"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>

          {/* Connected Integrations */}
          <Card>
            <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4 select-none">
              <Calendar size={20} className="text-accentBlue" />
              <h3 className="font-bold text-base text-white">CONNECTIONS & INTEGRATIONS</h3>
            </div>

            <div className="space-y-4">
              {/* Google Cal */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-accentBlue">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-textPrimary leading-tight">Google Calendar Integration</p>
                    <p className="text-xs text-textMuted mt-1">Read scheduled meetings & overlay tasks</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant={calendarConnected ? 'success' : 'info'}>
                    {calendarConnected ? 'Connected' : 'Offline'}
                  </Badge>
                  
                  <Button
                    variant="glass"
                    size="sm"
                    onClick={() => setCalendarConnected(!calendarConnected)}
                  >
                    {calendarConnected ? 'Disconnect' : 'Connect'}
                  </Button>
                </div>
              </div>

              {/* Push Nudges */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-orange-400">
                    <Bell size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-textPrimary leading-tight">Smart Nudge Alarms</p>
                    <p className="text-xs text-textMuted mt-1">Push browser alerts at critical windows</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant={notifsEnabled ? 'success' : 'info'}>
                    {notifsEnabled ? 'Active' : 'Muted'}
                  </Badge>
                  
                  <Button
                    variant="glass"
                    size="sm"
                    onClick={() => setNotifsEnabled(!notifsEnabled)}
                  >
                    {notifsEnabled ? 'Mute' : 'Enable'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Account Meta & Backup */}
        <div className="lg:col-span-4 space-y-6">
          {/* User Profile Card */}
          <Card className="text-center relative select-none">
            <img
              src={user?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=Rahul'}
              alt={user?.name}
              className="h-20 w-20 rounded-full border border-white/10 bg-darkBg mx-auto mb-4 shadow-xl"
            />
            
            <h4 className="font-semibold text-lg text-textPrimary leading-tight">{user?.name || 'Rahul Kumar'}</h4>
            <p className="text-xs text-textMuted mt-1">{user?.email || 'rahul.mock@gmail.com'}</p>
            
            <div className="grid grid-cols-2 gap-4 mt-6 border-t border-white/5 pt-6">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                <span className="text-2xl font-bold text-accentPurple block">🏆 {user?.xp_points || 0}</span>
                <span className="text-[10px] uppercase font-semibold text-textMuted mt-1 block">XP Points</span>
              </div>
              
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                <span className="text-2xl font-bold text-warning block">🔥 {user?.streak_count || 0}</span>
                <span className="text-[10px] uppercase font-semibold text-textMuted mt-1 block">Active Streak</span>
              </div>
            </div>
          </Card>

          {/* Backup utility */}
          <Card>
            <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4 select-none">
              <Download size={20} className="text-success" />
              <h3 className="font-bold text-base text-white">BACKUP & EXPORT</h3>
            </div>
            
            <div className="space-y-4">
              <p className="text-xs text-textMuted leading-relaxed">
                Download your complete workspace database (tasks, status counts, milestone details) as a local CSV document.
              </p>

              <Button
                variant="secondary"
                onClick={handleExportCSV}
                className="w-full flex items-center justify-center gap-2"
              >
                <Download size={14} />
                <span>Export Task History (.csv)</span>
              </Button>
            </div>
          </Card>

          {/* Design Info */}
          <Card className="border border-accentPurple/20 bg-accentPurple/5">
            <div className="flex items-center gap-2 mb-4 select-none">
              <Info size={18} className="text-accentPurple" />
              <h4 className="font-bold text-sm text-textPrimary uppercase tracking-wider">SYSTEM SPECIFICATIONS</h4>
            </div>
            <div className="text-xs text-textMuted space-y-2 leading-relaxed">
              <p>Theme: High-Fidelity Dark Glassmorphism</p>
              <p>Engine: Google Gemini Pro AI Planner</p>
              <p>Bypasses: Mock Fallbacks activated for Database & Google APIs</p>
              <p>Database: Supabase PostgreSQL Cloud</p>
            </div>
          </Card>
        </div>

        {/* Right Column: Account Meta & Backup Ends */}
      </div>
    </PageWrapper>
  );
};

export default Settings;
