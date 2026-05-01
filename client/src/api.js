import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Tasks
export const taskAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  getOne: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
};

// Reminders
export const reminderAPI = {
  getAll: (params) => api.get('/reminders', { params }),
  create: (data) => api.post('/reminders', data),
  update: (id, data) => api.put(`/reminders/${id}`, data),
  delete: (id) => api.delete(`/reminders/${id}`),
};

// Calendar
export const calendarAPI = {
  getAll: (params) => api.get('/calendar', { params }),
  create: (data) => api.post('/calendar', data),
  update: (id, data) => api.put(`/calendar/${id}`, data),
  delete: (id) => api.delete(`/calendar/${id}`),
};

// Diary
export const diaryAPI = {
  getAll: (params) => api.get('/diary', { params }),
  getMoodStats: () => api.get('/diary/mood-stats'),
  create: (data) => {
    if (data instanceof FormData) return api.post('/diary', data, { headers: { 'Content-Type': 'multipart/form-data' }});
    return api.post('/diary', data);
  },
  update: (id, data) => {
    if (data instanceof FormData) return api.put(`/diary/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' }});
    return api.put(`/diary/${id}`, data);
  },
  delete: (id) => api.delete(`/diary/${id}`),
};

// Gamification
export const gamificationAPI = {
  getStats: () => api.get('/gamification'),
  reset: () => api.post('/gamification/reset'),
  resetStreak: () => api.post('/gamification/reset-streak'),
};

// Dashboard
export const dashboardAPI = {
  getSummary: () => api.get('/dashboard'),
};

// Goals
export const goalAPI = {
  getAll: () => api.get('/goals'),
  create: (data) => api.post('/goals', data),
  update: (id, data) => api.put(`/goals/${id}`, data),
  delete: (id) => api.delete(`/goals/${id}`),
};

// Notes
export const noteAPI = {
  getAll: () => api.get('/notes'),
  create: (data) => api.post('/notes', data),
  update: (id, data) => api.put(`/notes/${id}`, data),
  delete: (id) => api.delete(`/notes/${id}`),
};

// Habits
export const habitAPI = {
  getAll: () => api.get('/habits'),
  create: (data) => api.post('/habits', data),
  update: (id, data) => api.put(`/habits/${id}`, data),
  toggle: (id, date) => api.post(`/habits/${id}/toggle`, { date }),
  delete: (id) => api.delete(`/habits/${id}`),
};

export default api;
