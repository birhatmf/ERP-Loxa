import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import type { User, AuthResponse } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, name: string, role: 'admin' | 'user') => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('erp_token');
    const storedUser = localStorage.getItem('erp_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      // Verify token is still valid
      api.get('/api/auth/me').catch(() => {
        localStorage.removeItem('erp_token');
        localStorage.removeItem('erp_user');
        setToken(null);
        setUser(null);
      });
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const { data } = await api.post<AuthResponse>('/api/auth/login', { username, password });
    localStorage.setItem('erp_token', data.token);
    localStorage.setItem('erp_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(async (username: string, password: string, name: string, role: 'admin' | 'user') => {
    const { data } = await api.post<AuthResponse>('/api/auth/register', { username, password, name, role });
    localStorage.setItem('erp_token', data.token);
    localStorage.setItem('erp_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
