import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader'; 
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './MainPage.css';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase';

// Helper function to get date string in YYYY-MM-DD format
const getISODateString = (date) => {
  return date.toISOString().slice(0, 10);
};

function MainPage() {
  const navigate = useNavigate();
  const { userName } = useAuth();
  const [friendsDone, setFriendsDone] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completedDates, setCompletedDates] = useState(new Set());

  const calendarDays = [];
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  for (let i = 20; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    calendarDays.push(date);
  }
  const todayStr = getISODateString(today);

  useEffect(() => {
    async function fetchChallengeData() {
      if (!userName) return;
      setLoading(true);
      
      const friendDoc = await getDoc(doc(db, 'Friends', userName));
      const friends = friendDoc.exists() && Array.isArray(friendDoc.data().friends) ? friendDoc.data().friends : [];

      const dateStrings = calendarDays.map(date => getISODateString(date));
      const challengePromises = dateStrings.map(dateStr =>
        getDoc(doc(db, 'DailyChallenge', dateStr, 'users', userName))
      );
      const challengeDocs = await Promise.all(challengePromises);
      const newCompletedDates = new Set();
      challengeDocs.forEach((docSnap, index) => {
        if (docSnap.exists() && docSnap.data().completed) {
          newCompletedDates.add(dateStrings[index]);
        }
      });
      setCompletedDates(newCompletedDates);

      const usersSnap = await getDocs(collection(db, 'DailyChallenge', todayStr, 'users'));
      const doneFriends = [];
      usersSnap.forEach(docSnap => {
        if (friends.includes(docSnap.id) && docSnap.data().completed) {
          doneFriends.push(docSnap.id);
        }
      });
      setFriendsDone(doneFriends);
      setLoading(false);
    }
    if (userName) fetchChallengeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userName]);

  const isTodayChallengeDone = completedDates.has(todayStr);

  return (
    <div className="main-container">
     <PageHeader
        title="主畫面"
        showBackButton={false}
      />
      <div className="main-welcome">
        歡迎，{userName}！
      </div>

      <div className="main-daily-challenge">
        <div className="challenge-info">
          <div className="main-challenge-title">📅 每日挑戰</div>
          <div className="main-challenge-desc">今天學習一個新單字！</div>
          <div className="main-challenge-status">
            {loading ? (
              <span className="main-challenge-loading">載入中...</span>
            ) : isTodayChallengeDone ? (
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

        <div className="challenge-calendar-container">
          <div className="challenge-calendar-header">最近 21 天</div>
          <div className="challenge-calendar">
            {calendarDays.map(day => {
              const dayStr = getISODateString(day);
              const isCurrent = dayStr === todayStr;
              const isCompleted = completedDates.has(dayStr);
              let dayClassName = 'calendar-day';
              if (isCompleted) dayClassName += ' completed';
              if (isCurrent) dayClassName += ' current-day';
              return (
                <div key={dayStr} className={dayClassName}>
                  {day.getDate()}
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
        <button onClick={() => navigate('/text-analyzer')}>📝 文本分析器</button>
        <button onClick={() => navigate('/medals')}>勳章系統</button>
        <button onClick={() => navigate('/friends')}>好友與排行榜</button>
      </div>
    </div>
  );
}

export default MainPage;