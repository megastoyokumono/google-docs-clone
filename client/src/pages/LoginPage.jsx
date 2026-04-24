import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login as loginApi } from "../lib/api";
import { useAuth } from "../lib/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const data = await loginApi({ username, password });
      login(data.token, data.user);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-workspace px-4">
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1a73e8] shadow-md">
            <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white">
              <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7zm0 1.5L17.5 7H14zM9 11h6v1.5H9zm0 3h6v1.5H9zm0 3h4v1.5H9z" />
            </svg>
          </div>
          <h1 className="text-[28px] font-normal text-[#202124]">Sign in to Docs</h1>
          <p className="text-sm text-[#5f6368]">Use your Docs account</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[#dadce0] bg-white px-8 py-8 shadow-sm">
          {error && (
            <div className="mb-5 rounded-lg bg-[#fce8e6] px-4 py-3 text-sm text-[#d93025]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label htmlFor="login-username" className="mb-1.5 block text-sm font-medium text-[#3c4043]">
                Username
              </label>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                placeholder="Enter your username"
                className="h-11 w-full rounded-lg border border-[#dadce0] bg-white px-4 text-sm text-[#202124] outline-none transition focus:border-[#1a73e8] focus:ring-2 focus:ring-[#e8f0fe]"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-[#3c4043]">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                className="h-11 w-full rounded-lg border border-[#dadce0] bg-white px-4 text-sm text-[#202124] outline-none transition focus:border-[#1a73e8] focus:ring-2 focus:ring-[#e8f0fe]"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-1 h-11 w-full rounded-lg bg-[#1a73e8] text-sm font-medium text-white shadow-sm transition hover:bg-[#1765cc] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-6 border-t border-[#f1f3f4] pt-5 text-center">
            <p className="text-sm text-[#5f6368]">
              Don&apos;t have an account?{" "}
              <Link to="/signup" className="font-medium text-[#1a73e8] hover:underline">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
