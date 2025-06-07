import React, { useState, useRef } from 'react';
import './AiChatPage.css';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

const GEMINI_API_KEY = ''; //填入api key

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
  const [sttActive, setSttActive] = useState(false);
  const recognitionRef = useRef(null);

  // STT 啟動
  function handleStartSTT() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('此瀏覽器不支援語音辨識，請使用 Chrome 或 Edge');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US'; // 可改 zh-TW、en-US
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setSttActive(true);
    recognition.onend = () => setSttActive(false);
    recognition.onerror = () => setSttActive(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setSttActive(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

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
      const systemPrompt = '若使用者輸入的英文沒有錯誤，直接與他對談。若有文法或是用字等錯誤，請用中文糾正他。使用者輸入：';
      const apiMessages = newMessages.map((msg, idx) => {
        if (msg.role === 'user' && idx === newMessages.length - 1) {
          return {
            role: msg.role,
            parts: [{ text: systemPrompt + msg.content }]
          };
        }
        return {
          role: msg.role,
          parts: [{ text: msg.content }]
        };
      });

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: apiMessages })
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
        <button
          className="aichat-sttbtn"
          onClick={handleStartSTT}
          disabled={loading || sttActive}
          style={{
            marginLeft: 8,
            background: sttActive ? '#bdbdbd' : '#43a047',
            color: '#fff',
            fontWeight: 600,
            borderRadius: 6,
            border: 'none',
            padding: '8px 14px',
            cursor: sttActive ? 'not-allowed' : 'pointer',
            transition: 'background 0.18s'
          }}
        >
          {sttActive ? '語音辨識中...' : '語音輸入'}
        </button>
      </div>
    </div>
  );
}

export default AiChatPage;
