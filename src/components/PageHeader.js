import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import './PageHeader.css';

function PageHeader({ title, showBackButton = true }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useTheme();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isMainPage = location.pathname === '/' && !showBackButton;

  return (
    <div className="page-header">
      {/* 只有在 showBackButton 為 true 時才顯示返回按鈕 */}
      {showBackButton && (
        <button 
          onClick={() => navigate('/')} 
          className="back-button" 
          aria-label="返回主畫面"
        >
          ← {/* 這是一個左箭頭符號 */}
        </button>
      )}
      
      {isMainPage && (
        <button 
          onClick={handleLogout}
          className="logout-button" 
          aria-label="登出"
        >
          登出
        </button>
      )}
      
      <h2>{title}</h2>

      <button onClick={toggleTheme} className="theme-toggle-button" aria-label="切換主題">
        {isDarkMode ? '☀️' : '🌙'}
      </button>
    </div>
  );
}

export default PageHeader;