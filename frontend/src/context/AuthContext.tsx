import React, { createContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

// Set the base URL for API requests
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

interface User {
  id: string;
  name: string;
  email: string;
  grade: string;
  board: string;
  subjects: string[];
  role?: string;
  authMethod?: string;
  weakSubjects?: string[];
  strongSubjects?: string[];
  studyPreferences?: {
    dailyStudyHours: number;
    preferredStudyTime?: {
      startTime: string;
      endTime: string;
    };
    difficultyPreference: string;
  };
  profileComplete: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string, grade: string, board: string, subjects: string[]) => Promise<void>;
  googleLogin: (tokenId: string) => Promise<void>;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setToken(token);
      loadUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async (token: string) => {
    try {
      const response = await axios.get('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Error loading user:', error);
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    grade: string,
    board: string,
    subjects: string[]
  ) => {
    try {
      const response = await axios.post('/api/auth/register', {
        name,
        email,
        password,
        grade,
        board,
        subjects
      });

      const { token, user } = response.data;

      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const googleLogin = async (tokenId: string) => {
    try {
      const response = await axios.post('/api/auth/google', { token: tokenId });
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Google login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, register, googleLogin, loading }}>
      {children}
    </AuthContext.Provider>
  );
};