import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader'; 
import { useAuth } from '../contexts/AuthContext';
import './MedalPage.css';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

// 勳章定義
const MEDALS = [
  { id: 'vocab10', name: '單字初學者', description: '學會 10 個單字', type: 'vocab', target: 10 },
  { id: 'vocab30', name: '單字達人', description: '學會 30 個單字', type: 'vocab', target: 30 },
  { id: 'conv10', name: '對話新手', description: '完成 10 次對話', type: 'conversation', target: 10 },
  { id: 'conv50', name: '對話高手', description: '完成 50 次對話', type: 'conversation', target: 50 },
  { id: 'conv100', name: '對話大師', description: '完成 100 次對話', type: 'conversation', target: 100 }
];

function MedalPage() {
  const { userName } = useAuth();
  const [vocabCount, setVocabCount] = useState(0);
  const [convCount, setConvCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!userName) {
        setLoading(false);
        return;
      }
      setLoading(true);

      // 兩個 Promise 可以並行處理，提升效率
      const vocabPromise = getDocs(
        query(
          collection(db, 'UserVocabulary', userName, 'words'),
          where('passed', '==', true)
        )
      );
      const convPromise = getDocs(
        query(
          collection(db, 'Conversations'),
          where('user_name', '==', userName)
        )
      );

      try {
        const [vocabSnap, convSnap] = await Promise.all([vocabPromise, convPromise]);
        setVocabCount(vocabSnap.size);
        setConvCount(convSnap.size);
      } catch (error) {
        console.error("Error fetching medal data:", error);
      }
      
      setLoading(false);
    }
    fetchData();
  }, [userName]);

  return (
    <div className="medal-container">
      <PageHeader 
        title="勳章系統"
        showBackButton={true}
      />
      <div className="medal-welcome">
        歡迎，{userName}！
      </div>

      {loading ? (
        <div className="medal-loading">載入勳章進度中...</div>
      ) : (
        <>
          <div className="medal-progress">
            <div className="progress-item">
              <span className="progress-label">已學會單字</span>
              <span className="progress-count">{vocabCount}</span>
            </div>
            <div className="progress-item">
              <span className="progress-label">總對話次數</span>
              <span className="progress-count">{convCount}</span>
            </div>
          </div>
          <div className="medal-list">
            {MEDALS.map(medal => {
              const currentCount = medal.type === 'vocab' ? vocabCount : convCount;
              const achieved = currentCount >= medal.target;
              
              return (
                <div key={medal.id} className={`medal-item ${achieved ? 'achieved' : ''}`}>
                  <div className="medal-icon">{achieved ? '🏅' : '🔒'}</div>
                  <div className="medal-info">
                    <div className="medal-name">{medal.name}</div>
                    <div className="medal-desc">{medal.description}</div>
                  </div>
                  <div className="medal-status">
                    {achieved ? '已獲得' : `(${currentCount}/${medal.target})`}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default MedalPage;