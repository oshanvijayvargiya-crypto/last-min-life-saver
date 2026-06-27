import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Brain,
  Calendar,
  Award,
  MessageSquare
} from 'lucide-react';

export const BottomNav = () => {
  const items = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dash' },
    { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { to: '/planner', icon: Brain, label: 'Planner' },
    { to: '/calendar', icon: Calendar, label: 'Cal' },
    { to: '/goals', icon: Award, label: 'Goals' },
    { to: '/coach', icon: MessageSquare, label: 'Coach' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-darkSurface/90 backdrop-blur-lg border-t border-white/5 flex items-center justify-around px-2 z-20 md:hidden">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${
                isActive ? 'text-accentPurple scale-110' : 'text-textMuted hover:text-white'
              }`
            }
          >
            <Icon size={20} />
            <span className="text-[9px] mt-0.5 font-medium">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default BottomNav;
