import { createContext, useContext, useEffect, useState } from "react";

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [analysis, setAnalysis] = useState(null); // { resume_score, detected_skills, role, company_type, resume_text }
  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]); // [{id, text}]
  const [answers, setAnswers] = useState([]); // [{question, answer, score, feedback, mode}]
  const [interviewEvaluation, setInterviewEvaluation] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
  const userEmail = sessionStorage.getItem("ca_email");

  if (!userEmail) {
    setHistory([]);
    return;
  }

  const loadHistory = async () => {
    try {
      const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

      const response = await fetch(
        `${API}/history?user_email=${encodeURIComponent(userEmail)}`
      );

      if (!response.ok) {
        throw new Error("Failed to load history");
      }

      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error("Failed to load history:", error);
    }
  };

  loadHistory();
}, []);

  const reset = () => {
    setAnalysis(null);
    setSessionId(null);
    setQuestions([]);
    setAnswers([]);
    setInterviewEvaluation(null);
  };

  return (
    <AppContext.Provider
      value={{
        analysis,
        setAnalysis,
        sessionId,
        setSessionId,
        questions,
        setQuestions,
        answers,
        setAnswers,
        interviewEvaluation,
        setInterviewEvaluation,
        history,
        setHistory,
        reset,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
};
