import React, { useState } from 'react';
import './AiChatPage.css';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

const GEMINI_API_KEY = '你的API_KEY';

// 可自訂多個情境
const SCENARIOS = [
  {
    key: 'default',
    label: '一般對話',
    prompt: 'Hi! What do you want to talk to me about today?'
  },
  {
    key: 'airport',
    label: '機場英文',
    prompt: 'You are at the airport. Let\'s practice a conversation: "Hello, I would like to check in for my flight to London."'
  },
  {
    key: 'restaurant',
    label: '餐廳點餐',
    prompt: 'You are at a restaurant. Let\'s practice: "Hi, I would like to order a steak and a salad, please."'
  },
  {
    key: 'hospital',
    label: '醫院看診',
    prompt: 'You are visiting a doctor. Let\'s practice: "Doctor, I have a headache and a sore throat."'
  }
];

function AiChatPage({ userName }) {
  const [scenario, setScenario] = useState(SCENARIOS[0].key);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: SCENARIOS[0].prompt }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // 切換情境
  function handleScenarioChange(key) {
    const selected = SCENARIOS.find(s => s.key === key);
    setScenario(key);
    setMessages([{ role: 'assistant', content: selected.prompt }]);
    setInput('');
  }

  async function handleSend() {
    if (!input.trim()) return;
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    let aiReply = 'Sorry, the AI ​​service failed.';

    try {
      // Gemini API 請求
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: newMessages.map(msg => ({
              role: msg.role,
              parts: [{ text: msg.content }]
            }))
          })
        }
      );
      const data = await response.json();

      if (
        data &&
        data.candidates &&
        data.candidates[0] &&
        data.candidates[0].content &&
        data.candidates[0].content.parts &&
        data.candidates[0].content.parts[0]
      ) {
        aiReply = data.candidates[0].content.parts[0].text;
      }
      setMessages([...newMessages, { role: 'assistant', content: aiReply }]);

      // === 新增：每次都新增一筆對話到 Conversations ===
      await addDoc(
        collection(db, 'Conversations'),
        {
          user_name: userName,
          user_input: input,
          ai_response: aiReply,
          scenario: scenario,
          timestamp: new Date()
        }
      );
    } catch (error) {
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, the AI ​​service failed.' }]);
    }
    setLoading(false);
  }

  function handleInputKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="aichat-container">
      <h2>AI語音對話頁面</h2>
      <div className="aichat-welcome">
        歡迎，{userName}！
      </div>
      {/* 情境選擇按鈕 */}
      <div className="aichat-scenarios">
        {SCENARIOS.map(s => (
          <button
            key={s.key}
            className={`aichat-scenario-btn${scenario === s.key ? ' selected' : ''}`}
            onClick={() => handleScenarioChange(s.key)}
            disabled={loading}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="aichat-chatbox">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={msg.role === 'user' ? 'aichat-msg user' : 'aichat-msg assistant'}
          >
            <span className="aichat-msg-label">
              {msg.role === 'user' ? `${userName}: ` : 'AI: '}
            </span>
            {msg.content}
          </div>
        ))}
        {loading && <div className="aichat-loading">AI is replying...</div>}
      </div>
      <div className="aichat-inputbox">
        <textarea
          rows={2}
          className="aichat-input"
          placeholder="Please enter your message⋯⋯"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleInputKeyDown}
          disabled={loading}
        />
        <button
          className="aichat-sendbtn"
          onClick={handleSend}
          disabled={loading}
        >
          發送
        </button>
      </div>
    </div>
  );
}

export default AiChatPage;
