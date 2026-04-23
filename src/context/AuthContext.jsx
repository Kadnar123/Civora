import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('civora_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('civora_token'));

  const loginAPI = async (identifier, password) => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('civora_user', JSON.stringify(data.user));
        localStorage.setItem('civora_token', data.token);
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: 'Network error' };
    }
  };

  const registerAPI = async (name, phone, email, password, role = 'Citizen') => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, password, role })
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('civora_user', JSON.stringify(data.user));
        localStorage.setItem('civora_token', data.token);
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: 'Network error' };
    }
  };

  // Mock login for backward compatibility until all pages updated
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
