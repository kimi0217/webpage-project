import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MainPage.css';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase';

// 輔助函式：補零
const pad = n => String(n).padStart(2, '0');

function MainPage({ userName }) {
  const navigate = useNavigate();
  const [challengeDone, setChallengeDone] = useState(false);
  const [friendList, setFriendList] = useState([]);
  const [friendsDone, setFriendsDone] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completedDates, setCompletedDates] = useState([]);
  
  // 本地時區的今天日期字串
  const today = new Date();
  const dateStr = today.getFullYear() + '-' + pad(today.getMonth() + 1) + '-' + pad(today.getDate());

  useEffect(() => {
    async function fetchChallenge() {
      setLoading(true);
      // 1. 取得好友名單
      const friendDoc = await getDoc(doc(db, 'Friends', userName));
      let friends = [];
      if (friendDoc.exists() && Array.isArray(friendDoc.data().friends)) {
        friends = friendDoc.data().friends;
      }
      setFriendList(friends);

      // 2. 取得自己是否完成
      const myDoc = await getDoc(doc(db, 'DailyChallenge', dateStr, 'users', userName));
      setChallengeDone(myDoc.exists() && myDoc.data().completed);

      // 3. 取得好友誰完成
      const usersSnap = await getDocs(collection(db, 'DailyChallenge', dateStr, 'users'));
      const done = [];
      usersSnap.forEach(docSnap => {
        if (friends.includes(docSnap.id) && docSnap.data().completed) {
          done.push(docSnap.id);
        }
      });
      setFriendsDone(done);

      // 4. 取得最近 21 天完成紀錄
      const days = 21;
      const completed = [];
      for (let i = 0; i < days; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - (days - 1 - i));
        const dStr = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
        const recDoc = await getDoc(doc(db, 'DailyChallenge', dStr, 'users', userName));
        if (recDoc.exists() && recDoc.data().completed) {
          completed.push(dStr);
        }
      }
      setCompletedDates(completed);
      setLoading(false);
    }
    if (userName) fetchChallenge();
    // eslint-disable-next-line
  }, [userName, dateStr]);

  // 產生最近 21 天日期陣列
  function getRecentDays(days = 21) {
    const arr = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - (days - 1 - i));
      const dStr = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
      arr.push(dStr);
    }
    return arr;
  }

  const recentDays = getRecentDays();

  return (
    <div className="main-container">
      <h2>主畫面</h2>
      {/* <p style={{ color: '#3949ab', fontSize: 15, marginBottom: 10 }}>
        今天日期：{dateStr}
      </p> */}
      <div style={{ marginBottom: 20 }} className="main-welcome">
        歡迎，{userName}！
      </div>

      {/* 每日挑戰區塊（內部左右排） */}
      <div className="main-daily-challenge-row">
        <div className="main-daily-challenge-content">
          <div className="main-challenge-title">📅 每日挑戰</div>
          <div className="main-challenge-desc">今天學習一個新單字！</div>
          <div className="main-challenge-status">
            {loading ? (
              <span className="main-challenge-loading">載入中...</span>
            ) : challengeDone ? (
              <span className="main-challenge-done">你已完成今日挑戰</span>
            ) : (
              <span className="main-challenge-notyet">尚未完成，快去學習單字！</span>
            )}
          </div>
          <div className="main-challenge-friends">
            <span className="main-challenge-friend-title">今日完成的好友：</span>
            {loading ? (
              <span className="main-challenge-loading">載入中...</span>
            ) : friendsDone.length === 0 ? (
              <span className="main-challenge-none">暫無好友完成</span>
            ) : (
              friendsDone.map(name => (
                <span key={name} className="main-challenge-friend">{name}</span>
              ))
            )}
          </div>
        </div>
        {/* 迷你日曆 */}
        <div className="main-mini-calendar">
          <div className="main-calendar-title">最近 21 天</div>
          <div className="main-calendar-grid">
            {recentDays.map(date => {
              const d = new Date(date);
              const day = d.getDate();
              const isDone = completedDates.includes(date);
              return (
                <div
                  key={date}
                  className={`main-calendar-cell${isDone ? ' done' : ''}${date === dateStr ? ' today' : ''}`}
                  title={date}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="main-menu">
        <button onClick={() => navigate('/ai-chat')}>AI語音對話</button>
        <button onClick={() => navigate('/conversations')}>歷史對話</button>
        <button onClick={() => navigate('/vocabulary')}>學習單字</button>
        <button onClick={() => navigate('/medals')}>勳章系統</button>
        <button className="main-menu-full" onClick={() => navigate('/friends')}>
          好友與排行榜
        </button>
      </div>
    </div>
  );
}

export default MainPage;