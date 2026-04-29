import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiClient } from "../services/api";
import { formatSize } from "../utils/formatSize";

export default function Settings() {
  const { userId, changeAccountId, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(userId || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [publicSearchable, setPublicSearchable] = useState(
    localStorage.getItem("settings.publicSearchable") || "yes"
  );
  const [discordUrl, setDiscordUrl] = useState(localStorage.getItem("settings.discordUrl") || "");
  const [telegramUrl, setTelegramUrl] = useState(localStorage.getItem("settings.telegramUrl") || "");
  const [youtubeUrl, setYoutubeUrl] = useState(localStorage.getItem("settings.youtubeUrl") || "");
  const [webhookUrl, setWebhookUrl] = useState(localStorage.getItem("settings.webhookUrl") || "");
  const [notificationEmail, setNotificationEmail] = useState("");
  const [alerts, setAlerts] = useState([]);
  const [showDeleteStep, setShowDeleteStep] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [referralSummary, setReferralSummary] = useState(null);
  const referralCode = referralSummary?.referralCode || "";

  const maskedId = userId ? `${"#".repeat(12)}${userId.slice(-4)}` : "Not signed in";

  useEffect(() => {
    let mounted = true;
    async function loadReferrals() {
      try {
        const [data, storage, alertsResp] = await Promise.all([
          apiClient.getReferrals(),
          apiClient.getStorageInfo(),
          apiClient.getAlerts(),
        ]);
        if (!mounted) return;
        setReferralSummary(data);
        setNotificationEmail(storage?.notificationEmail || "");
        setAlerts(alertsResp?.alerts || []);
      } catch {
        if (!mounted) return;
        setReferralSummary(null);
      }
    }
    if (userId) loadReferrals();
    return () => {
      mounted = false;
    };
  }, [userId]);

  const handleCopy = () => {
    if (!userId) return;
    navigator.clipboard.writeText(userId);
    setMessage("Account ID copied to clipboard.");
  };

  const handleDownload = () => {
    if (!userId) return;
    const blob = new Blob([`INeedStorage Account ID: ${userId}\n`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ineedstorage-account-id.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    logout();
    setValue("");
    setMessage("Account ID cleared. Sign up again to get a new ID.");
  };

  const handleSave = async () => {
    const cleaned = String(value).trim().toUpperCase();
    if (cleaned.length !== 16) {
      setMessage("Account ID must be exactly 16 characters.");
      return;
    }
    try {
      setSaving(true);
      await changeAccountId(cleaned);
      setEditing(false);
      setMessage("Account ID updated.");
    } catch (err) {
      setMessage(err.message || "Failed to update Account ID.");
    } finally {
      setSaving(false);
    }
  };

  const persistSetting = (key, val, msg) => {
    localStorage.setItem(key, val);
    setMessage(msg);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "CONFIRM") {
      setMessage('Type "CONFIRM" in capital letters to continue.');
      return;
    }
    try {
      setDeletingAccount(true);
      await apiClient.deleteAccount("CONFIRM");
      localStorage.removeItem("userId");
      logout();
      setMessage("Account deleted permanently. All files and folders were removed.");
      setShowDeleteStep(false);
      setDeleteConfirmText("");
    } catch (err) {
      setMessage(err.message || "Failed to delete account.");
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-sm">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Settings</h1>
        <p className="text-zinc-400">
          Configure account visibility, social links, ID settings, and webhooks.
        </p>
      </div>

      <section className="border border-zinc-800 rounded-xl bg-zinc-950/80 p-6 space-y-4">
        <h2 className="text-xl font-semibold text-zinc-100">Account Settings</h2>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-zinc-300">Files Publicly Searchable:</label>
          <select
            value={publicSearchable}
            onChange={(e) => {
              setPublicSearchable(e.target.value);
              persistSetting("settings.publicSearchable", e.target.value, "Public search setting updated.");
            }}
            className="bg-zinc-900 border border-zinc-700 rounded px-3 py-1 text-zinc-100"
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-zinc-300">Delete all files and close this account:</span>
          <button
            onClick={() => setShowDeleteStep(true)}
            className="bg-rose-700 hover:bg-rose-600 text-white px-3 py-1 rounded text-xs font-medium"
          >
            Close
          </button>
        </div>
        {showDeleteStep && (
          <div className="mt-2 border border-rose-700/60 bg-rose-950/20 rounded p-4 space-y-3">
            <p className="text-rose-300 font-semibold">Close Account?</p>
            <p className="text-zinc-200">
              This decision is permanent. Once closed, your account cannot be recovered.
              All files and folders will be removed from database and storage.
            </p>
            <div className="flex flex-col md:flex-row gap-2 md:items-center">
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder='To confirm deletion, type "CONFIRM"'
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-zinc-100"
              />
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="bg-rose-700 hover:bg-rose-600 disabled:opacity-50 text-white px-4 py-2 rounded font-medium"
              >
                {deletingAccount ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={() => {
                  setShowDeleteStep(false);
                  setDeleteConfirmText("");
                }}
                className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="border border-zinc-800 rounded-xl bg-zinc-950/80 p-6 space-y-4">
        <h2 className="text-xl font-semibold text-zinc-100">Social Accounts</h2>
        <p className="text-zinc-400 text-xs">
          These links can be shown on your download pages under file details.
        </p>

        <SocialField
          label="Discord Server Invite URL"
          value={discordUrl}
          onChange={setDiscordUrl}
          onSave={() => persistSetting("settings.discordUrl", discordUrl, "Discord URL updated.")}
        />
        <SocialField
          label="Telegram Invite URL"
          value={telegramUrl}
          onChange={setTelegramUrl}
          onSave={() => persistSetting("settings.telegramUrl", telegramUrl, "Telegram URL updated.")}
        />
        <SocialField
          label="YouTube Channel URL"
          value={youtubeUrl}
          onChange={setYoutubeUrl}
          onSave={() => persistSetting("settings.youtubeUrl", youtubeUrl, "YouTube URL updated.")}
        />
      </section>

      <section className="border border-zinc-800 rounded-xl bg-zinc-950/80 p-6">
        <h2 className="text-xl font-semibold text-zinc-100 mb-4">User Settings</h2>

        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
          <div className="flex-1 text-sm text-zinc-200">
            <span className="text-zinc-400 mr-2">Account Id -</span>
            {editing ? (
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                maxLength={16}
                className="bg-zinc-900 border border-zinc-700 rounded px-3 py-1 text-sm w-full md:w-72 text-zinc-100"
                placeholder="16 character ID"
              />
            ) : (
              <span className="font-mono break-all">{maskedId}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 px-3 py-1 rounded text-sm font-medium"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setValue(userId || "");
                  }}
                  className="bg-zinc-800 hover:bg-zinc-700 px-3 py-1 rounded text-sm font-medium"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setEditing(true);
                    setValue(userId || "");
                    setMessage(null);
                  }}
                  className="bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={handleCopy}
                  className="bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded text-sm font-medium"
                >
                  Copy
                </button>
                <button
                  onClick={handleDownload}
                  className="bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded text-sm font-medium"
                >
                  Download
                </button>
                <button
                  onClick={handleReset}
                  className="bg-zinc-800 hover:bg-zinc-700 text-rose-300 px-3 py-1 rounded text-sm font-medium"
                >
                  Reset
                </button>
              </>
            )}
          </div>
        </div>

        <p className="text-xs text-zinc-400">
          Keep this ID safe. It is the only way to access your files and settings.
        </p>

        <div className="mt-4 flex flex-col md:flex-row md:items-center gap-2">
          <span className="text-zinc-400 text-xs">Your Referral Code:</span>
          <span className="font-mono text-amber-300">{referralCode || "--"}</span>
          <button
            onClick={() => {
              if (!referralCode) return;
              navigator.clipboard.writeText(referralCode);
              setMessage("Referral code copied.");
            }}
            className="bg-zinc-700 hover:bg-zinc-600 px-2 py-1 rounded text-xs font-medium w-fit"
          >
            Copy Referral
          </button>
        </div>

        {message && (
          <p className="mt-3 text-xs text-indigo-300">
            {message}
          </p>
        )}
      </section>

      <section className="border border-zinc-800 rounded-xl bg-zinc-950/80 p-6 space-y-4">
        <h2 className="text-xl font-semibold text-zinc-100">Notifications</h2>
        <p className="text-zinc-400 text-xs">
          Configure webhooks to receive notifications for account events.
        </p>
        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <label className="text-zinc-300">Notification Email:</label>
          <input
            type="email"
            value={notificationEmail}
            onChange={(e) => setNotificationEmail(e.target.value)}
            placeholder="you@example.com"
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-3 py-1 text-zinc-100"
          />
          <button
            onClick={async () => {
              try {
                await apiClient.updateNotificationEmail(notificationEmail);
                setMessage("Notification email updated.");
              } catch (err) {
                setMessage(err.message || "Failed to update email.");
              }
            }}
            className="bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded text-xs font-medium"
          >
            Save Email
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <label className="text-zinc-300">Webhook URL:</label>
          <input
            type="text"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://example.com/webhook"
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-3 py-1 text-zinc-100"
          />
          <button
            onClick={() => persistSetting("settings.webhookUrl", webhookUrl, "Webhook URL updated.")}
            className="bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded text-xs font-medium"
          >
            Update
          </button>
          <button
            onClick={() => {
              setWebhookUrl("");
              persistSetting("settings.webhookUrl", "", "Webhook URL removed.");
            }}
            className="bg-zinc-800 hover:bg-zinc-700 px-3 py-1 rounded text-xs font-medium text-zinc-200"
          >
            Remove
          </button>
        </div>
        <Link to="/help/webhooks" className="text-indigo-300 hover:text-indigo-200 underline text-sm">
          Read webhook documentation →
        </Link>

        <div className="pt-2">
          <h3 className="text-sm font-semibold text-zinc-200 mb-2">Storage Alert Log (80/90/100%)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-zinc-800">
              <thead className="bg-zinc-900">
                <tr>
                  <th className="px-3 py-2 text-left border border-zinc-800">Threshold</th>
                  <th className="px-3 py-2 text-left border border-zinc-800">Usage</th>
                  <th className="px-3 py-2 text-left border border-zinc-800">Email Target</th>
                  <th className="px-3 py-2 text-left border border-zinc-800">Date</th>
                </tr>
              </thead>
              <tbody>
                {alerts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-3 text-zinc-400 border border-zinc-800">
                      No storage alerts yet.
                    </td>
                  </tr>
                ) : (
                  alerts.map((a) => (
                    <tr key={a.id}>
                      <td className="px-3 py-2 border border-zinc-800 text-amber-300">{a.threshold}%</td>
                      <td className="px-3 py-2 border border-zinc-800 text-zinc-200">{a.usagePct}%</td>
                      <td className="px-3 py-2 border border-zinc-800 text-zinc-300">{a.email || "Not set"}</td>
                      <td className="px-3 py-2 border border-zinc-800 text-zinc-300">{new Date(a.createdAt).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="border border-zinc-800 rounded-xl bg-zinc-950/80 p-6 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <h2 className="text-xl font-semibold text-zinc-100">Referral List</h2>
          <span className="text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-900/50 px-2 py-1 rounded">
            🎁 Invite friends to get +100MB each!
          </span>
        </div>
        <p className="text-xs text-zinc-400 max-w-2xl">
          Share your referral code with others! When a new user signs up using your code, 
          both you and the new user will receive <strong>100MB of bonus storage</strong> space, up to a maximum of 1GB total bonus.
        </p>
        <div className="text-xs text-zinc-400 pt-2 border-t border-zinc-800/50">
          Total referrals: <span className="text-zinc-200">{referralSummary?.totalReferrals ?? 0}</span> •
          Bonus storage: <span className="text-emerald-300"> {formatSize(referralSummary?.totalBonusBytes ?? 0)}</span> •
          Current limit: <span className="text-indigo-300"> {formatSize(referralSummary?.currentStorageLimit ?? 500 * 1024 * 1024)}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border border-zinc-800">
            <thead className="bg-zinc-900">
              <tr>
                <th className="px-3 py-2 text-left border border-zinc-800">Referred Account</th>
                <th className="px-3 py-2 text-left border border-zinc-800">Bonus</th>
                <th className="px-3 py-2 text-left border border-zinc-800">Date</th>
              </tr>
            </thead>
            <tbody>
              {(referralSummary?.referrals || []).length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3 py-3 text-zinc-400 border border-zinc-800">
                    No referrals yet.
                  </td>
                </tr>
              ) : (
                referralSummary.referrals.map((r) => (
                  <tr key={r.id}>
                    <td className="px-3 py-2 border border-zinc-800 font-mono text-zinc-200">{r.referredUserId}</td>
                    <td className="px-3 py-2 border border-zinc-800 text-emerald-300">{formatSize(r.bonusBytes || 0)}</td>
                    <td className="px-3 py-2 border border-zinc-800 text-zinc-300">{new Date(r.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border border-zinc-800 rounded-xl bg-zinc-950/80 p-6 space-y-3">
        <h2 className="text-xl font-semibold text-zinc-100">Custom Landing Page</h2>
        <p className="text-zinc-300">
          Customize how your file download pages look by uploading your own HTML template.
        </p>
        <p className="text-zinc-400 text-xs">
          Manage templates and variables from the documentation page.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link to="/help/landing-page" className="text-indigo-300 hover:text-indigo-200 underline">
            Open landing page guide
          </Link>
          <Link to="/contact" className="text-indigo-300 hover:text-indigo-200 underline">
            Contact us for enablement
          </Link>
        </div>
      </section>
    </div>
  );
}

function SocialField({ label, value, onChange, onSave }) {
  return (
    <div className="flex flex-col md:flex-row gap-2 md:items-center">
      <label className="text-zinc-300 md:w-56">{label}:</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-3 py-1 text-zinc-100"
      />
      <button
        onClick={onSave}
        className="bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded text-xs font-medium"
      >
        Update
      </button>
    </div>
  );
}