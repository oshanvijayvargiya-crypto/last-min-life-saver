import React, { useState, useEffect } from 'react';
import { Bell, Flame, Zap, Calendar as CalIcon, Check, X, ShieldAlert, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { useStore } from '../../store/useStore.js';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

export const TopBar = () => {
  const { user, notifications, dismissNotification, completeTask, logout } = useStore();
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [greeting, setGreeting] = useState('Welcome');
  const navigate = useNavigate();

  // Set greeting based on current local time
  useEffect(() => {
    const hr = new Date().getHours();
    if (hr < 12) setGreeting('Good morning');
    else if (hr < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  const handleNotificationAction = (notif) => {
    if (notif.type === 'OVERDUE' || notif.type === 'CRITICAL' || notif.type === 'URGENT') {
      navigate('/tasks');
    }
    dismissNotification(notif.id);
    setShowNotif(false);
  };

  return (
    <header className="h-16 border-b border-white/5 bg-darkBg/60 backdrop-blur-md flex items-center justify-between px-4 md:px-6 fixed top-0 left-0 right-0 z-10 md:left-64">
      {/* Greeting & Date */}
      <div className="min-w-0">
        <h2 className="text-sm font-bold text-white md:text-base flex items-center gap-1 truncate max-w-[120px] xs:max-w-none">
          {greeting}, <span className="gradient-text">{user?.name?.split(' ')[0] || 'Rahul'}</span>!
        </h2>
        <p className="text-[10px] text-textMuted font-medium flex items-center gap-1 mt-0.5">
          <CalIcon size={10} />
          {formattedDate}
        </p>
      </div>

      {/* Badges & Actions */}
      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        {/* Streak Counter Badge */}
        <div className="flex items-center gap-0.5 sm:gap-1 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs text-orange-400 font-semibold select-none">
          <Flame size={12} className="animate-pulse" />
          <span>{user?.streak_count || 0}d<span className="hidden sm:inline"> Streak</span></span>
        </div>

        {/* XP Points Badge */}
        <div className="flex items-center gap-0.5 sm:gap-1 bg-accentBlue/10 border border-accentBlue/20 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs text-accentBlue font-semibold select-none">
          <Zap size={12} />
          <span>{user?.xp_points || 0}<span className="hidden sm:inline"> XP</span></span>
        </div>

        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => { setShowNotif(!showNotif); setShowProfile(false); }}
            className="p-2 text-textMuted hover:text-white rounded-xl hover:bg-white/5 transition-all relative"
          >
            <Bell size={18} />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-danger animate-pulse" />
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotif && (
            <div className="absolute right-0 mt-3 w-80 bg-darkSurface border border-white/10 rounded-2xl p-4 shadow-2xl z-30">
              <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
                <span className="font-semibold text-xs text-textMuted uppercase tracking-wider">Smart Reminders</span>
                {notifications.length > 0 && (
                  <span className="bg-danger/10 text-danger text-[10px] px-2 py-0.5 rounded-full font-semibold">
                    {notifications.length} Active
                  </span>
                )}
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {notifications.length === 0 ? (
                  <p className="text-center text-xs text-textMuted py-6 font-medium">
                    No active deadline nudges! ✨
                  </p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={clsx(
                        "p-3 rounded-xl border relative flex flex-col gap-2",
                        notif.type === 'CRITICAL' && "bg-danger/5 border-danger/20 text-danger",
                        notif.type === 'URGENT' && "bg-orange-500/5 border-orange-500/20 text-orange-400",
                        notif.type === 'PREP' && "bg-accentPurple/5 border-accentPurple/20 text-accentPurple",
                        notif.type === 'OVERDUE' && "bg-danger/10 border-danger/30 text-rose-400"
                      )}
                    >
                      <button
                        onClick={() => dismissNotification(notif.id)}
                        className="absolute top-2.5 right-2.5 text-textMuted hover:text-white"
                      >
                        <X size={12} />
                      </button>
                      
                      <div className="flex items-start gap-2">
                        <ShieldAlert size={14} className="mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold pr-4 leading-tight">{notif.title}</p>
                          <p className="text-[11px] text-textMuted mt-1 leading-normal">{notif.message}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 mt-1">
                        <button
                          onClick={() => handleNotificationAction(notif)}
                          className="h-7 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-white text-[10px] font-semibold transition-all"
                        >
                          {notif.actionText}
                        </button>
                        <button
                          onClick={async () => {
                            await completeTask(notif.task.id);
                            dismissNotification(notif.id);
                          }}
                          className="h-7 w-7 rounded-lg bg-success text-white flex items-center justify-center hover:bg-success-dark transition-all"
                        >
                          <Check size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown Menu */}
        <div className="relative flex items-center">
          <button
            onClick={() => { setShowProfile(!showProfile); setShowNotif(false); }}
            className="flex items-center gap-1 focus:outline-none"
            title="User Settings & Logout"
          >
            <img
              src={user?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=Rahul'}
              alt={user?.name || 'User Profile'}
              className="h-8 w-8 rounded-xl border border-white/10 bg-darkBg object-cover cursor-pointer hover:border-accentPurple/50 transition-all"
            />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-11 w-48 bg-darkSurface border border-white/10 rounded-2xl p-2 shadow-2xl z-30 animate-in fade-in slide-in-from-top-2 duration-100">
              <div className="px-3 py-2 border-b border-white/5 mb-1.5 overflow-hidden select-none">
                <p className="text-xs font-semibold text-textPrimary truncate">{user?.name || 'Rahul Kumar'}</p>
                <p className="text-[10px] text-textMuted truncate">{user?.email || 'rahul.mock@gmail.com'}</p>
              </div>
              <button
                onClick={() => { navigate('/settings'); setShowProfile(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-semibold text-textMuted hover:text-white hover:bg-white/5 transition-all text-left"
              >
                <SettingsIcon size={14} />
                Settings
              </button>
              <button
                onClick={async () => {
                  await logout();
                  navigate('/');
                  setShowProfile(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-semibold text-danger hover:bg-danger/10 transition-all text-left"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
