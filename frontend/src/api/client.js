import axios from 'axios';
import { Capacitor } from '@capacitor/core';

export const getApiBaseUrl = () => {
  const saved = localStorage.getItem('planotech_api_url');
  if (saved) return saved;

  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Capacitor native platform detection
  if (Capacitor.isNativePlatform()) {
    const platform = Capacitor.getPlatform();
    if (platform === 'android') {
      return 'http://10.0.2.2:8000/api';
    }
    if (platform === 'ios') {
      return 'http://localhost:8000/api';
    }
  }

  return '/api';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setApiBaseUrl = (url) => {
  let cleaned = url.trim();
  if (cleaned.endsWith('/')) {
    cleaned = cleaned.slice(0, -1);
  }
  if (!cleaned.endsWith('/api') && cleaned.startsWith('http')) {
    cleaned = `${cleaned}/api`;
  }
  localStorage.setItem('planotech_api_url', cleaned);
  api.defaults.baseURL = cleaned;
};

api.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  const token = localStorage.getItem('planotech_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('planotech_token');
      localStorage.removeItem('planotech_user');
    }
    return Promise.reject(error);
  }
);

export default api;
