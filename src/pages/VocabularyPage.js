import React, { useEffect, useState } from 'react';
import './VocabularyPage.css';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

function VocabularyPage({ userName }) {
  const [vocabList, setVocabList] = useState([]);
  const [currentWord, setCurrentWord] = useState(null);
  const [userPassed, setUserPassed] = useState({});
  const [input, setInput] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [passLoading, setPassLoading] = useState(false);

  // 取得今日日期字串
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10); // yyyy-mm-dd

  // 取得單字庫和用戶學習紀錄
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const vocabSnap = await getDocs(collection(db, 'Vocabulary'));
      const words = [];
      vocabSnap.forEach(doc => {
        words.push({ id: doc.id, ...doc.data() });
      });

      const userWords = {};
      const userWordsSnap = await getDocs(collection(db, 'UserVocabulary', userName, 'words'));
      userWordsSnap.forEach(doc => {
        userWords[doc.id] = doc.data().passed;
      });

      setVocabList(words);
      setUserPassed(userWords);
      setLoading(false);
    }
    if (userName) fetchData();
  }, [userName]);

  // 抽一個未通過的單字
  useEffect(() => {
    if (vocabList.length === 0) return;
    const notPassed = vocabList.filter(word => !userPassed[word.id]);
    if (notPassed.length === 0) {
      setCurrentWord(null);
    } else {
      const randomIdx = Math.floor(Math.random() * notPassed.length);
      setCurrentWord(notPassed[randomIdx]);
    }
    setInput('');
    setShowAnswer(false);
  }, [vocabList, userPassed]);

  // 標記學會或未學會，並自動跳下一題
  async function handlePass(passed) {
    if (!currentWord) return;
    setPassLoading(true);
    await setDoc(
      doc(db, 'UserVocabulary', userName, 'words', currentWord.id),
      { passed }
    );
    setUserPassed(prev => ({ ...prev, [currentWord.id]: passed }));

    // 自動標記每日挑戰（只要今天還沒完成且本題是學會就標記）
    if (passed) {
      await setDoc(
        doc(db, 'DailyChallenge', dateStr, 'users', userName),
        { completed: true }
      );
    }

    setPassLoading(false);
    // 不需要額外 setCurrentWord，因為 userPassed 改變後 useEffect 會自動抽下一題
  }

  if (loading) {
    return (
      <div className="vocab-container">
        <h2>學習單字</h2>
        <div className="vocab-welcome">歡迎，{userName}！</div>
        <div className="vocab-loading">載入中...</div>
      </div>
    );
  }

  return (
    <div className="vocab-container">
      <h2>學習單字</h2>
      <div className="vocab-welcome">歡迎，{userName}！</div>
      {currentWord ? (
        <div className="vocab-card">
          <div className="vocab-question">
            <span className="vocab-label">英文：</span>
            <span className="vocab-english">{currentWord.english}</span>
          </div>
          <div className="vocab-answer">
            <input
              className="vocab-input"
              type="text"
              placeholder="請輸入中文解釋"
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={showAnswer}
            />
            <button
              className="vocab-btn"
              onClick={() => setShowAnswer(true)}
              disabled={showAnswer || input.trim() === ''}
            >
              顯示答案
            </button>
          </div>
          {showAnswer && (
            <div className="vocab-result">
              <span className="vocab-label">正確答案：</span>
              <span className="vocab-chinese">{currentWord.chinese}</span>
              <div className="vocab-pass-btns">
                <button
                  className="vocab-btn pass"
                  onClick={() => handlePass(true)}
                  disabled={passLoading}
                >
                  我學會了
                </button>
                <button
                  className="vocab-btn fail"
                  onClick={() => handlePass(false)}
                  disabled={passLoading}
                >
                  還沒學會
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="vocab-finish">你已經學會所有單字，太棒了！</div>
      )}
    </div>
  );
}

export default VocabularyPage;
