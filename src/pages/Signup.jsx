import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiClient } from "../services/api";

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [generatedId, setGeneratedId] = useState(null);
  const [referralCode, setReferralCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateId = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.generateId();
      setGeneratedId(response.generatedId);
      setCopied(false);
    } catch (err) {
      setError(err.message || "Failed to generate ID");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(generatedId)
    );
    element.setAttribute("download", "account-id.txt");
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleLogin = async () => {
    if (!generatedId) return;
    
    setLoading(true);
    setError(null);
    try {
      const cleanedReferral = String(referralCode || "").trim().toUpperCase();
      await signup(generatedId, cleanedReferral);
      navigate("/");
    } catch (err) {
      setError(err.message || "Signup failed. Please try again.");
    } finally {
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
            <p className="text-sm text-zinc-400">Create Your Account</p>
          </div>
        </div>

        {/* Main Card */}
        <div className="border border-zinc-700 rounded-lg p-8 bg-zinc-950 space-y-6">
          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-200 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <p className="text-sm text-zinc-300 mb-4">
              Generate a 16-character ID to create your account. Store it safely!
            </p>

            {!generatedId ? (
              <button
                onClick={generateId}
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-600 px-4 py-3 rounded font-medium text-sm transition"
              >
                Generate ID
              </button>
            ) : (
              <div className="space-y-4">
                {/* Generated ID Display */}
                <div className="bg-zinc-900 border border-zinc-700 rounded p-4">
                  <p className="text-xs text-zinc-400 mb-2">Your Account ID</p>
                  <code className="text-lg font-mono font-bold text-indigo-300 break-all">
                    {generatedId}
                  </code>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={handleCopy}
                    disabled={loading}
                    className={`w-full px-4 py-2 rounded font-medium text-sm transition disabled:opacity-50 ${
                      copied
                        ? "bg-emerald-600 hover:bg-emerald-500"
                        : "bg-zinc-700 hover:bg-zinc-600"
                    }`}
                  >
                    {copied ? "✓ Copied!" : "Copy ID"}
                  </button>

                  <button
                    onClick={handleDownload}
                    disabled={loading}
                    className="w-full bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 px-4 py-2 rounded font-medium text-sm transition"
                  >
                    Download ID
                  </button>
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">
                    Referral Code (optional)
                  </label>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    maxLength={8}
                    placeholder="Enter 8-char code"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 font-mono uppercase"
                  />
                </div>

                {/* Login Button */}
                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-600 px-4 py-3 rounded font-medium text-sm transition"
                >
                  {loading ? "Creating Account..." : "Login with This ID"}
                </button>

                {/* Generate New */}
                <button
                  onClick={() => setGeneratedId(null)}
                  disabled={loading}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 px-4 py-2 rounded font-medium text-sm transition text-zinc-300"
                >
                  Generate Different ID
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-zinc-700">
            <p className="text-sm text-zinc-400">
              Already have an ID?{" "}
              <button
                onClick={() => navigate("/login")}
                disabled={loading}
                className="text-indigo-400 hover:text-indigo-300 underline disabled:opacity-50"
              >
                Login here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
