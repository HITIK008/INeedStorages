import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../services/api";
import { formatSize } from "../utils/formatSize";

const PLAN_DETAILS = {
  "50 GB": { gb: 50, priceUsd: 0.99, priceInr: 79 },
  "100 GB": { gb: 100, priceUsd: 1.99, priceInr: 149 },
  "500 GB": { gb: 500, priceUsd: 7.99, priceInr: 599 },
  "1 TB": { gb: 1024, priceUsd: 14.99, priceInr: 1199 },
  "5 TB": { gb: 5120, priceUsd: 69.99, priceInr: 5499 },
  "10 TB": { gb: 10240, priceUsd: 129.99, priceInr: 9999 },
};
export default function Subscriptions() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState("50 GB");
  const [months, setMonths] = useState(1);
  const [activeSubscriptions, setActiveSubscriptions] = useState([]);
  const [lastLoginAt, setLastLoginAt] = useState(null);
  const [storageInfo, setStorageInfo] = useState({
    storageLimit: 500 * 1024 * 1024,
    usedStorage: 0,
    remainingStorage: 500 * 1024 * 1024,
  });

  const plan = PLAN_DETAILS[selectedPlan];
  const totalPriceUsd = plan.priceUsd * months;
  const totalPriceInr = plan.priceInr * months;
  const handlePurchase = () => {
    navigate("/contact");
  };

  const periodLabel =
    months === 1 ? "1 month" : months === 12 ? "12 months (1 year)" : `${months} months`;

  useEffect(() => {
    let mounted = true;
    async function loadActive() {
      try {
        const resp = await apiClient.getActiveSubscriptions();
        const storage = await apiClient.getStorageInfo();
        if (!mounted) return;
        setActiveSubscriptions(resp.activeSubscriptions || []);
        setLastLoginAt(resp.lastLoginAt || null);
        setStorageInfo({
          storageLimit: Number(storage?.storageLimit || 500 * 1024 * 1024),
          usedStorage: Number(storage?.usedStorage || 0),
          remainingStorage: Number(storage?.remainingStorage || 0),
        });
      } catch (err) {
        if (!mounted) return;
        setActiveSubscriptions([]);
      }
    }
    loadActive();
    return () => {
      mounted = false;
    };
  }, []);

  const usedPercent =
    storageInfo.storageLimit > 0
      ? (storageInfo.usedStorage / storageInfo.storageLimit) * 100
      : 0;
  const overusedBytes = Math.max(0, storageInfo.usedStorage - storageInfo.storageLimit);
  const overusedPercent =
    storageInfo.storageLimit > 0
      ? (overusedBytes / storageInfo.storageLimit) * 100
      : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Subscriptions</h1>
        <p className="text-zinc-400">
          Buy additional storage and see how your files will expire.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Buy New Subscriptions */}
        <div className="border border-zinc-700 bg-zinc-950 rounded-lg p-4 text-sm">
          <h2 className="font-semibold mb-3">Buy New Subscriptions</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label className="text-zinc-300">Select Plan</label>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-100"
              >
                {Object.keys(PLAN_DETAILS).map(planName => (
                  <option key={planName} value={planName}>{planName}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between gap-2">
              <label className="text-zinc-300">Subscription Period</label>
              <select
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
                className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-100"
              >
                <option value={1}>1 Month</option>
                <option value={6}>6 Months</option>
                <option value={12}>1 Year</option>
                <option value={120}>10 Years</option>
              </select>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-zinc-300">Total Price:</span>
              <span className="font-semibold text-emerald-400">${totalPriceUsd.toFixed(2)} <span className="text-zinc-500 text-xs">(₹{totalPriceInr})</span></span>
            </div>
            <button
              onClick={handlePurchase}
              className="w-full mt-2 bg-zinc-700 hover:bg-zinc-600 rounded py-2 text-sm font-medium"
            >
              Purchase Subscription
            </button>
          </div>
        </div>

        {/* Storage Usage summary (dynamic with referral bonuses) */}
        <div className="border border-zinc-700 bg-zinc-950 rounded-lg p-4 text-sm">
          <h2 className="font-semibold mb-3 text-center">Storage Usage</h2>
          <div className="space-y-2 text-center">
            <div className="text-zinc-300">
              <span className="block text-xs text-zinc-400">Subscribed Storage</span>
              <span className="text-xl font-bold text-indigo-400">{formatSize(storageInfo.storageLimit)}</span>
              <span className="block text-xs text-zinc-400 mt-1">Total allocation</span>
            </div>
            <div className="text-zinc-300 mt-4">
              <span className="block text-xs text-zinc-400">Storage Used</span>
              <span className="text-xl font-bold text-emerald-400">{formatSize(storageInfo.usedStorage)}</span>
              <span className="block text-xs text-zinc-400 mt-1">{usedPercent.toFixed(1)}% of total</span>
            </div>
            <div className="text-zinc-300 mt-4">
              <span className="block text-xs text-zinc-400">Storage Overused</span>
              <span className="text-xl font-bold text-rose-400">{formatSize(overusedBytes)}</span>
              <span className="block text-xs text-zinc-400 mt-1">{overusedPercent.toFixed(1)}% over limit</span>
            </div>
          </div>
        </div>

        {/* Text about subscription + expiry */}
        <div className="border border-zinc-700 bg-zinc-950 rounded-lg p-4 text-sm space-y-3">
          <h2 className="font-semibold">Storage Subscription &amp; File Expiry</h2>
          <p className="text-zinc-300 font-semibold text-xs mt-1">When You Subscribe to Storage</p>
          <ul className="list-disc pl-5 text-xs text-zinc-300 space-y-1">
            <li>We calculate your new total storage limit.</li>
            <li>We remove expiry dates from your files that fit inside your storage limit, starting from oldest files.</li>
            <li>We keep expiry on newer files that exceed your storage plan.</li>
          </ul>
          <p className="text-zinc-300 font-semibold text-xs mt-3">When Your Subscription Expires</p>
          <ul className="list-disc pl-5 text-xs text-zinc-300 space-y-1">
            <li>Your available storage is set back to 0 bytes (or to any other active plan you still have).</li>
            <li>File expiry rules change back to the Free Plan.</li>
          </ul>
        </div>
      </div>

      {/* Active plans + login time */}
      <div className="border border-zinc-800 bg-zinc-950/80 rounded-xl p-6 text-sm space-y-4">
        <h2 className="text-xl font-semibold text-zinc-100">Active Subscriptions</h2>
        <p className="text-zinc-400">
          Latest login: {lastLoginAt ? new Date(lastLoginAt).toLocaleString() : "Not available"}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border border-zinc-700">
            <thead className="bg-zinc-900">
              <tr>
                <th className="text-left px-3 py-2 border border-zinc-700">ID</th>
                <th className="text-left px-3 py-2 border border-zinc-700">Plan</th>
                <th className="text-left px-3 py-2 border border-zinc-700">Quantity</th>
                <th className="text-left px-3 py-2 border border-zinc-700">Date Started</th>
                <th className="text-left px-3 py-2 border border-zinc-700">Date Expires</th>
              </tr>
            </thead>
            <tbody>
              {activeSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-3 text-zinc-400 border border-zinc-700">
                    No active subscriptions found.
                  </td>
                </tr>
              ) : (
                activeSubscriptions.map((s) => (
                  <tr key={s.id}>
                    <td className="px-3 py-2 border border-zinc-700">{s.id}</td>
                    <td className="px-3 py-2 border border-zinc-700">{s.planName || s.planType}</td>
                    <td className="px-3 py-2 border border-zinc-700">{s.quantity ?? 1}</td>
                    <td className="px-3 py-2 border border-zinc-700">
                      {s.dateStarted ? new Date(s.dateStarted).toLocaleString() : "--"}
                    </td>
                    <td className="px-3 py-2 border border-zinc-700">
                      {s.dateExpires ? new Date(s.dateExpires).toLocaleString() : "--"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes & Requirements */}
      <div className="border border-zinc-800 bg-zinc-950/80 rounded-xl p-6 text-sm space-y-4">
        <h2 className="text-xl font-semibold text-zinc-100">Notes & Requirements</h2>
        <ul className="list-disc pl-6 space-y-2 text-zinc-300">
          <li>
            Selected Plan: <strong>{selectedPlan}</strong>. Total for {periodLabel}:{" "}
            <strong>${totalPriceUsd.toFixed(2)} (or ₹{totalPriceInr})</strong>.
          </li>
          <li>
            Purchase requests are confirmed through the Contact page before activation.
          </li>
          <li>
            Storage upgrades apply to your account ID only. Use the same 16-character ID when contacting support.
          </li>
          <li>
            If a subscription expires and no active plan remains, account storage reverts to Free Plan limits.
          </li>
          <li>
            Existing files are not deleted immediately on expiry, but retention/expiry rules return to Free Plan behavior.
          </li>
          <li>
            Keep payment proof/transaction reference ready when requesting activation or renewal.
          </li>
        </ul>
      </div>
    </div>
  );
}