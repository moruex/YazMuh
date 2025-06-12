import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as loginService, register as registerService, LoginInput, UserInput, User } from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (credentials: LoginInput) => Promise<void>;
  register: (userData: UserInput) => Promise<void>;
  logout: () => void;
  updateAuthUser: (user: User) => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start with loading true to check localStorage
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check localStorage for token and user data on initial load
    try {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('authUser');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Error parsing stored auth data:", e);
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleAuthSuccess = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('authUser', JSON.stringify(userData));
    setError(null);
  };

  const updateAuthUser = (updatedUserData: User) => {
    // We only update the user object, token remains the same.
    const currentUser = JSON.parse(localStorage.getItem('authUser') || '{}');
    const newUser = { ...currentUser, ...updatedUserData };
    setUser(newUser);
    localStorage.setItem('authUser', JSON.stringify(newUser));
  };

  const login = async (credentials: LoginInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await loginService(credentials);
      if (data.token && data.user) {
        handleAuthSuccess(data.user, data.token);
      } else {
        throw new Error('Login failed: No token or user returned.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login. Please check your credentials.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: UserInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const registeredUser = await registerService(userData);
      if (registeredUser) {
        // Automatically log in the user after successful registration
        await login({ login: userData.email, password: userData.password });
      } else {
        throw new Error('Registration failed: No user data returned.');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setError(null);
    // Optionally, redirect to home or login page
    // window.location.href = '/login'; // Could be handled by components listening to isLoggedIn
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoggedIn: !!token && !!user, isLoading, login, register, logout, updateAuthUser, error, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 