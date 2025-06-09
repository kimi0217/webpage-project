import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import MainPage from './pages/MainPage';
import AiChatPage from './pages/AiChatPage';
import MedalPage from './pages/MedalPage';
import FriendPage from './pages/FriendPage';
import ConversationsPage from './pages/ConversationsPage';
import VocabularyPage from './pages/VocabularyPage';
import TextAnalyzerPage from './pages/TextAnalyzerPage';

function AppRoutes() {
  const { isLoggedIn } = useAuth();

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={<LoginPage />}
        />
        <Route
          path="/"
          element={
            isLoggedIn ? <MainPage /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/ai-chat"
          element={
            isLoggedIn ? <AiChatPage /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/medals"
          element={
            isLoggedIn ? <MedalPage /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/friends"
          element={
            isLoggedIn ? <FriendPage /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/conversations"
          element={
            isLoggedIn ? <ConversationsPage /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/vocabulary"
          element={
            isLoggedIn ? <VocabularyPage /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/text-analyzer"
          element={
            isLoggedIn ? <TextAnalyzerPage /> : <Navigate to="/login" replace />
          }
        />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
