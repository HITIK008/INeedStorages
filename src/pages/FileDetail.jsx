import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiClient } from "../services/api";
import { formatSize } from "../utils/formatSize";

export default function FileDetail() {
  const { fileId } = useParams();
  const navigate = useNavigate();
  const hasTrackedViewRef = useRef(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFile = useCallback(async () => {
    try {
      setLoading(true);
      // Use centralized API base URL and increment view count.
      const foundFile = await apiClient.getFileInfo(fileId);
      setFile(foundFile);
      setError(null);
    } catch (err) {
      console.error("Error fetching file:", err);
      setError("Failed to load file details");
      setFile(null);
    } finally {
      setLoading(false);
    }
  }, [fileId]);

  useEffect(() => {
    // In React StrictMode (dev), effects run twice. Guard so one page open => +1 view.
    if (hasTrackedViewRef.current) return;
    hasTrackedViewRef.current = true;
    fetchFile();
  }, [fetchFile]);

  const handleDownload = async () => {
    try {
      await apiClient.downloadFile(fileId);
    } catch (err) {
      console.error("Download error:", err);
      setError("Download failed");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <p>Loading file details...</p>
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || "File not found"}</p>
          <button
            onClick={() => navigate("/")}
            className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded text-sm"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* File Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-8">{file.name}</h1>

          {/* File Actions */}
          <div className="space-y-2 mb-8">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Direct:</span>
              <button
                onClick={handleDownload}
                className="text-indigo-400 hover:text-indigo-300 underline"
              >
                Download
              </button>
            </div>
          </div>

          {/* File Details */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Size:</span>
              <span className="font-medium">{formatSize(file.size)}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Views:</span>
              <span className="font-medium">{file.views || 0}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Downloads:</span>
              <span className="font-medium">{file.downloads || 0}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Uploaded:</span>
              <span className="font-medium">
                {new Date(file.uploadedAt).toLocaleDateString()}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Expires:</span>
              <span className="font-medium">
                {new Date(file.expiresAt).toLocaleDateString()}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Location:</span>
              <span className="font-medium">{file.location}</span>
            </div>

            {/* SHA-1 Hash */}
            <div className="pt-4 border-t border-zinc-700">
              <div className="text-sm">
                <span className="text-zinc-400">SHA-1:</span>
              </div>
              <code className="text-xs text-zinc-300 break-all font-mono">
                {file.hash || "N/A"}
              </code>
            </div>

            {/* Notes */}
            {file.notes && (
              <div className="pt-4 border-t border-zinc-700">
                <div className="text-sm">
                  <span className="text-zinc-400">Note:</span>
                </div>
                <p className="text-sm text-zinc-200 mt-1">{file.notes}</p>
              </div>
            )}
          </div>

          {/* Report Section */}
          <div className="mt-8 pt-6 border-t border-zinc-700">
            <p className="text-sm text-zinc-400">
              If you think this file violates content policy,{" "}
              <a
                href="/contact"
                className="text-indigo-400 hover:text-indigo-300 underline"
              >
                report here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
