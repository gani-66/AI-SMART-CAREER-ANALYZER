import { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { useApp } from "../context/AppContext";
import { RotateCcw, TrendingUp, MessageSquareText, Clock } from "lucide-react";
import { FlipClock } from "../components/flip-clock";

const ALL_SKILLS = ["Java", "Python", "SQL", "HTML", "JavaScript"];

const ROLE_SUGGESTIONS = {
  "Software Developer": ["DSA depth", "System design fundamentals", "Object-oriented design"],
  "Web Developer": ["Modern React patterns", "Responsive CSS", "REST + GraphQL fluency"],
  "Data Analyst": ["Advanced SQL joins/window funcs", "Statistics & A/B testing", "Tableau / Power BI"],
  "Prompt Engineer": ["LLM evaluation harnesses", "Prompt chaining strategies", "RAG architectures"],
};

export default function FinalResultPage() {
 const {
  analysis,
  answers,
  questions,
  reset,
  sessionId,
  interviewEvaluation,
} = useApp();
  const navigate = useNavigate();
  const saveStarted = useRef(false);

  useEffect(() => {
    if (!analysis || answers.length === 0) navigate("/");
  }, [analysis, answers, navigate]);

  const interviewScore = useMemo(() => {
    if (answers.length === 0) return 0;
    const total = answers.reduce((sum, a) => sum + a.score, 0);
    const maxPossible = answers.length * 10;
    return Math.round((total / maxPossible) * 100);
  }, [answers]);

  const totalTime = useMemo(
    () => answers.reduce((s, a) => s + (a.time_taken_seconds || 0), 0),
    [answers]
  );
  const avgTime = answers.length
    ? Math.round(totalTime / answers.length)
    : 0;

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  
  const overall = analysis
  ? Math.round((analysis.resume_score + interviewScore) / 2)
  : 0;
  const missing = analysis
  ? ALL_SKILLS.filter((s) => !analysis.detected_skills.includes(s))
  : [];

  useEffect(() => {
    const activeSessionId = sessionId || analysis?.session_id;
    const userEmail = sessionStorage.getItem("ca_email") || "";

    if (
      !analysis ||
      !activeSessionId ||
      !userEmail ||
      answers.length === 0 ||
      saveStarted.current
    ) {
      return;
    }

    saveStarted.current = true;

    const recommendations = [
  ...missing.map((skill) => `Improve ${skill}`),
  ...(ROLE_SUGGESTIONS[analysis.role] || []),
];

    const saveFinalReport = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/save_final_report`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              session_id: activeSessionId,
              user_email: userEmail,
              interview_score: interviewScore,
              overall_score: overall,
              interview_evaluation: interviewEvaluation,
                
              
              recommendations: recommendations,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to save final report");
        }

        console.log("Final report saved successfully");
      } catch (error) {
        saveStarted.current = false;
        console.error("Error saving final report:", error);
      }
    };

    saveFinalReport();
  }, [
    analysis,
    answers,
    interviewScore,
    overall,
    sessionId,
    missing,
  ]);

  if (!analysis || answers.length === 0) {
  return null;
}

  const scores = [
    { label: "Resume", value: analysis.resume_score, color: "from-rose-500 to-rose-700" },
    { label: "Interview", value: interviewScore, color: "from-rose-400 to-rose-600" },
    { label: "Overall", value: overall, color: "from-rose-300 to-rose-500" },
  ];

  return (
    <Layout>
      <section className="fade-up">
        <p className="text-xs uppercase tracking-[0.4em] text-rose-400/80">Final report</p>
        <h1 className="mt-2 text-4xl sm:text-5xl font-bold heading-gradient" data-testid="final-heading">
          Your career analysis
        </h1>
        <p className="text-white/55 mt-3 max-w-lg">
          A consolidated readout of your resume, mock interview performance, and tailored next steps.
        </p>

        <div className="grid sm:grid-cols-3 gap-5 mt-10">
          {scores.map((s, i) => (
            <div
              key={s.label}
              data-testid={`score-${s.label.toLowerCase()}`}
              className={`glass-strong rounded-2xl p-7 fade-up delay-${i + 1}`}
            >
              <div className="text-xs uppercase tracking-widest text-white/40">{s.label} score</div>
              <div className="flex items-baseline gap-3 mt-3">
                <FlipClock value={s.value} animate anticipation size="sm" minLength={2} />
                <span className="text-sm text-white/40">/100</span>
              </div>
              <div className="mt-4 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${s.color} transition-all duration-700`}
                  style={{ width: `${s.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div
          className="glass rounded-2xl p-5 mt-6 flex flex-wrap items-center justify-between gap-4 fade-up delay-2"
          data-testid="time-summary"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
              <Clock className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-white/40">Total time spent</div>
              <div className="text-lg font-semibold text-white mono">{formatTime(totalTime)}</div>
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-white/40">Avg per question</div>
            <div className="text-lg font-semibold text-white mono">{formatTime(avgTime)}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-white/40">Questions</div>
            <div className="text-lg font-semibold text-white mono">{answers.length}</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mt-10">
          <div className="glass-strong rounded-2xl p-7 fade-up" data-testid="suggestions-card">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-rose-400" />
              <h3 className="text-lg font-semibold text-white">Suggestions for improvement</h3>
            </div>
            <div className="divider-red my-5" />
            {missing.length > 0 && (
              <div className="mb-5">
                <div className="text-xs uppercase tracking-widest text-white/40 mb-2">
                  Missing core skills
                </div>
                <div className="flex flex-wrap gap-2">
                  {missing.map((m) => (
                    <span
                      key={m}
                      className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-white/75"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div>
              <div className="text-xs uppercase tracking-widest text-white/40 mb-2">
                Recommended focus for {analysis.role}
              </div>
              <ul className="space-y-2">
                {(ROLE_SUGGESTIONS[analysis.role] || []).map((s) => (
                  <li key={s} className="flex items-start gap-2 text-sm text-white/75">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2" /> {s}
                  </li>
                ))}
                {analysis.company_type.startsWith("Product") ? (
                  <li className="flex items-start gap-2 text-sm text-white/75">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2" />
                    Focus on first-principles, scalability, and conceptual depth for tier-1 product companies.
                  </li>
                ) : (
                  <li className="flex items-start gap-2 text-sm text-white/75">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2" />
                    Focus on practical implementation, debugging, and breadth for service-based companies.
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className="glass-strong rounded-2xl p-7 fade-up delay-1" data-testid="answers-card">
            <div className="flex items-center gap-2">
              <MessageSquareText className="w-4 h-4 text-rose-400" />
              <h3 className="text-lg font-semibold text-white">Question breakdown</h3>
            </div>
            <div className="divider-red my-5" />
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {answers.map((a, i) => {
                const taken = a.time_taken_seconds ?? 0;
                const limit = a.time_limit_seconds ?? 0;
                const ratio = limit ? taken / limit : 0;
                const tone =
                  ratio >= 0.95
                    ? "text-rose-300"
                    : ratio >= 0.6
                    ? "text-amber-300"
                    : "text-emerald-300";
                return (
                  <div
                    key={i}
                    data-testid={`answer-row-${i}`}
                    className="rounded-xl border border-white/10 bg-black/30 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-white/80 leading-relaxed">{a.question}</p>
                      <span className="shrink-0 mono text-xs px-2 py-1 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-200">
                        {a.score}/10
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-white/45">
                      <span
                        className={`inline-flex items-center gap-1 mono ${tone}`}
                        data-testid={`time-taken-${i}`}
                      >
                        <Clock className="w-3 h-3" />
                        {formatTime(taken)}
                        {limit > 0 && (
                          <span className="text-white/35"> / {formatTime(limit)} budget</span>
                        )}
                      </span>
                      {a.mode && (
                        <span className="uppercase tracking-widest text-[10px] text-white/35">
                          · {a.mode} mode
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/45 mt-2 italic">{a.feedback}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <button
          data-testid="restart-btn"
          onClick={() => {
            reset();
            navigate("/");
          }}
          className="btn-ghost rounded-xl mt-10 px-6 py-3 text-sm flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" /> Run another analysis
        </button>
      </section>
    </Layout>
  );
}
