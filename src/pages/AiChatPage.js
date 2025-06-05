import React, { useState } from 'react';
import './AiChatPage.css';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

const GEMINI_API_KEY = '你的API_KEY'; // 帳號申請還沒通過

function AiChatPage({ userName }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! What do you want to talk to me about today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

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
      <div style={{ marginBottom: 20 }}>
        歡迎，{userName}！
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
