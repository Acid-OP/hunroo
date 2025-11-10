import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
});

// Add token to requests automatically
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Failed to read token from localStorage:', error);
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
      // Provide detailed error information for debugging
      if (error.response) {
        // Server responded with an error status
        console.error('API Error:', {
          status: error.response.status,
          data: error.response.data,
          url: error.config?.url,
        });
      } else if (error.request) {
        // Request was made but no response received (network error, server down, etc.)
        console.error('Network Error: No response from server', {
          message: error.message,
          url: error.config?.url,
          baseURL: error.config?.baseURL,
        });
        console.error('Is the backend server running at', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000', '?');
      } else {
        // Something else happened
        console.error('Request Error:', error.message);
      }
    }
    
    return Promise.reject(error);
  }
);