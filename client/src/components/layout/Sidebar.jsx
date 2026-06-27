import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Brain,
  Calendar,
  Award,
  MessageSquare,
  Settings,
  LogOut,
  Flame
} from 'lucide-react';
import { useStore } from '../../store/useStore.js';

export const Sidebar = () => {
  const { user, logout } = useStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/tasks', label: 'Tasks', icon: CheckSquare },
    { to: '/planner', label: 'AI Planner', icon: Brain },
    { to: '/calendar', label: 'Calendar', icon: Calendar },
    { to: '/goals', label: 'Goals & Habits', icon: Award },
    { to: '/coach', label: 'AI Coach', icon: MessageSquare },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-darkSurface border-r border-white/5 flex flex-col fixed top-0 bottom-0 left-0 z-20 hidden md:flex">
      {/* Brand Logo */}
      <div className="p-6 border-b border-white/5 flex items-center gap-3">
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

      {/* Navigation Links */}
      <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-accentPurple/10 text-accentPurple border-l-4 border-accentPurple pl-3.5 bg-white/[0.02]'
                    : 'text-textMuted hover:text-white hover:bg-white/[0.02]'
                }`
              }
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* User Stats & Logout */}
      {user && (
        <div className="p-6 border-t border-white/5 bg-white/[0.01]">
          <div className="flex items-center gap-3 mb-4">
            <img
              src={user.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=Rahul'}
              alt={user.name}
              className="h-10 w-10 rounded-xl border border-white/10 bg-darkBg"
            />
            <div className="overflow-hidden">
              <p className="font-semibold text-sm text-textPrimary truncate">{user.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex items-center text-xs text-orange-400 gap-0.5 font-medium">
                  🔥 {user.streak_count || 0}d
                </span>
                <span className="flex items-center text-xs text-accentBlue gap-0.5 font-medium">
                  ⚡ {user.xp_points || 0} XP
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-white/10 text-textMuted hover:text-white hover:bg-white/5 text-xs font-semibold transition-all duration-200 active:scale-95"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
