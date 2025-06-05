import React, { useEffect, useState } from 'react';
import './FriendPage.css';
import { collection, doc, getDoc, setDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

function FriendPage({ userName }) {
  const [friendInput, setFriendInput] = useState('');
  const [friends, setFriends] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [friendStats, setFriendStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  // 提取 fetchFriends，讓 handleAddFriend 也能用
  const fetchFriends = async () => {
    setLoading(true);
    setMsg('');
    // 取得所有用戶（查 Users 集合）
    const usersSnap = await getDocs(collection(db, 'Users'));
    const users = [];
    usersSnap.forEach(doc => users.push(doc.id));
    setAllUsers(users);

    // 取得自己的好友清單
    const friendDoc = await getDoc(doc(db, 'Friends', userName));
    let friendArr = [];
    if (friendDoc.exists() && Array.isArray(friendDoc.data().friends)) {
      friendArr = friendDoc.data().friends;
    }
    setFriends(friendArr);

    // 取得好友與自己 stats
    const stats = [];
    for (const name of [userName, ...friendArr]) {
      // 單字數
      const wordSnap = await getDocs(collection(db, 'UserVocabulary', name, 'words'));
      let vocabPassed = 0;
      wordSnap.forEach(doc => {
        if (doc.data().passed) vocabPassed += 1;
      });
      // 對話數
      const convSnap = await getDocs(collection(db, 'Conversations'));
      let convCount = 0;
      convSnap.forEach(doc => {
        if (doc.data().user_name === name) convCount += 1;
      });
      // 勳章數（這裡以單字10/30、對話10/50為例）
      let medal = 0;
      if (vocabPassed >= 10) medal++;
      if (vocabPassed >= 30) medal++;
      if (convCount >= 10) medal++;
      if (convCount >= 50) medal++;
      stats.push({
        name,
        vocabPassed,
        convCount,
        medal
      });
    }
    setFriendStats(stats);
    setLoading(false);
  };

  useEffect(() => {
    if (userName) fetchFriends();
    // eslint-disable-next-line
  }, [userName]);

  // 添加好友
  async function handleAddFriend() {
    setMsg('');
    const toAdd = friendInput.trim();
    if (!toAdd || toAdd === userName) {
      setMsg('請輸入正確的好友名稱');
      return;
    }
    if (friends.includes(toAdd)) {
      setMsg('已經是你的好友');
      return;
    }
    if (!allUsers.includes(toAdd)) {
      setMsg('查無此用戶');
      return;
    }
    const newFriends = [...friends, toAdd];
    await setDoc(doc(db, 'Friends', userName), { friends: newFriends });
    setFriendInput('');
    setMsg('好友添加成功！');
    // 重新拉取所有資料（刷新排行榜與好友）
    fetchFriends();
  }

  // 排行榜排序
  const vocabRank = [...friendStats].sort((a, b) => b.vocabPassed - a.vocabPassed);
  const convRank = [...friendStats].sort((a, b) => b.convCount - a.convCount);
  const medalRank = [...friendStats].sort((a, b) => b.medal - a.medal);

  return (
    <div className="friend-container">
      <h2>好友與排行榜</h2>
      <div className="friend-welcome">歡迎，{userName}！</div>
      <div className="friend-add">
        <input
          className="friend-input"
          placeholder="輸入好友名稱"
          value={friendInput}
          onChange={e => setFriendInput(e.target.value)}
        />
        <button className="friend-btn" onClick={handleAddFriend}>添加好友</button>
      </div>
      {msg && <div className="friend-msg">{msg}</div>}

      {loading ? (
        <div className="friend-loading">載入中...</div>
      ) : (
        <>
          <div className="friend-list-title">單字學習排行榜</div>
          <div className="friend-list">
            <div className="friend-list-header">
              <span>排名</span>
              <span>名稱</span>
              <span>單字</span>
            </div>
            {vocabRank.map((item, idx) => (
              <div
                key={item.name}
                className={`friend-list-row${item.name === userName ? ' me' : ''}`}
              >
                <span>{idx + 1}</span>
                <span>{item.name}</span>
                <span>{item.vocabPassed}</span>
              </div>
            ))}
          </div>

          <div className="friend-list-title">對話次數排行榜</div>
          <div className="friend-list">
            <div className="friend-list-header">
              <span>排名</span>
              <span>名稱</span>
              <span>對話</span>
            </div>
            {convRank.map((item, idx) => (
              <div
                key={item.name}
                className={`friend-list-row${item.name === userName ? ' me' : ''}`}
              >
                <span>{idx + 1}</span>
                <span>{item.name}</span>
                <span>{item.convCount}</span>
              </div>
            ))}
          </div>

          <div className="friend-list-title">勳章數排行榜</div>
          <div className="friend-list">
            <div className="friend-list-header">
              <span>排名</span>
              <span>名稱</span>
              <span>勳章</span>
            </div>
            {medalRank.map((item, idx) => (
              <div
                key={item.name}
                className={`friend-list-row${item.name === userName ? ' me' : ''}`}
              >
                <span>{idx + 1}</span>
                <span>{item.name}</span>
                <span>{item.medal}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default FriendPage;
