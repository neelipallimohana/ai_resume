import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(true);

  const checkStatus = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/auth/status');
      setIsInitialized(res.data.system_initialized);
      if (res.data.authenticated && res.data.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to verify auth status:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const login = async (username_or_email, password) => {
    const res = await api.post('/api/auth/login', { username_or_email, password });
    setUser(res.data.user);
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
    }
  };

  const setupAdmin = async (formData) => {
    const res = await api.post('/api/auth/setup-admin', formData);
    setIsInitialized(true);
    setUser(res.data.user);
    return res.data;
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/api/auth/me');
      setUser(res.data.user);
    } catch (err) {
      setUser(null);
    }
  };

  const hasPermission = (permissionKey) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return Boolean(user.permissions && user.permissions[permissionKey]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isInitialized,
        login,
        logout,
        setupAdmin,
        refreshUser,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
