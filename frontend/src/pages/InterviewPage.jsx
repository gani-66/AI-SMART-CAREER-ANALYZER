import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Layout } from "../components/Layout";
import { useApp } from "../context/AppContext";
import { Type, Mic, Video, ArrowRight, Loader2, Timer, Square } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const DEFAULT_TIME_LIMIT = 60;
const MODES = [
  { id: "text", label: "Text", icon: Type },
  { id: "voice", label: "Voice", icon: Mic },
  { id: "video", label: "Video", icon: Video },
];

export default function InterviewPage() {
  const { analysis, questions, answers, setAnswers, sessionId } = useApp();
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState("text");
  const [answer, setAnswer] = useState("");
  const currentLimit =
    questions[index]?.time_limit_seconds || DEFAULT_TIME_LIMIT;
  const [timeLeft, setTimeLeft] = useState(currentLimit);
  const [submitting, setSubmitting] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const questionStartRef = useRef(Date.now());

  useEffect(() => {
    if (!analysis || questions.length === 0) {
      navigate("/");
    }
  }, [analysis, questions, navigate]);

  // Timer
  useEffect(() => {
    const limit = questions[index]?.time_limit_seconds || DEFAULT_TIME_LIMIT;
    setTimeLeft(limit);
    setAnswer("");
    setMode("text");
    questionStartRef.current = Date.now();
  }, [index, questions]);

  useEffect(() => {
    if (submitting) return;
    if (timeLeft <= 0) return;
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft, submitting]);

  // Video stream management
  useEffect(() => {
    const stopStream = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
    if (mode === "video") {
      navigator.mediaDevices
        ?.getUserMedia({ video: true, audio: false })
        .then((s) => {
          streamRef.current = s;
          if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch(() => toast.error("Camera access denied."));
    } else {
      stopStream();
    }
    return stopStream;
  }, [mode]);

  // Voice recognition
  const toggleListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      toast.error("Speech recognition not supported in this browser. Try Chrome/Edge.");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new SR();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
      }
      setAnswer(text);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
    recognitionRef.current = rec;
    setListening(true);
  };

  const currentQ = questions[index];

  const submitAnswer = async () => {
    if (submitting || !currentQ) return;
    setSubmitting(true);
    recognitionRef.current?.stop();
    const timeTakenSeconds = Math.min(
      currentLimit,
      Math.round((Date.now() - questionStartRef.current) / 1000)
    );
    try {
      console.log("Answer being submitted:", answer);
      const res = await axios.post(`${API}/evaluate_answer`, {
        session_id: sessionId,
        user_email: sessionStorage.getItem("ca_email") || "",
        question: currentQ.text,
        answer: answer,
        role: analysis.role,
      });
      const newAnswers = [
        ...answers,
        {
          question: currentQ.text,
          answer,
          mode,
          score: res.data.score,
          feedback: res.data.feedback,
          time_taken_seconds: timeTakenSeconds,
          time_limit_seconds: currentLimit,
        },
      ];
      setAnswers(newAnswers);
      if (index + 1 < questions.length) {
        setIndex(index + 1);
      } else {
        navigate("/evaluation");
      }
    } catch (err) {
      toast.error("Failed to evaluate answer.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (timeLeft === 0 && !submitting && currentQ) {
      submitAnswer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  if (!currentQ) return null;

  const progressPct = ((index) / questions.length) * 100;
  const timerPct = (timeLeft / currentLimit) * 100;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timerDisplay =
    mins > 0
      ? `${mins}:${String(secs).padStart(2, "0")}`
      : `${String(secs).padStart(2, "0")}s`;

  return (
    <Layout>
      <section className="fade-up">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-rose-400/80">
              Question {index + 1} of {questions.length}
            </p>
            <h2 className="mt-2 text-xl text-white/55">
              {analysis.role} · {analysis.company_type}
            </h2>
          </div>
          <div className="flex items-center gap-2 glass px-3 py-2 rounded-full" data-testid="timer">
            <Timer className={`w-4 h-4 ${timeLeft <= 10 ? "text-rose-400" : "text-white/55"}`} />
            <span className={`mono text-sm ${timeLeft <= 10 ? "text-rose-400" : "text-white/75"}`}>
              {String(timeLeft).padStart(2, "0")}s
            </span>
          </div>
        </div>

        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-rose-500 to-rose-700 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="glass-strong rounded-2xl p-8 mt-8" data-testid="question-card">
          <p className="text-xs uppercase tracking-widest text-white/35">Prompt</p>
          <h3
            className="mt-3 text-2xl sm:text-3xl font-semibold text-white leading-snug"
            data-testid="question-text"
          >
            {currentQ.text}
          </h3>

          <div className="mt-7 flex gap-2">
            {MODES.map((m) => {
              const Icon = m.icon;
              const active = mode === m.id;
              return (
                <button
                  key={m.id}
                  data-testid={`mode-${m.id}`}
                  onClick={() => setMode(m.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs uppercase tracking-widest transition ${
                    active
                      ? "bg-rose-500/15 border border-rose-500/50 text-white red-glow"
                      : "btn-ghost"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {m.label}
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            {mode === "video" && (
              <div className="rounded-xl overflow-hidden border border-white/10 bg-black mb-4 aspect-video max-h-[280px]">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  data-testid="video-preview"
                />
              </div>
            )}

            {mode === "voice" && (
              <div className="flex items-center gap-3 mb-3">
                <button
                  type="button"
                  data-testid="mic-toggle"
                  onClick={toggleListening}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm ${
                    listening ? "bg-rose-500 text-white pulse-red" : "btn-ghost"
                  }`}
                >
                  {listening ? <Square className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  {listening ? "Stop" : "Start speaking"}
                </button>
                <span className="text-xs text-white/40">
                  Chrome/Edge required for voice transcription.
                </span>
              </div>
            )}

            <textarea
              data-testid="answer-input"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={
                mode === "voice"
                  ? "Your transcript will appear here…"
                  : "Type your answer here…"
              }
              className="w-full min-h-[140px] rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/40"
            />
          </div>

          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-2 text-xs text-white/40">
              <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 transition-all"
                  style={{ width: `${timerPct}%` }}
                />
              </div>
              <span>Auto-submit on timeout</span>
            </div>
            <button
              data-testid="submit-answer-btn"
              onClick={submitAnswer}
              disabled={submitting}
              className="btn-primary rounded-xl px-6 py-3 text-sm font-semibold tracking-wider uppercase flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Evaluating…
                </>
              ) : (
                <>
                  {index + 1 === questions.length ? "Finish" : "Submit & Next"}{" "}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
