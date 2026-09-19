import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Layout } from "../components/Layout";
import { useApp } from "../context/AppContext";
import { FlipClock } from "../components/flip-clock";
import { CheckCircle2, ArrowRight, Loader2, Target } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const ALL_SKILLS = ["Java", "Python", "SQL", "HTML", "JavaScript"];

export default function ResumeResultPage() {
  const { analysis, setQuestions, sessionId } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    if (!analysis) {
      navigate("/");
      return;
    }
    let n = 0;
    const target = analysis.resume_score;
    const id = setInterval(() => {
      n += 2;
      if (n >= target) {
        setAnimatedScore(target);
        clearInterval(id);
      } else {
        setAnimatedScore(n);
      }
    }, 18);
    return () => clearInterval(id);
  }, [analysis, navigate]);

  if (!analysis) return null;

  const missingCore = ALL_SKILLS.filter((s) => !analysis.detected_skills.includes(s));

  const startInterview = async () => {
    setLoading(true);
    try {
      const sessionId =
  sessionStorage.getItem("ca_session_id") ||
  crypto.randomUUID();

sessionStorage.setItem("ca_session_id", sessionId);

const userEmail =
  sessionStorage.getItem("ca_email") || "";
      const res = await axios.post(`${API}/get_questions`, {
        session_id: sessionId,
        user_email: sessionStorage.getItem("ca_email") || "",
        role: analysis.role,
        company_type: analysis.company_type,
        skills: analysis.detected_skills,
      });
      setQuestions(res.data.questions);
      navigate("/interview");
    } catch (err) {
      toast.error("Failed to load questions.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <section className="grid lg:grid-cols-[0.9fr_1.1fr] gap-8">
        <div className="glass-strong rounded-2xl p-8 fade-up" data-testid="score-card">
          <p className="text-xs uppercase tracking-[0.4em] text-rose-400/80">Resume score</p>
          <div className="mt-6 flex items-center gap-6">
            <div
              className="score-ring w-48 h-48 flex items-center justify-center"
              style={{ "--p": `${animatedScore}%` }}
              data-testid="score-ring"
            >
              <div className="w-full h-full rounded-full bg-[#0c0c0e] flex flex-col items-center justify-center gap-1.5">
                <span data-testid="score-value">
                  <FlipClock
                    value={analysis.resume_score}
                    animate
                    anticipation
                    size="sm"
                    minLength={2}
                  />
                </span>
                <span className="text-[10px] uppercase tracking-widest text-white/40">/ 100</span>
              </div>
            </div>
            <div>
              <div className="text-sm text-white/55">Target role</div>
              <div className="text-lg font-semibold text-white">{analysis.role}</div>
              <div className="text-sm text-white/55 mt-3">Company tier</div>
              <div className="text-base text-white">{analysis.company_type}</div>
            </div>
          </div>
          <div className="divider-red my-7" />
          <p className="text-sm text-white/55 leading-relaxed">
            Each core skill (Java, Python, SQL, HTML, JavaScript) contributes 20 points. Strengthen
            missing skills to reach a perfect score before facing tier-1 product interviews.
          </p>
        </div>

        <div className="space-y-6 fade-up delay-1">
          <div className="glass-strong rounded-2xl p-7" data-testid="skills-card">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Detected skills</h2>
              <span className="text-xs text-white/40 mono">
                {analysis.detected_skills.length} matched
              </span>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {analysis.detected_skills.length === 0 && (
                <p className="text-sm text-white/45">No notable skills detected.</p>
              )}
              {analysis.detected_skills.map((s) => (
                <span
                  key={s}
                  data-testid={`skill-${s.toLowerCase().replace(/\s+/g, "-")}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-sm text-rose-100"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" /> {s}
                </span>
              ))}
            </div>

            {missingCore.length > 0 && (
              <>
                <div className="divider-red my-6" />
                <h3 className="text-sm text-white/55 uppercase tracking-widest flex items-center gap-2">
                  <Target className="w-3.5 h-3.5 text-rose-400" /> Missing core skills
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {missingCore.map((s) => (
                    <span
                      key={s}
                      className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-white/55"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            data-testid="start-interview-btn"
            onClick={startInterview}
            disabled={loading}
            className="btn-primary w-full rounded-xl py-4 text-sm font-semibold tracking-wider uppercase flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Preparing interview…
              </>
            ) : (
              <>
                Start Mock Interview <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </section>
    </Layout>
  );
}
