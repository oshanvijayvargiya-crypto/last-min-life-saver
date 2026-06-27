import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Landing } from './pages/Landing.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { Tasks } from './pages/Tasks.jsx';
import { Planner } from './pages/Planner.jsx';
import { Calendar } from './pages/Calendar.jsx';
import { Goals } from './pages/Goals.jsx';
import { Coach } from './pages/Coach.jsx';
import { Settings } from './pages/Settings.jsx';

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Public Marketing/Auth screen */}
        <Route path="/" element={<Landing />} />

        {/* Workspace Dashboard & Productivity Tools */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/planner" element={<Planner />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/coach" element={<Coach />} />
        <Route path="/settings" element={<Settings />} />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
