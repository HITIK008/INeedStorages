import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useUpload from "../hooks/useUpload";
import UploadProgress from "./UploadProgress";

export default function FileUploader() {
  const [file, setFile] = useState(null);
  const navigate = useNavigate();
  const { startUpload, progress, status, error, requiresUpgrade } = useUpload();

  async function handleUpload() {
    if (!file) return;
    await startUpload(file);
  }

  const handleUpgradeToPremium = () => {
    navigate('/subscriptions');
  };

  return (
    <div>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
        className="block w-full text-sm text-zinc-300 mb-3"
      />

      <button
        onClick={handleUpload}
        disabled={status === "uploading"}
        className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded text-sm"
      >
        {status === "uploading" ? "Uploading..." : "Upload"}
      </button>

      {status === "uploading" && <UploadProgress progress={progress} />}

      {requiresUpgrade && (
        <div className="mt-4 p-4 bg-rose-500/20 border border-rose-500 rounded-lg">
          <p className="text-sm text-rose-400 font-semibold mb-2">Storage Limit Exceeded</p>
          <p className="text-xs text-rose-300 mb-3">
            Your free account is limited to 500MB. You have reached your storage limit. Please upgrade to Premium for unlimited storage.
          </p>
          <button
            onClick={handleUpgradeToPremium}
            className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded text-sm font-medium transition"
          >
            Upgrade to Premium
          </button>
        </div>
      )}

      {error && !requiresUpgrade && <p className="text-sm text-red-400 mt-2">{error}</p>}

      {status === "success" && (
        <p className="text-sm text-green-400 mt-2">Upload completed successfully</p>
      )}
    </div>
  );
}
