import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MainPage.css';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase';

function MainPage({ userName }) {
  const navigate = useNavigate();
  const [challengeDone, setChallengeDone] = useState(false);
  const [friendList, setFriendList] = useState([]);
  const [friendsDone, setFriendsDone] = useState([]);
  const [loading, setLoading] = useState(true);

  // 取得今日日期字串
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10); // yyyy-mm-dd

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
      setLoading(false);
    }
    if (userName) fetchChallenge();
    // eslint-disable-next-line
  }, [userName]);

  return (
    <div className="main-container">
      <h2>主畫面</h2>
      <div style={{ marginBottom: 20 }} className="main-welcome">
        歡迎，{userName}！
      </div>

      {/* 每日挑戰區塊 */}
      <div className="main-daily-challenge">
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
