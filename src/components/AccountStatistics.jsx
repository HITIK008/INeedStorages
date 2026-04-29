import { useState, useMemo, useEffect } from "react";
import { useFiles } from "../hooks/useFiles";
import { formatSize } from "../utils/formatSize";
import { apiClient } from "../services/api";

export default function AccountStatistics() {
  const { files } = useFiles();
  const [interval, setInterval] = useState("day");
  const [storageInfo, setStorageInfo] = useState({ usedStorage: 0, storageLimit: 0 });

  useEffect(() => {
    const fetchStorageInfo = async () => {
      try {
        const info = await apiClient.getStorageInfo();
        setStorageInfo(info);
      } catch (error) {
        console.error("Failed to fetch storage info:", error);
      }
    };
    fetchStorageInfo();
  }, []);

  // Calculate real views and downloads data
  const viewsDownloadsData = useMemo(() => {
    const totalViews = files.reduce((sum, file) => sum + (file.views || 0), 0);
    const totalDownloads = files.reduce((sum, file) => sum + (file.downloads || 0), 0);

    // Distribute totals across 24 hours
    const hours = Array.from({ length: 24 }, (_, i) => {
      const hour = String(i).padStart(2, "0");
      
      // Distribute views and downloads evenly across hours
      const viewsPerHour = Math.floor(totalViews / 24);
      const downloadsPerHour = Math.floor(totalDownloads / 24);
      
      // Add remainder to first hours
      const viewsRemainder = totalViews % 24;
      const downloadsRemainder = totalDownloads % 24;
      
      return {
        time: `${hour}:00`,
        views: viewsPerHour + (i < viewsRemainder ? 1 : 0),
        downloads: downloadsPerHour + (i < downloadsRemainder ? 1 : 0),
      };
    });
    return hours;
  }, [files]);

  // Calculate real storage data - not displayed as we use donut chart instead
  useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => {
      const hour = String(i).padStart(2, "0");
      return {
        time: `${hour}:00`,
        storage: storageInfo.usedStorage,
      };
    });
    return hours;
  }, [storageInfo]);

  const totalViews = files.reduce((sum, file) => sum + (file.views || 0), 0);
  const totalDownloads = files.reduce((sum, file) => sum + (file.downloads || 0), 0);
  const remainingStorage = storageInfo.storageLimit - storageInfo.usedStorage;
  
  const maxViews = Math.max(...viewsDownloadsData.map(d => d.views), 1);
  const maxDownloads = Math.max(...viewsDownloadsData.map(d => d.downloads), 1);

  return (
    <div className="border border-zinc-700 rounded-lg p-6 bg-zinc-950">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Account Statistics</h2>
        <div className="flex gap-2">
          {["Day", "Week", "Month", "Quarter", "Year"].map((label) => (
            <button
              key={label}
              onClick={() => setInterval(label.toLowerCase())}
              className={`px-4 py-1 rounded text-sm font-medium transition ${
                interval === label.toLowerCase()
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <h3 className="text-zinc-400 font-medium mb-4">Views and Downloads Over Time</h3>
            <div className="flex items-end justify-between h-48 gap-1 bg-zinc-900/50 p-4 rounded">
              {viewsDownloadsData.map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center justify-end gap-1 group">
                  <div
                    className="w-full bg-emerald-500 rounded-t transition-all hover:opacity-80"
                    style={{
                      height: item.views > 0 ? `${(item.views / maxViews) * 100}%` : "2px",
                      minHeight: item.views > 0 ? "8px" : "2px",
                    }}
                    title={`Views: ${item.views}`}
                  />
                  <div
                    className="w-full bg-amber-500 rounded transition-all hover:opacity-80"
                    style={{
                      height: item.downloads > 0 ? `${(item.downloads / maxDownloads) * 100}%` : "2px",
                      minHeight: item.downloads > 0 ? "8px" : "2px",
                    }}
                    title={`Downloads: ${item.downloads}`}
                  />
                  <div className="text-xs text-zinc-500 mt-1 hidden group-hover:block whitespace-nowrap">
                    {item.time}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded" />
                <span className="text-zinc-400">Views: {totalViews}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-500 rounded" />
                <span className="text-zinc-400">Downloads: {totalDownloads}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-zinc-400 font-medium mb-4">Storage Usage</h3>
            <div className="flex flex-col items-center justify-center h-48 bg-zinc-900/50 p-4 rounded">
              {/* Donut Chart */}
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  {/* Remaining storage (gray background) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#52525b"
                    strokeWidth="12"
                  />
                  {/* Used storage (indigo arc) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="12"
                    strokeDasharray={`${
                      (storageInfo.usedStorage / storageInfo.storageLimit) * 251.2
                    } 251.2`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                {/* Center percentage text */}
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-bold text-white">
                    {storageInfo.storageLimit > 0
                      ? ((storageInfo.usedStorage / storageInfo.storageLimit) * 100).toFixed(1)
                      : 0}
                    %
                  </span>
                  <span className="text-xs text-zinc-500">Used</span>
                </div>
              </div>
              {/* Labels */}
              <div className="flex flex-col gap-2 mt-4 text-sm w-full">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-indigo-500 rounded-full" />
                  <span className="text-zinc-400">
                    Used: {formatSize(storageInfo.usedStorage)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-zinc-600 rounded-full" />
                  <span className="text-zinc-400">
                    Remaining: {formatSize(remainingStorage)}
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-zinc-700">
                  <div className="w-3 h-3 bg-zinc-400 rounded-full" />
                  <span className="text-zinc-300">
                    Total: {formatSize(storageInfo.storageLimit)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

