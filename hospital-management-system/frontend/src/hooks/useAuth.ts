import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string; rememberMe?: boolean }) => Promise<void>;
  logout: () => void;
  register: (userData: { email: string; password: string; firstName: string; lastName: string }) => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  });

  const login = async (credentials: { email: string; password: string; rememberMe?: boolean }) => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock successful login
      const user: User = {
        id: '1',
        email: credentials.email,
        firstName: 'Test',
        lastName: 'User',
        role: credentials.email.includes('admin') ? 'admin' : 'user',
      };

      localStorage.setItem('token', 'mock-jwt-token');
      localStorage.setItem('userRole', user.role);

      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const register = async (userData: { email: string; password: string; firstName: string; lastName: string }) => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const user: User = {
        id: '1',
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: 'user',
      };

      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      setState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, ...userData } : null,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem('token');
    if (token) {
      const userRole = localStorage.getItem('userRole');
      setState({
        user: {
          id: '1',
          email: 'user@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: userRole || 'user',
        },
        isAuthenticated: true,
        isLoading: false,
      });
    }
  }, []);

  return {
    ...state,
    login,
    logout,
    register,
    updateUser,
  };
};