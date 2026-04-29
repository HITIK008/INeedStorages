import { useNavigate } from "react-router-dom";

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="border border-zinc-800 rounded-lg p-6 bg-zinc-900">
      <h2 className="font-medium mb-4">Quick Actions</h2>

      <div className="space-y-3">
        <button
          onClick={() => navigate("/files")}
          className="w-full rounded-md bg-zinc-800 hover:bg-zinc-700 px-4 py-2 text-sm text-left"
        >
          📁 View Files
        </button>

        <button
          onClick={() => navigate("/upload-links")}
          className="w-full rounded-md bg-zinc-800 hover:bg-zinc-700 px-4 py-2 text-sm text-left"
        >
          🔗 Create Upload Link
        </button>

        <button
          onClick={() => navigate("/subscriptions")}
          className="w-full rounded-md bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm text-left"
        >
          💳 Upgrade Storage
        </button>
      </div>
    </div>
  );
}
