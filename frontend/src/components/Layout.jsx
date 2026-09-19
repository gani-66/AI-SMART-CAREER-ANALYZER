import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Sparkles, User, LogOut } from "lucide-react";

const steps = [
  { path: "/", label: "01 · Resume" },
  { path: "/result", label: "02 · Analysis" },
  { path: "/interview", label: "03 · Interview" },
  { path: "/evaluation", label: "04 · Rubric" },
  { path: "/final", label: "05 · Report" },
  { path: "/history", label: "06 · History"},
];

// FALLBACK: no user store in codebase — read session email set at login and
// derive a display name from its local part.
const useProfile = () => {
  const email =
    (typeof window !== "undefined" && sessionStorage.getItem("ca_email")) || "guest@career.app";
  const name = 
    (typeof window !== "undefined" && sessionStorage.getItem("ca_name")) || "Guest";
  return { name, email };
};

export const Layout = ({ children }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { name, email } = useProfile();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (open && wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const handleSignOut = () => {
    sessionStorage.removeItem("ca_authed");
    sessionStorage.removeItem("ca_email");
    sessionStorage.removeItem("ca_name");
    setOpen(false);
    navigate("/login");
  };

  return (
    <div className="bg-ambient" data-testid="app-layout">
      <header
        className="max-w-6xl mx-auto px-6 pt-8 pb-4 flex items-center justify-between fade-up"
        style={{ position: "relative", zIndex: 40 }}
      >
        <Link to="/" className="flex items-center gap-3 group" data-testid="brand-link">
          <div className="w-9 h-9 rounded-lg glass flex items-center justify-center red-glow">
            <Sparkles className="w-4 h-4" style={{ color: "#f43f5e" }} />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm tracking-[0.3em] text-white/50 uppercase">Ai smart</span>
            <span className="text-base font-semibold text-white">Career Analyzer</span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <nav className="hidden md:flex items-center gap-1 glass rounded-full px-2 py-1.5">
            {steps.map((s) => {
              const active = pathname === s.path;
              return (
                <span
                  key={s.path}
                  data-testid={`nav-${s.path.replace("/", "") || "home"}`}
                  onClick={() => navigate(s.path)}
                  className={`px-3 py-1.5 rounded-full text-xs tracking-wider uppercase transition-all ${
                    active
                      ? "bg-[rgba(225,29,72,0.18)] text-white red-glow"
                      : "text-white/45"
                  }`}
                >
                  {s.label}
                </span>
              );
            })}
          </nav>

          <div className="relative" ref={wrapRef}>
            <button
              type="button"
              data-testid="profile-btn"
              onClick={() => setOpen((v) => !v)}
              aria-label="Open profile"
              className="w-9 h-9 rounded-lg glass flex items-center justify-center red-glow focus:outline-none focus:ring-1 focus:ring-rose-500/40 transition-colors"
            >
              <User className="w-4 h-4" style={{ color: "#f43f5e" }} />
            </button>

            {open && (
              <div
                data-testid="profile-panel"
                className="absolute right-0 mt-3 w-64 glass-strong rounded-2xl p-5 z-50 fade-up"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg glass flex items-center justify-center red-glow">
                    <User className="w-4 h-4" style={{ color: "#f43f5e" }} />
                  </div>
                  <div className="min-w-0">
                    <div
                      className="text-sm font-semibold text-white truncate"
                      data-testid="profile-name"
                    >
                      {name}
                    </div>
                    <div
                      className="text-xs text-white/50 truncate"
                      data-testid="profile-email"
                    >
                      {email}
                    </div>
                  </div>
                </div>
                <div className="divider-red my-4" />
                <button
                  type="button"
                  data-testid="sign-out-btn"
                  onClick={handleSignOut}
                  className="btn-ghost w-full rounded-xl px-3 py-2 text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <div className="divider-red max-w-6xl mx-auto" />
      <main className="max-w-6xl mx-auto px-6 py-10">{children}</main>
      <footer className="max-w-6xl mx-auto px-6 py-10 text-xs text-white/35 flex items-center justify-between">
        <span>AI Smart Career Analyzer</span>
        <span className="mono">v1.0 · cinematic edition</span>
      </footer>
    </div>
  );
};
