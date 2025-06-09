import React, { useState } from 'react';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import './TextAnalyzerPage.css';

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

function TextAnalyzerPage() {
  const { userName } = useAuth();
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quizData, setQuizData] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [isQuizFinished, setIsQuizFinished] = useState(false);
  const [questionLanguage, setQuestionLanguage] = useState('chinese'); // 'chinese' or 'english'

  const responseSchema = {
    type: "ARRAY",
    items: {
      type: "OBJECT",
      properties: {
        questionType: {
          type: "STRING",
          enum: ["vocabulary_mcq", "comprehension_mcq", "fill_in_the_blank"]
        },
        questionText: {
          type: "STRING",
          description: "The question itself, or the sentence with '_____' for fill-in-the-blank."
        },
        options: {
          type: "ARRAY",
          description: "An array of 4 strings for multiple choice options. Null for fill-in-the-blank.",
          items: { type: "STRING" }
        },
        answer: {
          type: "STRING",
          description: "The correct option text for MCQ, or the word that fills the blank."
        },
        explanation: {
          type: "STRING",
          description: "Brief explanation of why this is the correct answer, helping with learning."
        }
      },
      required: ["questionType", "questionText", "answer", "explanation"]
    }
  };

  function generatePrompt(text, language) {
    const baseInstructions = {
      chinese: `你是一位專業的英語教學助手，專門為中文母語者設計英語學習內容。請分析以下英文文本，並生成4道互動式測驗題目，幫助中文學習者掌握這段文本。

請遵循以下原則：
1. **詞彙選擇題 (vocabulary_mcq)**: 選擇文本中對中文學習者較有挑戰性的詞彙，提供中文解釋或英文同義詞選擇。錯誤選項應該是相似但不正確的詞彙。
2. **閱讀理解題 (comprehension_mcq)**: 測試對文本主要概念、細節或推論的理解。問題應該用中文提出，選項可以是中文或英文。
3. **填空題 (fill_in_the_blank)**: 選擇關鍵詞彙或語法結構，幫助學習者練習語言運用。
4. 所有問題和選項都用繁體中文提出，除非是專門測試英文詞彙的部分。
5. 提供簡潔的解釋說明為什麼這是正確答案，用中文解釋。

請確保題目難度適中，既有挑戰性又不會讓學習者感到挫折。`,

      english: `You are a professional English language learning assistant specializing in creating content for Chinese native speakers learning English. Analyze the following English text and generate 4 interactive quiz questions to help Chinese learners master this text.

Please follow these principles:
1. **Vocabulary Multiple Choice (vocabulary_mcq)**: Select vocabulary from the text that would be challenging for Chinese learners. Focus on words that have nuanced meanings, false cognates, or common usage patterns that differ from Chinese.
2. **Reading Comprehension (comprehension_mcq)**: Test understanding of main concepts, details, or inferences. Questions should focus on areas where Chinese learners typically struggle.
3. **Fill-in-the-blank (fill_in_the_blank)**: Choose key vocabulary or grammatical structures that are important for language development.
4. All questions and options should be in English to maximize language exposure and practice.
5. Provide brief explanations in English for why the answer is correct, focusing on language learning insights.

Ensure questions are appropriately challenging but not frustrating for intermediate English learners.`
    };

    return `${baseInstructions[language]}

文本內容 / TEXT:
---
${text}
---

請以JSON格式提供答案，包含questionType、questionText、options（選擇題用，填空題設為null）、answer和explanation欄位。`;
  }

  async function generateQuizFromText(text) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const prompt = generatePrompt(text, questionLanguage);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: responseSchema
        }
      })
    });

    const data = await response.json();
    const quizArray = JSON.parse(data.candidates[0].content.parts[0].text);
    return quizArray;
  }

  async function handleGenerateQuiz() {
    if (!inputText.trim()) return;
    
    setIsLoading(true);
    setUserAnswers({});
    setIsQuizFinished(false);
    
    try {
      const quiz = await generateQuizFromText(inputText);
      setQuizData(quiz);
    } catch (error) {
      console.error("Quiz generation error:", error);
      alert('抱歉，生成測驗時發生錯誤。請稍後再試。');
    } finally {
      setIsLoading(false);
    }
  }

  function handleAnswerChange(questionIndex, answer) {
    setUserAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  }

  function handleQuizSubmit() {
    setIsQuizFinished(true);
  }

  function calculateScore() {
    let correct = 0;
    quizData.forEach((question, index) => {
      if (userAnswers[index] === question.answer) {
        correct++;
      }
    });
    return correct;
  }

  function resetQuiz() {
    setInputText('');
    setQuizData([]);
    setUserAnswers({});
    setIsQuizFinished(false);
  }

  function renderQuestion(question, index) {
    const userAnswer = userAnswers[index];
    const isAnswered = userAnswer !== undefined;
    const isCorrect = userAnswer === question.answer;

    if (question.questionType === 'fill_in_the_blank') {
      return (
        <div key={index} className="quiz-question">
          <div className="question-header">
            <span className="question-number">問題 {index + 1}</span>
            <span className="question-type">填空題</span>
          </div>
          <div className="question-text">{question.questionText}</div>
          <div className="fill-blank-container">
            <input
              type="text"
              className={`fill-blank-input ${isQuizFinished ? (isCorrect ? 'correct' : 'incorrect') : ''}`}
              placeholder="請輸入答案..."
              value={userAnswer || ''}
              onChange={(e) => handleAnswerChange(index, e.target.value)}
              disabled={isQuizFinished}
            />
            {isQuizFinished && (
              <div className="answer-feedback">
                {isCorrect ? (
                  <span className="correct-feedback">✓ 正確！</span>
                ) : (
                  <span className="incorrect-feedback">✗ 正確答案：{question.answer}</span>
                )}
                <div className="explanation">{question.explanation}</div>
              </div>
            )}
          </div>
        </div>
      );
    } else {
      return (
        <div key={index} className="quiz-question">
          <div className="question-header">
            <span className="question-number">問題 {index + 1}</span>
            <span className="question-type">
              {question.questionType === 'vocabulary_mcq' ? '詞彙選擇' : '閱讀理解'}
            </span>
          </div>
          <div className="question-text">{question.questionText}</div>
          <div className="options-container">
            {question.options.map((option, optionIndex) => {
              const isSelected = userAnswer === option;
              const isCorrectOption = option === question.answer;
              let optionClass = 'option-button';
              
              if (isQuizFinished) {
                if (isCorrectOption) {
                  optionClass += ' correct';
                } else if (isSelected && !isCorrectOption) {
                  optionClass += ' incorrect';
                }
              } else if (isSelected) {
                optionClass += ' selected';
              }

              return (
                <button
                  key={optionIndex}
                  className={optionClass}
                  onClick={() => handleAnswerChange(index, option)}
                  disabled={isQuizFinished}
                >
                  {String.fromCharCode(65 + optionIndex)}. {option}
                </button>
              );
            })}
          </div>
          {isQuizFinished && (
            <div className="answer-feedback">
              <div className="explanation">{question.explanation}</div>
            </div>
          )}
        </div>
      );
    }
  }

  const allQuestionsAnswered = quizData.length > 0 && 
    quizData.every((_, index) => userAnswers[index] !== undefined && userAnswers[index].trim() !== '');

  if (quizData.length === 0) {
    return (
      <div className="text-analyzer-container">
        <PageHeader 
          title="文本分析器"
          showBackButton={true}
        />
        <div className="text-analyzer-welcome">
          歡迎，{userName}！將任何英文文本轉換為互動式測驗
        </div>

        <div className="text-input-section">
          <div className="input-instructions">
            <h3>🎯 如何使用</h3>
            <p>貼上任何英文文章、新聞或段落，我們將為您生成個人化的詞彙和理解測驗！</p>
          </div>

          <div className="language-toggle-section">
            <label className="language-toggle-label">
              📝 測驗題目語言：
            </label>
            <div className="language-toggle-buttons">
              <button
                className={`language-toggle-btn ${questionLanguage === 'chinese' ? 'active' : ''}`}
                onClick={() => setQuestionLanguage('chinese')}
                disabled={isLoading}
              >
                🇹🇼 繁體中文
              </button>
              <button
                className={`language-toggle-btn ${questionLanguage === 'english' ? 'active' : ''}`}
                onClick={() => setQuestionLanguage('english')}
                disabled={isLoading}
              >
                🇺🇸 English
              </button>
            </div>
            <p className="language-toggle-description">
              {questionLanguage === 'chinese' 
                ? '題目將以中文呈現，適合初學者理解概念' 
                : '題目將以英文呈現，提供更多語言練習機會'}
            </p>
          </div>
          
          <textarea
            className="text-input"
            placeholder="請貼上您想要學習的英文文本..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={8}
            disabled={isLoading}
          />
          
          <button
            className="generate-button"
            onClick={handleGenerateQuiz}
            disabled={!inputText.trim() || isLoading}
          >
            {isLoading ? '生成中...' : '🚀 生成測驗'}
          </button>
        </div>

        {isLoading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>AI 正在分析您的文本並生成測驗...</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="text-analyzer-container">
      <PageHeader 
        title="文本分析器"
        showBackButton={true}
      />
      <div className="text-analyzer-welcome">
        歡迎，{userName}！完成以下測驗來掌握文本內容
      </div>

      <div className="quiz-container">
        {quizData.map((question, index) => renderQuestion(question, index))}
        
        <div className="quiz-actions">
          {!isQuizFinished ? (
            <button
              className="submit-quiz-button"
              onClick={handleQuizSubmit}
              disabled={!allQuestionsAnswered}
            >
              提交答案
            </button>
          ) : (
            <div className="quiz-results">
              <div className="score-display">
                🎉 您答對了 {calculateScore()} / {quizData.length} 題！
              </div>
              <div className="results-actions">
                <button className="new-quiz-button" onClick={resetQuiz}>
                  分析新文本
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TextAnalyzerPage; 