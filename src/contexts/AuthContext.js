import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // Initialize state from localStorage if available
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const savedUserName = localStorage.getItem('userName');
    return savedUserName ? true : false;
  });
  
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('userName') || '';
  });

  const login = (name) => {
    setIsLoggedIn(true);
    setUserName(name);
    // Save to localStorage for persistence
    localStorage.setItem('userName', name);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUserName('');
    // Clear from localStorage
    localStorage.removeItem('userName');
  };

  const value = {
    isLoggedIn,
    userName,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 