import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Layout } from "../components/Layout";
import { useApp } from "../context/AppContext";
import {
  evaluateAnswerAgainstRubric,
  buildInterviewEvaluation,
  BUCKET,
} from "../lib/interviewEvaluation";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Target,
  Lightbulb,
  Award,
} from "lucide-react";
import { FlipClock } from "../components/flip-clock";

const BUCKET_STYLE = {
  [BUCKET.WEAK]: {
    color: "text-rose-400",
    chip: "bg-rose-500/15 border-rose-500/40 text-rose-200",
    bar: "from-rose-500 to-rose-700",
  },
  [BUCKET.MODERATE]: {
    color: "text-amber-300",
    chip: "bg-amber-500/15 border-amber-500/40 text-amber-200",
    bar: "from-amber-400 to-amber-600",
  },
  [BUCKET.STRONG]: {
    color: "text-emerald-300",
    chip: "bg-emerald-500/15 border-emerald-500/40 text-emerald-200",
    bar: "from-emerald-400 to-emerald-600",
  },
};

export default function InterviewEvaluationScreen() {
  const { analysis, answers, setInterviewEvaluation, sessionId, } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [evaluation, setEvaluation] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!analysis || answers.length === 0) {
      navigate("/");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const qEvals = [];
        for (let i = 0; i < answers.length; i++) {
          if (cancelled) return;
          const a = answers[i];
          const evalResult = await evaluateAnswerAgainstRubric({
            session_id: sessionId,
            user_email: sessionStorage.getItem("ca_email") || "",
            question: a.question,
            answer: a.answer || "",
            role: analysis.role,
          });
          qEvals.push(evalResult);
          setProgress(i + 1);
        }
        if (cancelled) return;
        const full = buildInterviewEvaluation(qEvals);
        setEvaluation(full);
        setInterviewEvaluation(full);
      } catch (e) {
        if (!cancelled) {
          setError("Failed to compute rubric evaluation.");
          toast.error("Failed to compute rubric evaluation.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const bucketStyle = useMemo(() => {
    if (!evaluation) return BUCKET_STYLE[BUCKET.MODERATE];
    return BUCKET_STYLE[evaluation.bucket] || BUCKET_STYLE[BUCKET.MODERATE];
  }, [evaluation]);

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-32 fade-up" data-testid="evaluation-loading">
          <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
          <p className="text-white/55 mt-4 text-sm tracking-widest uppercase">
            Evaluating answers against rubric…
          </p>
          <p className="text-white/35 mt-2 text-xs">
            Question {Math.min(progress + 1, answers.length)} of {answers.length} ·{" "}
            {progress * 3}/{answers.length * 3} criteria scored
          </p>
          <div className="mt-5 w-64 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-rose-700 transition-all duration-500"
              style={{ width: `${(progress / answers.length) * 100}%` }}
            />
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !evaluation) {
    return (
      <Layout>
        <div className="text-center py-32" data-testid="evaluation-error">
          <p className="text-rose-400 text-lg">{error || "No evaluation available."}</p>
          <button
            onClick={() => navigate("/")}
            className="btn-ghost rounded-xl mt-6 px-5 py-2 text-sm"
          >
            Return home
          </button>
        </div>
      </Layout>
    );
  }

  const { score, bucket, criteriaPassed, totalCriteria, questionEvaluations, recommendations } =
    evaluation;

  return (
    <Layout>
      <section className="fade-up" data-testid="interview-evaluation-screen">
        <p className="text-xs uppercase tracking-[0.4em] text-rose-400/80">
          Rubric Evaluation
        </p>
        <h1 className="mt-2 text-4xl sm:text-5xl font-bold heading-gradient">
          Interview breakdown
        </h1>
        <p className="text-white/55 mt-3 max-w-lg">
          Every answer was scored against exactly 3 criteria. Your final score is the share of
          criteria you passed — no AI guesswork.
        </p>

        {/* Headline metrics */}
        <div className="grid sm:grid-cols-3 gap-5 mt-10">
          <div className="glass-strong rounded-2xl p-7 fade-up delay-1" data-testid="metric-score">
            <div className="text-xs uppercase tracking-widest text-white/40">Score</div>
            <div className="flex items-baseline gap-3 mt-3">
              <span data-testid="evaluation-score">
                <FlipClock value={score} animate anticipation size="sm" minLength={2} />
              </span>
              <span className="text-sm text-white/40">/100</span>
            </div>
            <div className="mt-4 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${bucketStyle.bar} transition-all duration-700`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>

          <div className="glass-strong rounded-2xl p-7 fade-up delay-2" data-testid="metric-bucket">
            <div className="text-xs uppercase tracking-widest text-white/40">Assessment</div>
            <div className="mt-3 flex items-center gap-2">
              <Award className={`w-5 h-5 ${bucketStyle.color}`} />
              <span
                className={`text-3xl font-bold ${bucketStyle.color}`}
                data-testid="evaluation-bucket"
              >
                {bucket}
              </span>
            </div>
            <span
              className={`inline-block mt-3 text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full border ${bucketStyle.chip}`}
            >
              0-40 weak · 41-70 moderate · 71-100 strong
            </span>
          </div>

          <div className="glass-strong rounded-2xl p-7 fade-up delay-3" data-testid="metric-criteria">
            <div className="text-xs uppercase tracking-widest text-white/40">Criteria met</div>
            <div className="flex items-baseline gap-1 mt-3">
              <span
                className="text-5xl font-bold text-white mono"
                data-testid="evaluation-criteria-passed"
              >
                {criteriaPassed}
              </span>
              <span className="text-sm text-white/40">/ {totalCriteria}</span>
            </div>
            <div className="mt-4 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-400 to-rose-600 transition-all duration-700"
                style={{ width: `${(criteriaPassed / totalCriteria) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Per-question breakdown */}
        <div className="mt-12">
          <div className="flex items-center gap-2 mb-5">
            <Target className="w-4 h-4 text-rose-400" />
            <h2 className="text-lg font-semibold text-white">Question breakdown</h2>
          </div>
          <div className="space-y-4">
            {questionEvaluations.map((qe, qi) => {
              const passedCount = qe.criteria.filter((c) => c.passed).length;
              return (
                <div
                  key={qi}
                  data-testid={`question-eval-${qi}`}
                  className="glass-strong rounded-2xl p-6 fade-up"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-white/35">
                        Question {qi + 1}
                      </div>
                      <p className="mt-1 text-white text-base leading-snug">{qe.question}</p>
                    </div>
                    <span
                      className="shrink-0 mono text-xs px-2.5 py-1 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-200"
                      data-testid={`question-eval-score-${qi}`}
                    >
                      {passedCount}/3
                    </span>
                  </div>

                  <div className="divider-red my-5" />

                  <div className="grid sm:grid-cols-3 gap-3">
                    {qe.criteria.map((c, ci) => (
                      <div
                        key={ci}
                        data-testid={`criterion-${qi}-${ci}`}
                        className={`rounded-xl border p-3 ${
                          c.passed
                            ? "border-emerald-500/30 bg-emerald-500/5"
                            : "border-rose-500/30 bg-rose-500/5"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {c.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="text-sm text-white font-medium leading-snug">
                              {c.name}
                            </div>
                            <p className="text-[11px] text-white/55 mt-1 leading-relaxed">
                              {c.explanation}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p
                    className="text-xs text-white/55 italic mt-4"
                    data-testid={`question-feedback-${qi}`}
                  >
                    {qe.feedback}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recommendations */}
        <div className="mt-12">
          <div className="flex items-center gap-2 mb-5">
            <Lightbulb className="w-4 h-4 text-rose-400" />
            <h2 className="text-lg font-semibold text-white">Recommendations</h2>
            <span className="text-xs text-white/35 mono ml-2">
              one per failed criterion
            </span>
          </div>
          {recommendations.length === 0 ? (
            <div
              className="glass-strong rounded-2xl p-6 text-emerald-300 text-sm"
              data-testid="no-recommendations"
            >
              Every criterion was passed. No improvements required.
            </div>
          ) : (
            <div className="space-y-3" data-testid="recommendations-list">
              {recommendations.map((r, i) => (
                <div
                  key={i}
                  data-testid={`recommendation-${i}`}
                  className="glass rounded-xl p-4 flex items-start gap-4"
                >
                  <div className="shrink-0 w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                    <span className="text-[10px] text-rose-300 mono">+{r.scorePotential}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-widest text-rose-400/80">
                      Failed: {r.failedCriterion}
                    </div>
                    <p className="text-sm text-white/85 mt-1 leading-relaxed">{r.action}</p>
                  </div>
                  <span className="hidden sm:inline text-[10px] uppercase tracking-widest text-white/40 mono">
                    Potential +{r.scorePotential} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3 mt-12">
          <button
            data-testid="continue-final-btn"
            onClick={() => navigate("/final")}
            className="btn-primary rounded-xl px-6 py-3 text-sm font-semibold tracking-wider uppercase flex items-center gap-2"
          >
            Continue to final report <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </Layout>
  );
}
