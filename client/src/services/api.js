// client/src/services/api.js — Axios API service layer

import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eventzed_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('eventzed_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ────────────────────────────────────────────────────
export const login    = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);
export const getMe    = ()     => api.get('/auth/me');

// ── Events ──────────────────────────────────────────────────
export const getEvents   = (params) => api.get('/events', { params });
export const getEvent    = (id)     => api.get(`/events/${id}`);
export const createEvent = (data)   => api.post('/events', data);
export const updateEvent = (id, data) => api.put(`/events/${id}`, data);
export const deleteEvent = (id)     => api.delete(`/events/${id}`);

// ── Attendees ───────────────────────────────────────────────
export const getAttendees    = (eventId) => api.get('/attendees', { params: { eventId } });
export const registerForEvent = (data)   => api.post('/attendees', data);
export const removeAttendee  = (id)      => api.delete(`/attendees/${id}`);

// ── Files ───────────────────────────────────────────────────
export const getFiles   = (eventId) => api.get('/files', { params: { eventId } });
export const uploadFile = (formData) => api.post('/files/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const deleteFile = (id) => api.delete(`/files/${id}`);

export default api;
