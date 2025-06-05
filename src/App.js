import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import MainPage from './pages/MainPage';
import AiChatPage from './pages/AiChatPage';
import MedalPage from './pages/MedalPage';
import FriendPage from './pages/FriendPage';
import ConversationsPage from './pages/ConversationsPage';
import VocabularyPage from './pages/VocabularyPage';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            <LoginPage
              onLogin={(name) => {
                setIsLoggedIn(true);
                setUserName(name);
              }}
            />
          }
        />
        <Route
          path="/"
          element={
            isLoggedIn ? <MainPage userName={userName} /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/ai-chat"
          element={
            isLoggedIn ? <AiChatPage userName={userName} /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/medals"
          element={
            isLoggedIn ? <MedalPage userName={userName} /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/friends"
          element={
            isLoggedIn ? <FriendPage userName={userName} /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/conversations"
          element={
            isLoggedIn ? <ConversationsPage userName={userName} /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/vocabulary"
          element={
            isLoggedIn ? <VocabularyPage userName={userName} /> : <Navigate to="/login" replace />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
