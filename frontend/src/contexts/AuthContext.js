// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEYS = {
  access: 'sitego_access_token',
  refresh: 'sitego_refresh_token',
  user: 'sitego_user',
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const signIn = async (accessToken, refreshToken, userData) => {
    localStorage.setItem(STORAGE_KEYS.access, accessToken);
    localStorage.setItem(STORAGE_KEYS.refresh, refreshToken);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(userData));
    setUser(userData);
  };

  const signOut = async () => {
    localStorage.removeItem(STORAGE_KEYS.access);
    localStorage.removeItem(STORAGE_KEYS.refresh);
    localStorage.removeItem(STORAGE_KEYS.user);
    setUser(null);
  };

  useEffect(() => {
    const access = localStorage.getItem(STORAGE_KEYS.access);
    const storedUser = localStorage.getItem(STORAGE_KEYS.user);
    if (access && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
