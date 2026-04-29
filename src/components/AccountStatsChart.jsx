import { useEffect, useMemo, useState } from "react";
import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { apiClient } from "../services/api";
import { formatSize } from "../utils/formatSize";
import { useAuth } from "../context/AuthContext";

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export default function AccountStatsChart() {
  const { userId, loading: authLoading } = useAuth();
  const [files, setFiles] = useState([]);
  const [storage, setStorage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewsInterval, setViewsInterval] = useState("week");
  const [storageInterval, setStorageInterval] = useState("week");

  const intervalConfig = {
    day: { label: "Day", days: 1 },
    week: { label: "Week", days: 7 },
    month: { label: "Month", days: 30 },
    quarter: { label: "Quarter", days: 90 },
    year: { label: "Year", days: 365 },
  };

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (authLoading) return;
      if (!userId) {
        if (!mounted) return;
        setFiles([]);
        setStorage(null);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [userFiles, storageInfo] = await Promise.all([
          apiClient.getFiles(),
          apiClient.getStorageInfo(),
        ]);
        if (!mounted) return;
        setFiles(Array.isArray(userFiles) ? userFiles : []);
        setStorage(storageInfo || null);
      } catch (err) {
        if (!mounted) return;
        setFiles([]);
        setStorage(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [userId, authLoading]);

  const buildTimeline = (selectedKey, mode = "views") => {
    const selected = intervalConfig[selectedKey] || intervalConfig.week;
    const now = Date.now();
    const cutoff = now - selected.days * 24 * 60 * 60 * 1000;

    const sorted = [...files]
      .filter((f) => f.uploadedAt)
      .filter((f) => new Date(f.uploadedAt).getTime() >= cutoff)
      .sort((a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt));

    const recent = sorted.slice(-8);
    const labels = recent.map((f) => {
      const d = new Date(f.uploadedAt);
      if (selectedKey === "day") {
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      } else if (selectedKey === "year" || selectedKey === "quarter") {
        return d.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
      } else {
        return `${d.toLocaleDateString([], { day: "2-digit", month: "short" })} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
      }
    });

    let cumulativeBytes = 0; // this starts from selected range start
    let cumulativeViews = 0;
    let cumulativeDownloads = 0;
    const storageSeriesMb = recent.map((f) => {
      cumulativeBytes += Number(f.size || 0);
      return Number((cumulativeBytes / (1024 * 1024)).toFixed(2));
    });
    const viewsSeries = recent.map((f) => {
      cumulativeViews += Number(f.views || 0);
      return cumulativeViews;
    });
    const downloadsSeries = recent.map((f) => {
      cumulativeDownloads += Number(f.downloads || 0);
      return cumulativeDownloads;
    });

    if (recent.length === 0) {
      return {
        labels: ["--"],
        storageSeriesMb: [0],
        viewsSeries: [0],
        downloadsSeries: [0],
      };
    }

    return { labels, storageSeriesMb, viewsSeries, downloadsSeries };
  };

  const viewsTimeline = useMemo(
    () => buildTimeline(viewsInterval, "views"),
    [files, viewsInterval]
  );
  const storageTimeline = useMemo(
    () => buildTimeline(storageInterval, "storage"),
    [files, storageInterval]
  );

  const viewsDownloadsData = {
    labels: viewsTimeline.labels,
    datasets: [
      {
        label: "Views",
        data: viewsTimeline.viewsSeries,
        borderColor: "#22c55e",
        backgroundColor: "rgba(34,197,94,0.2)",
        tension: 0.2,
      },
      {
        label: "Downloads",
        data: viewsTimeline.downloadsSeries,
        borderColor: "#eab308",
        backgroundColor: "rgba(234,179,8,0.15)",
        tension: 0.2,
      },
    ],
  };

  const storageData = {
    labels: storageTimeline.labels,
    datasets: [
      {
        label: "Storage (MB)",
        data: storageTimeline.storageSeriesMb,
        borderColor: "#22d3ee",
        backgroundColor: "rgba(34,211,238,0.2)",
        tension: 0.2,
      },
    ],
  };

  const viewsMax = Math.max(
    1,
    ...viewsTimeline.viewsSeries,
    ...viewsTimeline.downloadsSeries
  );
  const storageMax = Math.max(1, ...storageTimeline.storageSeriesMb);

  const usedBytes = Number(storage?.usedStorage || 0);
  const limitBytes = Number(storage?.storageLimit || 0);
  const freeBytes = Math.max(0, limitBytes - usedBytes);

  const storageBreakdownData = {
    labels: ["Used", "Free"],
    datasets: [
      {
        data: [usedBytes, freeBytes],
        backgroundColor: ["#22d3ee", "#3f3f46"],
        borderColor: ["#22d3ee", "#3f3f46"],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: "#e5e5e5",
          boxWidth: 10,
        },
      },
      tooltip: {
        callbacks: {
          label(ctx) {
            if (ctx.dataset.label === "Storage (MB)") {
              return `${ctx.parsed.y.toFixed(2)} MB`;
            }
            return `${ctx.dataset.label}: ${ctx.parsed.y}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "#a1a1aa", maxRotation: 0, minRotation: 0 },
        grid: { color: "#27272a" },
      },
      y: {
        ticks: { color: "#a1a1aa" },
        grid: { color: "#27272a" },
      },
    },
  };

  const viewsOptions = {
    ...options,
    scales: {
      ...options.scales,
      y: {
        ...options.scales.y,
        beginAtZero: true,
        suggestedMax: Math.ceil(viewsMax * 1.2),
      },
    },
  };

  const storageOptions = {
    ...options,
    scales: {
      ...options.scales,
      y: {
        ...options.scales.y,
        beginAtZero: true,
        suggestedMax: Number((storageMax * 1.2).toFixed(2)),
      },
    },
  };

  const donutOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: { color: "#e5e5e5", boxWidth: 10 },
      },
      tooltip: {
        callbacks: {
          label(ctx) {
            return `${ctx.label}: ${formatSize(ctx.parsed)}`;
          },
        },
      },
    },
  };

  return (
    <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-950 mt-6">
      <h2 className="text-sm font-medium text-zinc-200 mb-6">Account Statistics</h2>
      {loading && <p className="text-xs text-zinc-500 mb-3">Loading charts...</p>}
      
      {/* Centered Donut Chart */}
      <div className="flex flex-col items-center mb-10 max-w-sm mx-auto">
        <h3 className="text-sm text-zinc-300 font-medium mb-2">Storage Used vs Free</h3>
        <Doughnut data={storageBreakdownData} options={donutOptions} />
        <p className="text-xs text-zinc-400 mt-2">
          Used: {formatSize(usedBytes)} / Total: {formatSize(limitBytes)}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-zinc-200 mr-1">Interval</span>
            {Object.entries(intervalConfig).map(([key, cfg]) => (
              <button
                key={`v-${key}`}
                onClick={() => setViewsInterval(key)}
                className={`px-2 py-1 rounded text-xs font-medium border ${
                  viewsInterval === key
                    ? "bg-zinc-300 text-zinc-900 border-zinc-300"
                    : "bg-zinc-700 text-zinc-100 border-zinc-600 hover:bg-zinc-600"
                }`}
              >
                {cfg.label}
              </button>
            ))}
          </div>
          <h3 className="text-xs text-zinc-400 mb-2">Views and Downloads Over Time</h3>
          <Line data={viewsDownloadsData} options={viewsOptions} height={160} />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-zinc-200 mr-1">Interval</span>
            {Object.entries(intervalConfig).map(([key, cfg]) => (
              <button
                key={`s-${key}`}
                onClick={() => setStorageInterval(key)}
                className={`px-2 py-1 rounded text-xs font-medium border ${
                  storageInterval === key
                    ? "bg-zinc-300 text-zinc-900 border-zinc-300"
                    : "bg-zinc-700 text-zinc-100 border-zinc-600 hover:bg-zinc-600"
                }`}
              >
                {cfg.label}
              </button>
            ))}
          </div>
          <h3 className="text-xs text-zinc-400 mb-2">Storage Usage Over Time</h3>
          <Line data={storageData} options={storageOptions} height={160} />
        </div>
      </div>
    </div>
  );
}

