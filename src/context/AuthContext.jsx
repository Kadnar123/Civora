import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

const API_BASE = 'http://localhost:5000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('civora_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('civora_token'));

  const loginAPI = async (identifier, password) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      const data = await res.json();
      if (!res.ok || !data.success) return { success: false, error: data.error || 'Login failed' };
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('civora_user', JSON.stringify(data.user));
      localStorage.setItem('civora_token', data.token);
      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'Login failed' };
    }
  };

  const registerAPI = async (name, phone, email, password, role = 'Citizen') => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, password, role })
      });
      const data = await res.json();
      if (!res.ok || !data.success) return { success: false, error: data.error || 'Register failed' };
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('civora_user', JSON.stringify(data.user));
      localStorage.setItem('civora_token', data.token);
      return { success: true };
    } catch (err) {
      console.error('Register error:', err);
      return { success: false, error: 'Registration failed' };
    }
  };

  const login = (role) => {
    const userData = { role, name: role + ' User' };
    setUser(userData);
    localStorage.setItem('civora_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('civora_user');
    localStorage.removeItem('civora_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, loginAPI, registerAPI, logout }}>
      {children}
    </AuthContext.Provider>
  );
};