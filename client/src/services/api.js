const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  
  options.credentials = 'include';
  options.headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // Automatically attach mock user ID header if present in cookies
  const mockUserId = getCookie('mock_user_id');
  if (mockUserId) {
    options.headers['x-mock-user-id'] = mockUserId;
  }

  // Automatically attach JWT token from localStorage if present
  const token = localStorage.getItem('token');
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }
  
  return response.json();
}

export const api = {
  auth: {
    me: () => request('/auth/me'),
    logout: () => request('/auth/logout', { method: 'POST' }),
  },
  tasks: {
    getAll: () => request('/tasks'),
    create: (data) => request('/tasks', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    complete: (id) => request(`/tasks/${id}/complete`, { method: 'PUT' }),
    delete: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
  },
  goals: {
    getAll: () => request('/goals'),
    create: (data) => request('/goals', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/goals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    toggleMilestone: (id, completed) => request(`/goals/milestones/${id}/toggle`, { method: 'PUT', body: JSON.stringify({ completed }) }),
    logHabit: (id, data) => request(`/goals/habits/${id}/log`, { method: 'POST', body: JSON.stringify(data) }),
    delete: (id) => request(`/goals/${id}`, { method: 'DELETE' }),
  },
  ai: {
    getDailyPlan: (calendarEvents) => request('/ai/daily-plan', { method: 'POST', body: JSON.stringify({ calendarEvents }) }),
    coachChat: (message) => request('/ai/coach', { method: 'POST', body: JSON.stringify({ message }) }),
    getCoachHistory: () => request('/ai/coach/history'),
    getWeeklyReview: () => request('/ai/weekly-review', { method: 'POST' }),
  },
  calendar: {
    getEvents: (start, end) => {
      const q = start ? `?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}` : '';
      return request(`/calendar/events${q}`);
    },
    syncTask: (data) => request('/calendar/sync', { method: 'POST', body: JSON.stringify(data) }),
  },
  users: {
    updateSettings: (data) => request('/users/settings', { method: 'PUT', body: JSON.stringify(data) }),
  }
};
export default api;
