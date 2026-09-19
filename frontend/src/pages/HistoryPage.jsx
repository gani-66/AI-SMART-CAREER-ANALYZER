
import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Layout } from "../components/Layout";

const HistoryPage = () => {
  const { history } = useApp();
  const [expandedId, setExpandedId] = useState(null);

  return (
    <Layout>
      <div className="fade-up">
        <h1 className="text-3xl font-semibold text-white">
          Analysis History
        </h1>

        <p className="mt-2 text-sm text-white/50">
          View your complete resume and interview analysis history.
        </p>

        {history.length === 0 ? (
          <div className="mt-8 glass rounded-2xl p-8 text-center">
            <p className="text-white/50">
              No previous analyses found.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {history.map((item) => {
              const itemId = item.session_id || item.id;
              const isExpanded = expandedId === itemId;

              return (
                <div
                  key={itemId}
                  className="glass rounded-2xl p-6"
                >
                  <button
                    className="w-full text-left"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : itemId)
                    }
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-semibold text-white">
                          {item.role}
                        </h2>

                        <p className="text-sm text-white/45 mt-1">
                          {item.company_type}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-bold text-rose-400">
                          {item.resume_score ?? 0}
                        </div>

                        <div className="text-xs text-white/40">
                          Resume Score
                        </div>
                      </div>
                    </div>
                  </button>

                  <div className="mt-5">
                    <p className="text-xs uppercase tracking-widest text-white/40">
                      Skills
                    </p>

                    <p className="mt-2 text-sm text-white/70">
                      {item.detected_skills?.join(", ") ||
                        "No skills detected"}
                    </p>
                  </div>

                  <div className="mt-5 text-xs text-white/40">
                    {item.created_at
                      ? new Date(item.created_at).toLocaleString()
                      : "Date unavailable"}
                  </div>

                  <button
                    onClick={() =>
                      setExpandedId(isExpanded ? null : itemId)
                    }
                    className="mt-5 rounded-lg border border-rose-500/30 px-4 py-2 text-sm text-rose-300"
                  >
                    {isExpanded ? "Hide Details" : "View Complete Report"}
                  </button>

                  {isExpanded && (
                    <div className="mt-6 border-t border-white/10 pt-6 space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          Interview Score
                        </h3>

                        <p className="mt-2 text-white/70">
                          {item.interview_score ?? "Not available"} / 100
                        </p>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          Overall Score
                        </h3>

                        <p className="mt-2 text-white/70">
                          {item.overall_score ?? "Not available"} / 100
                        </p>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          Interview Questions and Answers
                        </h3>

                        <div className="mt-3 space-y-4">
                          {(item.interview_answers || []).length === 0 ? (
                            <p className="text-sm text-white/50">
                              No interview answers saved.
                            </p>
                          ) : (
                            item.interview_answers.map((answer, index) => (
                              <div
                                key={index}
                                className="rounded-xl border border-white/10 bg-black/20 p-4"
                              >
                                <p className="text-sm font-medium text-white">
                                  Q{index + 1}. {answer.question}
                                </p>

                                <p className="mt-2 text-sm text-white/60">
                                  Answer:{" "}
                                  {answer.answer || "No answer provided"}
                                </p>

                                <p className="mt-2 text-sm text-rose-300">
                                  Score: {answer.score ?? 0}/10
                                </p>

                                <p className="mt-2 text-sm text-white/50">
                                  {answer.feedback || "No feedback available"}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          Recommendations
                        </h3>

                        <p className="mt-2 text-sm text-white/60">
                          {item.recommendations ||
                            "No recommendations saved."}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default HistoryPage;