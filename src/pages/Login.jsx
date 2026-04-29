import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [accountId, setAccountId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const cleaned = accountId.trim().toUpperCase();
      if (cleaned.length !== 16) {
        setError("ID must be exactly 16 characters");
        setLoading(false);
        return;
      }

      await login(cleaned);
      navigate("/");
    } catch (err) {
      setError(err.message || "Login failed. Please check your ID.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <img src="/logo.svg" alt="INeedStorage logo" className="h-12 w-12 rounded object-cover" />
          <div>
            <h1 className="text-2xl font-bold">INeedStorage</h1>
            <p className="text-sm text-zinc-400">Login to Your Account</p>
          </div>
        </div>

        {/* Main Card */}
        <div className="border border-zinc-700 rounded-lg p-8 bg-zinc-950 space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Account ID Input */}
            <div>
              <label className="block text-sm font-medium mb-2">Account ID</label>
              <input
                type="text"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="Enter your 16-character ID"
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 font-mono uppercase"
                maxLength="16"
              />
              <p className="text-xs text-zinc-400 mt-1">
                {accountId.length}/16 characters
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/30 border border-red-700 rounded px-4 py-2">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading || accountId.length < 16}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded font-medium text-sm transition"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* Footer */}
          <div className="pt-4 border-t border-zinc-700">
            <p className="text-sm text-zinc-400">
              Don't have an ID?{" "}
              <button
                onClick={() => navigate("/signup")}
                className="text-indigo-400 hover:text-indigo-300 underline"
              >
                Create one here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
