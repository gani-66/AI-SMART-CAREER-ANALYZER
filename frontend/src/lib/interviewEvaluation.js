import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// ---------- Hardcoded constants ----------
export const BUCKET_THRESHOLDS = {
  WEAK_MAX: 40,
  MODERATE_MAX: 70,
};

export const BUCKET = {
  WEAK: "Weak",
  MODERATE: "Moderate",
  STRONG: "Strong",
};

export const CRITERIA_PER_QUESTION = 3;

// ---------- Pure helpers ----------
export function calculateInterviewScore(questionEvaluations) {
  const totalCriteria = questionEvaluations.length * CRITERIA_PER_QUESTION;
  if (totalCriteria === 0) return { score: 0, criteriaPassed: 0, totalCriteria: 0 };
  const criteriaPassed = questionEvaluations.reduce(
    (sum, q) => sum + q.criteria.filter((c) => c.passed).length,
    0
  );
  const score = Math.round((criteriaPassed / totalCriteria) * 100);
  return { score, criteriaPassed, totalCriteria };
}

export function getInterviewBucket(score) {
  if (score <= BUCKET_THRESHOLDS.WEAK_MAX) return BUCKET.WEAK;
  if (score <= BUCKET_THRESHOLDS.MODERATE_MAX) return BUCKET.MODERATE;
  return BUCKET.STRONG;
}

// ---------- LLM-backed rubric call ----------
export async function evaluateAnswerAgainstRubric({
  session_id,
  user_email,
  question,
  answer,
  role,
}) {
  const res = await axios.post(`${API}/evaluate_rubric`, {
    session_id,
    user_email,
    question,
    answer,
    role,
  });

  return {
    question,
    criteria: res.data.criteria.map((c) => ({
      name: c.name,
      passed: c.passed,
      explanation: c.explanation,
      improvement_action: c.improvement_action,
    })),
    feedback: res.data.feedback,
  };
}

// ---------- Build full evaluation output ----------
export function buildRecommendations(questionEvaluations) {
  const totalCriteria = questionEvaluations.length * CRITERIA_PER_QUESTION;
  const scorePotential = totalCriteria
    ? Math.round((1 / totalCriteria) * 100)
    : 0;
  const recs = [];
  questionEvaluations.forEach((qe) => {
    qe.criteria
      .filter((c) => !c.passed)
      .forEach((c) => {
        recs.push({
          failedCriterion: c.name,
          action: c.improvement_action,
          scorePotential,
        });
      });
  });
  return recs;
}

export function buildInterviewEvaluation(questionEvaluations) {
  const { score, criteriaPassed, totalCriteria } =
    calculateInterviewScore(questionEvaluations);
  return {
    score,
    bucket: getInterviewBucket(score),
    criteriaPassed,
    totalCriteria,
    questionEvaluations,
    recommendations: buildRecommendations(questionEvaluations),
  };
}
