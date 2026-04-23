import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('civora_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('civora_token'));

  const getMockUsers = () => {
    const data = localStorage.getItem('civora_mock_users');
    if (data) {
      try { return JSON.parse(data); } catch(e) {}
    }
    return [
      { email: 'admin@civora.com', password: 'admin123', role: 'Government', name: 'Master Admin' }
    ];
  };

  const loginAPI = async (identifier, password) => {
    const users = getMockUsers();
    
    // Strict hardcoded check for government access
    if (identifier === 'admin@civora.com') {
      if (password === 'admin123') {
        const userData = { role: 'Government', name: 'Master Admin', email: identifier };
        setUser(userData);
        setToken('mock-token-123');
        localStorage.setItem('civora_user', JSON.stringify(userData));
        localStorage.setItem('civora_token', 'mock-token-123');
        return { success: true };
      }
      return { success: false, error: 'Invalid Government credentials' };
    }

    // Citizen authentication
    const foundUser = users.find(u => u.email === identifier);
    if (!foundUser) {
      return { success: false, error: 'User not found. Please register first.' };
    }

    if (foundUser.password !== password) {
      return { success: false, error: 'Incorrect password.' };
    }

    setUser(foundUser);
    setToken('mock-token-123');
    localStorage.setItem('civora_user', JSON.stringify(foundUser));
    localStorage.setItem('civora_token', 'mock-token-123');
    return { success: true };
  };

  const registerAPI = async (name, phone, email, password, role = 'Citizen') => {
    if (email === 'admin@civora.com') {
      return { success: false, error: 'Cannot register with restricted government email.' };
    }

    const users = getMockUsers();
    if (users.find(u => u.email === email)) {
      return { success: false, error: 'Email already registered.' };
    }

    const newUser = { role, name, phone, email, password };
    users.push(newUser);
    localStorage.setItem('civora_mock_users', JSON.stringify(users));

    setUser(newUser);
    setToken('mock-token-123');
    localStorage.setItem('civora_user', JSON.stringify(newUser));
    localStorage.setItem('civora_token', 'mock-token-123');
    return { success: true };
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
