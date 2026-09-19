import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  ShieldCheck,
} from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Enter your email and password to continue.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("http://localhost:8000/api/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    email: email.trim(),
    password: password,
  }),
});

const data = await response.json();

if (!response.ok) {
  throw new Error(data.detail || "Invalid email or password");
}

sessionStorage.setItem("ca_authed", "1");
sessionStorage.setItem("ca_email", data.email);
sessionStorage.setItem("ca_name", data.name);

toast.success("Signed in.");
navigate("/");
} finally {
      setSubmitting(false);
    }
};

  return (
    <div className="bg-ambient min-h-screen" data-testid="login-page">
      <div className="max-w-7xl mx-auto min-h-screen grid lg:grid-cols-[3fr_2fr]">
        {/* Left · Identity (60%) */}
        <section className="flex flex-col justify-between px-8 lg:px-14 py-10 fade-up">
          <Link to="/" className="flex items-center gap-3 group" data-testid="brand-link">
            <div className="w-9 h-9 rounded-lg glass flex items-center justify-center red-glow">
              <Sparkles className="w-4 h-4" style={{ color: "#f43f5e" }} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm tracking-[0.3em] text-white/50 uppercase">Ai Smart</span>
              <span className="text-base font-semibold text-white">Career Analyzer</span>
            </div>
          </Link>

          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.4em] text-rose-400/80 mb-5">
              Sign in
            </p>
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] heading-gradient"
              data-testid="login-heading"
            >
              Welcome back.<br />
              Continue your career analysis.
            </h1>
            <div className="divider-red my-8 max-w-xs" />
            <p className="text-white/55 text-base max-w-md">
              Your resume scores, mock interviews, and rubric evaluations are private to your
              account. Sign in to resume where you left off.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              {["Encrypted session", "Private analyses", "No third-party tracking"].map(
                (t, i) => (
                  <span
                    key={t}
                    className={`fade-up delay-${(i % 4) + 1} inline-flex items-center gap-2 text-xs uppercase tracking-widest px-3 py-1.5 rounded-full glass text-white/65`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                    {t}
                  </span>
                )
              )}
            </div>
          </div>

          <p className="text-xs text-white/35" data-testid="powered-by">
            Powered by Career Analyzer
          </p>
        </section>

        {/* Right · Auth panel (40%) — mirrors the "Begin Analysis" panel */}
        <section className="flex items-center px-8 lg:px-10 py-10">
          <form
            onSubmit={handleSubmit}
            className="glass-strong rounded-2xl p-7 w-full fade-up delay-2"
            data-testid="login-form"
          >
            <h2 className="text-lg font-semibold text-white">Sign in to your account</h2>
            <p className="text-sm text-white/45 mt-1">
              Use the email associated with your analyses.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-xs uppercase tracking-widest text-white/45" htmlFor="email">
                  Email
                </label>
                <div className="relative mt-2">
                  <Mail className="absolute top-3.5 left-3 w-4 h-4 text-white/30" />
                  <input
                    id="email"
                    data-testid="email-input"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full rounded-xl bg-black/40 border border-white/10 pl-9 pr-3 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/40 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label
                    className="text-xs uppercase tracking-widest text-white/45"
                    htmlFor="password"
                  >
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
                    data-testid="forgot-password-link"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative mt-2">
                  <Lock className="absolute top-3.5 left-3 w-4 h-4 text-white/30" />
                  <input
                    id="password"
                    data-testid="password-input"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl bg-black/40 border border-white/10 pl-9 pr-10 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/40 transition"
                  />
                  <button
                    type="button"
                    data-testid="toggle-password-visibility"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute top-1/2 -translate-y-1/2 right-2 p-1.5 rounded-md text-white/40 hover:text-white/80 focus:outline-none focus:ring-1 focus:ring-rose-500/40 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <label
                className="flex items-center gap-2 select-none cursor-pointer"
                data-testid="remember-me-label"
              >
                <input
                  data-testid="remember-me-input"
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-black/40 text-rose-500 focus:ring-1 focus:ring-rose-500/40"
                />
                <span className="text-sm text-white/65">Remember me for 30 days</span>
              </label>
            </div>

            <button
              type="submit"
              data-testid="sign-in-btn"
              disabled={submitting}
              className="btn-primary mt-7 w-full rounded-xl py-3.5 text-sm font-semibold tracking-wider uppercase flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Signing in…
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-xs text-white/45 mt-6 text-center">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-rose-400 hover:text-rose-300 transition-colors"
                data-testid="signup-link"
              >
                Sign Up
              </Link>
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}
