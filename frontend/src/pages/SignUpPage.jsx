import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";

export default function SignUpPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password) {
      toast.error("Please fill all fields.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Registration failed");
      }

      toast.success("Account created successfully!");

      navigate("/login");
    } catch (error) {
      toast.error(error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-ambient min-h-screen flex items-center justify-center px-6">
      <form
        onSubmit={handleSubmit}
        className="glass-strong rounded-2xl p-8 w-full max-w-md"
      >
        <h1 className="text-3xl font-bold text-white">
          Create Account
        </h1>

        <p className="text-white/50 mt-2">
          Create your Career Analyzer account.
        </p>

        <div className="mt-6 space-y-4">

          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white"
          />

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white"
          />

        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary mt-6 w-full rounded-xl py-3 font-semibold"
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>

        <p className="text-white/50 text-sm text-center mt-5">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-rose-400"
          >
            Sign In
          </Link>
        </p>
      </form>
    </div>
  );
}