// src/pages/MainPage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './MainPage.css';

function MainPage({ userName }) {  // 這裡要加上 { userName }
  const navigate = useNavigate();

  return (
    <div className="main-container">
      <h2>主畫面</h2>
      <div style={{ marginBottom: 20 }} className="main-welcome">
        歡迎，{userName}！
      </div>
      <div className="main-menu">
        <button onClick={() => navigate('/ai-chat')}>AI語音對話</button>
        <button onClick={() => navigate('/conversations')}>歷史對話</button>
        <button onClick={() => navigate('/vocabulary')}>學習單字</button>
        <button onClick={() => navigate('/medals')}>勳章系統</button>
        <button onClick={() => navigate('/friends')}>好友與排行榜</button>
      </div>
    </div>
  );
}

export default MainPage;
