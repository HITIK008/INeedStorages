import { useEffect, useState } from "react";
import { apiClient } from "../services/api";
import { formatSize } from "../utils/formatSize";
import { useNavigate } from "react-router-dom";

export default function StorageStatus() {
  const [storage, setStorage] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStorageInfo();
  }, []);

  const fetchStorageInfo = async () => {
    try {
      setLoading(true);
      const info = await apiClient.getStorageInfo();
      setStorage(info);
    } catch (err) {
      console.error("Error fetching storage info:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !storage) {
    return <div className="text-sm text-zinc-400">Loading storage info...</div>;
  }

  const usagePercent = (storage.usedStorage / storage.storageLimit) * 100;
  const isNearLimit = usagePercent > 80;
  const isExceeded = usagePercent >= 100;

  return (
    <div className={`border rounded-lg p-6 ${isExceeded ? 'border-rose-500 bg-rose-500/10' : isNearLimit ? 'border-yellow-500 bg-yellow-500/10' : 'border-zinc-700 bg-zinc-900'}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-sm font-medium text-zinc-300 mb-2">Storage Usage</h3>
          <div className={`text-2xl font-semibold ${isExceeded ? 'text-rose-400' : isNearLimit ? 'text-yellow-400' : 'text-indigo-400'}`}>
            {formatSize(storage.usedStorage)} / {formatSize(storage.storageLimit)}
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            {usagePercent.toFixed(1)}% of storage used
          </p>
        </div>
        {!storage.isPremium && (
          <button
            onClick={() => navigate('/subscriptions')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs font-medium transition"
          >
            Upgrade
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden mb-3">
        <div
          className={`h-full transition-all ${isExceeded ? 'bg-rose-500' : isNearLimit ? 'bg-yellow-500' : 'bg-indigo-500'}`}
          style={{ width: `${Math.min(usagePercent, 100)}%` }}
        />
      </div>

      {/* Status Message */}
      {isExceeded ? (
        <p className="text-xs text-rose-400 font-medium">
          ⚠️ Storage limit exceeded. Upgrade to Premium for unlimited storage.
        </p>
      ) : isNearLimit ? (
        <p className="text-xs text-yellow-400 font-medium">
          ⚠️ You're using {formatSize(storage.storageLimit - storage.usedStorage)} remaining. Consider upgrading soon.
        </p>
      ) : (
        <p className="text-xs text-zinc-400">
          {formatSize(storage.storageLimit - storage.usedStorage)} remaining
        </p>
      )}

      {!storage.isPremium && (
        <div className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded">
          <p className="text-xs text-indigo-300 mb-2">
            <strong>Free Plan Limited to 500MB</strong> with 30-day file expiration
          </p>
          <p className="text-xs text-indigo-300/70">
            Upgrade to Premium for unlimited storage and longer file retention
          </p>
        </div>
      )}
    </div>
  );
}
