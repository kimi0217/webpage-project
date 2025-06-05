import React, { useEffect, useState } from 'react';
import './MedalPage.css';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const MEDALS = [
  {
    id: 'vocab10',
    name: '單字新手',
    type: 'vocab',
    target: 10,
    description: '學習通過10個單字'
  },
  {
    id: 'vocab30',
    name: '單字高手',
    type: 'vocab',
    target: 30,
    description: '學習通過30個單字'
  },
  {
    id: 'conv10',
    name: '對話新手',
    type: 'conversation',
    target: 10,
    description: '完成10次AI對話'
  },
  {
    id: 'conv50',
    name: '對話達人',
    type: 'conversation',
    target: 50,
    description: '完成50次AI對話'
  }
];

function MedalPage({ userName }) {
  const [vocabCount, setVocabCount] = useState(0);
  const [convCount, setConvCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      // 取得單字學習通過數
      const vocabSnap = await getDocs(collection(db, 'UserVocabulary', userName, 'words'));
      let vocabPassed = 0;
      vocabSnap.forEach(doc => {
        if (doc.data().passed) vocabPassed += 1;
      });
      setVocabCount(vocabPassed);

      // 取得對話數量
      const convSnap = await getDocs(collection(db, 'Conversations'));
      let userConv = 0;
      convSnap.forEach(doc => {
        if (doc.data().user_name === userName) userConv += 1;
      });
      setConvCount(userConv);

      setLoading(false);
    }
    if (userName) fetchData();
  }, [userName]);

  return (
    <div className="medal-container">
      <h2>勳章系統</h2>
      <div className="medal-welcome">歡迎，{userName}！</div>
      {loading ? (
        <div className="medal-loading">載入中...</div>
      ) : (
        <div>
          <div className="medal-progress">
            <span>已學會單字數：{vocabCount}</span>
            <span>對話次數：{convCount}</span>
          </div>
          <div className="medal-list">
            {MEDALS.map(medal => {
              const achieved =
                (medal.type === 'vocab' && vocabCount >= medal.target) ||
                (medal.type === 'conversation' && convCount >= medal.target);
              return (
                <div
                  key={medal.id}
                  className={`medal-item ${achieved ? 'achieved' : ''}`}
                >
                  <div className="medal-icon">
                    {achieved ? '🏅' : '🔒'}
                  </div>
                  <div className="medal-info">
                    <div className="medal-name">{medal.name}</div>
                    <div className="medal-desc">{medal.description}</div>
                  </div>
                  <div className="medal-status">
                    {achieved ? '已獲得' : `目標：${medal.target}`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default MedalPage;
