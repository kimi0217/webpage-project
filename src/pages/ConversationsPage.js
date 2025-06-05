import React, { useEffect, useState } from 'react';
import './ConversationsPage.css';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

function ConversationsPage({ userName }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [debugMsg, setDebugMsg] = useState(''); // 新增 debug 訊息

  useEffect(() => {
    async function fetchHistory() {
      if (!userName) return;
      setLoading(true);
      setError('');
      let debug = `查詢 userName: ${userName}\n`;
      try {
        const q = query(
          collection(db, 'Conversations'),
          where('user_name', '==', userName),
          orderBy('timestamp', 'desc')
        );
        const querySnapshot = await getDocs(q);
        debug += `查詢到文件數量: ${querySnapshot.size}\n`;
        let allDocs = [];
        querySnapshot.forEach(doc => {
          debug += `文件內容: ${JSON.stringify(doc.data())}\n`;
          allDocs.push(doc.data());
        });
        setHistory(allDocs);
      } catch (err) {
        setError(err.message || String(err));
        debug += `錯誤訊息: ${err.message || String(err)}\n`;
      }
      setDebugMsg(debug); // 設定 debug 訊息
      setLoading(false);
    }
    fetchHistory();
  }, [userName]);

  return (
    <div className="conv-container">
      <h2>對話歷史</h2>
      <div className="conv-welcome">
        歡迎，{userName}！
      </div>
      {loading ? (
        <div className="conv-loading">
          {error ? (
            <span style={{ color: 'red' }}>載入失敗：{error}</span>
          ) : (
            '載入中...'
          )}
        </div>
      ) : history.length === 0 ? (
        <p className="conv-empty">目前沒有對話紀錄。</p>
      ) : (
        <div className="conv-list">
          {history.map((item, idx) => (
            <div key={idx} className="conv-record">
              <div className="conv-time">
                {item.timestamp?.toDate
                  ? item.timestamp.toDate().toLocaleString()
                  : new Date(item.timestamp).toLocaleString()}
              </div>
              <div className="conv-q">
                <span className="conv-label">你：</span>
                {item.user_input}
              </div>
              <div className="conv-a">
                <span className="conv-label">AI：</span>
                {item.ai_response}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ConversationsPage;
