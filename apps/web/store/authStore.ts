import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  role: 'JOB_SEEKER' | 'JOB_PROVIDER';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  initialize: () => void;
}

// Initialize from localStorage
const getInitialState = () => {
  if (typeof window === 'undefined') {
    return { user: null, token: null, isAuthenticated: false };
  }
  
  try {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        return { user, token, isAuthenticated: true };
      } catch {
        // Invalid JSON in localStorage, clear it
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return { user: null, token: null, isAuthenticated: false };
      }
    }
  } catch (error) {
    console.error('Failed to read from localStorage:', error);
  }
  
  return { user: null, token: null, isAuthenticated: false };
};

export const useAuthStore = create<AuthState>((set) => ({
  ...getInitialState(),
  
  login: (token, user) => {
    try {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ token, user, isAuthenticated: true });
    } catch (error) {
      console.error('Failed to save auth data to localStorage:', error);
      // Still update state even if localStorage fails
      set({ token, user, isAuthenticated: true });
    }
  },
  
  logout: () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
    set({ token: null, user: null, isAuthenticated: false });
  },
  
  initialize: () => {
    set(getInitialState());
  },
}));