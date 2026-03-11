import axios from 'axios';
import Constants from 'expo-constants';
import { useAuth } from '../store/auth';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = useAuth.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      useAuth.getState().signOut();
    }
    return Promise.reject(error);
  }
);

export default api;
