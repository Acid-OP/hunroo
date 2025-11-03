import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
});

// Add token to requests automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Suppress console errors for expected 404s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't log 404 errors for profile endpoints (expected for new users)
    const is404 = error.response?.status === 404;
    const isProfileEndpoint = error.config?.url?.includes('/profile') || 
                               error.config?.url?.includes('/applications');
    
    if (!(is404 && isProfileEndpoint)) {
      console.error('API Error:', error.response?.data || error.message);
    }
    
    return Promise.reject(error);
  }
);