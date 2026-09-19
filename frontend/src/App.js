import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { AppProvider } from "./context/AppContext";
import HomePage from "./pages/HomePage";
import ResumeResultPage from "./pages/ResumeResultPage";
import InterviewPage from "./pages/InterviewPage";
import InterviewEvaluationScreen from "./pages/InterviewEvaluationScreen";
import FinalResultPage from "./pages/FinalResultPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import HistoryPage from "./pages/HistoryPage";

// FALLBACK: no real auth system in the codebase — using sessionStorage as the
// smallest possible client-side gate to make /login the first screen on start.
const RequireAuth = ({ children }) => {
  const { pathname } = useLocation();
  const authed = typeof window !== "undefined" && sessionStorage.getItem("ca_authed");
  if (!authed) return <Navigate to="/login" replace state={{ from: pathname }} />;
  return children;
};

function App() {
  return (
    <div className="App dark">
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route
              path="/"
              element={
                <RequireAuth>
                  <HomePage />
                </RequireAuth>
              }
            />
            <Route
              path="/result"
              element={
                <RequireAuth>
                  <ResumeResultPage />
                </RequireAuth>
              }
            />
            <Route
              path="/interview"
              element={
                <RequireAuth>
                  <InterviewPage />
                </RequireAuth>
              }
            />
            <Route
              path="/evaluation"
              element={
                <RequireAuth>
                  <InterviewEvaluationScreen />
                </RequireAuth>
              }
            />
            <Route
              path="/final"
              element={
                <RequireAuth>
                  <FinalResultPage />
                </RequireAuth>
              }
            />
            <Route
  path="/history"
  element={
    <RequireAuth>
      <HistoryPage />
    </RequireAuth>
  }
/>
          </Routes>
        </BrowserRouter>
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: "rgba(20, 20, 22, 0.95)",
              border: "1px solid rgba(225, 29, 72, 0.3)",
              color: "white",
            },
          }}
        />
      </AppProvider>
    </div>
  );
}

export default App;
