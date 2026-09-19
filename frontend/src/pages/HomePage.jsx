import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Layout } from "../components/Layout";
import { useApp } from "../context/AppContext";
import { Upload, FileText, ArrowRight, Loader2 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ROLES = ["Software Developer", "Web Developer", "Data Analyst", "Prompt Engineer"];
const COMPANY_TYPES = [
  { value: "Product-based", desc: "Google · OpenAI · Amazon" },
  { value: "Service-based", desc: "TCS · Infosys · Deloitte" },
];

export default function HomePage() {
  const [file, setFile] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [role, setRole] = useState(ROLES[0]);
  const [companyType, setCompanyType] = useState(COMPANY_TYPES[0].value);
  const [loading, setLoading] = useState(false);
  const { setAnalysis, setSessionId, reset } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file && !resumeText.trim()) {
      toast.error("Please upload a resume or paste resume text.");
      return;
    }
    setLoading(true);
    reset();
    try {
      const form = new FormData();
      form.append("role", role);
      form.append("company_type", companyType);
      form.append("user_email", sessionStorage.getItem("ca_email") || "");
      if (file) form.append("file", file);
      if (resumeText.trim()) form.append("resume_text", resumeText);
      const res = await axios.post(`${API}/analyze_resume`, form);
      console.log(res.data)
      setSessionId(res.data.session_id);
      setAnalysis(res.data);
      navigate("/result");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to analyze resume.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <section className="grid lg:grid-cols-[1.1fr_1fr] gap-10 items-start">
        <div className="fade-up">
          <p className="text-xs tracking-[0.4em] uppercase text-rose-400/80 mb-5" data-testid="eyebrow">
            AI · Career Intelligence Suite
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] heading-gradient" data-testid="home-heading">
            Decode your resume.<br />
            Rehearse the interview.<br />
            Land the role.
          </h1>
          <p className="text-white/55 mt-6 max-w-lg text-base">
            A cinematic, AI-powered analyzer that scores your resume, detects skills, and conducts a
            domain-aware mock interview tuned to your target role and company tier.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            {["Resume Scoring", "Skill Detection", "Mock Interview", "Voice + Video", "AI Evaluation"].map(
              (t, i) => (
                <span
                  key={t}
                  className={`fade-up delay-${(i % 4) + 1} text-xs uppercase tracking-widest px-3 py-1.5 rounded-full glass text-white/65`}
                >
                  {t}
                </span>
              )
            )}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="glass-strong rounded-2xl p-7 fade-up delay-2"
          data-testid="resume-form"
        >
          <h2 className="text-lg font-semibold text-white">Begin analysis</h2>
          <p className="text-sm text-white/45 mt-1">Upload or paste your resume to start.</p>

          <label
            htmlFor="resume-file"
            className="mt-6 group flex items-center gap-4 p-4 rounded-xl border border-white/10 hover:border-rose-500/40 cursor-pointer transition-colors"
            data-testid="file-drop"
          >
            <div className="w-11 h-11 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
              <Upload className="w-5 h-5 text-rose-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white truncate">
                {file ? file.name : "Upload resume"}
              </div>
              <div className="text-xs text-white/40">.pdf, .docx, .txt — max 5MB</div>
            </div>
            <input
              id="resume-file"
              data-testid="file-input"
              type="file"
              accept=".pdf,.docx,.txt"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-white/35 uppercase tracking-widest">or paste</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <div className="relative">
            <FileText className="absolute top-3 left-3 w-4 h-4 text-white/30" />
            <textarea
              data-testid="resume-text"
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume text here…"
              className="w-full min-h-[120px] rounded-xl bg-black/40 border border-white/10 pl-9 pr-3 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/40 transition"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mt-5">
            <div>
              <label className="text-xs uppercase tracking-widest text-white/45">Target role</label>
              <select
                data-testid="role-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-2 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-3 text-sm text-white focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/40"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-white/45">Company type</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {COMPANY_TYPES.map((c) => {
                  const active = companyType === c.value;
                  return (
                    <button
                      type="button"
                      key={c.value}
                      data-testid={`company-${c.value.toLowerCase().replace(/[^a-z]/g, "")}`}
                      onClick={() => setCompanyType(c.value)}
                      className={`text-left rounded-xl border px-3 py-2 transition ${
                        active
                          ? "border-rose-500/60 bg-rose-500/10 red-glow"
                          : "border-white/10 hover:border-white/25"
                      }`}
                    >
                      <div className="text-sm text-white">{c.value}</div>
                      <div className="text-[10px] text-white/40">{c.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            data-testid="analyze-btn"
            type="submit"
            disabled={loading}
            className="btn-primary mt-7 w-full rounded-xl py-3.5 text-sm font-semibold tracking-wider uppercase flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Analyzing…
              </>
            ) : (
              <>
                Analyze Resume <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </section>
    </Layout>
  );
}
