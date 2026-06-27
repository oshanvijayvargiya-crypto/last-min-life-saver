import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar.jsx';
import { BottomNav } from './BottomNav.jsx';
import { TopBar } from './TopBar.jsx';
import { useStore } from '../../store/useStore.js';

export const PageWrapper = ({ children }) => {
  const { user, fetchUser, loading } = useStore();
  const navigate = useNavigate();

  // Auth Protection: Fetch user profile on load. If not logged in, redirect to Landing Page (/)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('token', token);
      // Clean URL parameters to hide the token in query
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    // If loading completes and no user is authenticated, redirect
    if (!loading && !user) {
      // Check if we have a valid JWT token in localStorage or mock cookie bypass
      const hasToken = localStorage.getItem('token');
      const hasMockCookie = document.cookie.includes('mock_user_id');
      if (!hasToken && !hasMockCookie) {
        navigate('/');
      }
    }
  }, [user, loading, navigate]);

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-darkBg flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-accentPurple border-r-transparent border-b-2 border-accentBlue border-l-transparent" />
        <span className="text-xs text-textMuted mt-4 font-semibold uppercase tracking-wider animate-pulse">
          Syncing Productivity Cloud...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-darkBg text-textPrimary">
      <Sidebar />
      <TopBar />
      
      {/* Content Container */}
      <main className="pt-16 pb-16 md:pb-0 md:pl-64 min-h-screen flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="flex-1 p-4 md:p-8"
        >
          {children}
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
};

export default PageWrapper;
