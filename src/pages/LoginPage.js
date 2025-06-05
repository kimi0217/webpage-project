import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './LoginPage.css';

function LoginPage({ onLogin }) {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // 登入
  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    const docRef = doc(db, "Users", userName.trim());
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (password === data.password) {
        if (onLogin) onLogin(userName);
        navigate('/');
      } else {
        setError('密碼錯誤');
      }
    } else {
      setError('找不到帳號');
    }
  }

  // 註冊
  async function handleRegister() {
    setError('');
    setSuccess('');
    const docRef = doc(db, "Users", userName.trim());
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setError('名稱已存在');
      return;
    }
    await setDoc(docRef, { user_name: userName, password });
    setSuccess('註冊成功，請登入');
  }

  return (
    <div className="login-container">
      <h2>登入/註冊</h2>
      <form onSubmit={handleLogin} className="login-form">
        <div>
          <label>名稱：</label>
          <input
            value={userName}
            onChange={e => setUserName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>密碼：</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">登入</button>
        <button type="button" onClick={handleRegister} style={{ marginLeft: 10 }}>
          註冊
        </button>
      </form>
      {error && <div className="login-message error">{error}</div>}
      {success && <div className="login-message success">{success}</div>}
    </div>
  );
}

export default LoginPage;