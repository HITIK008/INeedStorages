import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StorageCard from "../components/StorageCard";
import QuickActions from "../components/QuickActions";
import { useFiles } from "../hooks/useFiles";
import { formatSize } from "../utils/formatSize";
import useUpload from "../hooks/useUpload";
import AccountStatsChart from "../components/AccountStatsChart";
import { apiClient } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Overview() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [location, setLocation] = useState("Central Europe");
  const [notes, setNotes] = useState("");
  const [storageLimit, setStorageLimit] = useState(500 * 1024 * 1024);
  
  const { files, refreshFiles } = useFiles();
  const { startUpload, progress, status, currentUploadName, error, resetUpload } = useUpload();

  useEffect(() => {
    let mounted = true;
    async function loadStorage() {
      try {
        const s = await apiClient.getStorageInfo();
        if (!mounted) return;
        setStorageLimit(Number(s?.storageLimit || 500 * 1024 * 1024));
      } catch {
        if (!mounted) return;
        setStorageLimit(500 * 1024 * 1024);
      }
    }
    loadStorage();
    return () => {
      mounted = false;
    };
  }, [files.length]);

  const handleFileSelection = (e) => {
    setSelectedFiles(Array.from(e.target.files || []));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    const filesArray = Array.from(selectedFiles);

    try {
      await startUpload(filesArray, notes, location);
      // Refresh file list after upload
      refreshFiles();
      setSelectedFiles([]);
      setNotes("");
    } catch (err) {
      console.error("Upload error:", err);
    }
  };

  const handleCancel = () => {
    setSelectedFiles([]);
    setUploadingFiles([]);
  };

  // Simulate live users
  const [liveUsers, setLiveUsers] = useState(142);
  const [globalUploads, setGlobalUploads] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function loadGlobalStats() {
      try {
        const stats = await apiClient.getGlobalStats();
        if (mounted) setGlobalUploads(stats.totalUploads);
      } catch (err) {
        console.error("Failed to load global stats", err);
      }
    }
    loadGlobalStats();

    const interval = setInterval(() => {
      setLiveUsers(prev => Math.max(10, prev + Math.floor(Math.random() * 7) - 3));
    }, 4500);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Calculate storage stats
  const totalStorage = storageLimit;
  const usedStorage = files.reduce((sum, file) => sum + file.size, 0);
  const usagePercent = totalStorage > 0 ? (usedStorage / totalStorage) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Overview</h1>
          <p className="text-zinc-400">Monitor your storage usage and account status</p>
        </div>
        
        {/* Live Statistics Widget */}
        <div className="flex gap-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-center min-w-[120px] shadow-sm">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1 font-semibold">Live Users</p>
            <div className="flex items-center justify-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xl font-bold text-white">{liveUsers}</span>
            </div>
          </div>
          {isAuthenticated && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-center min-w-[120px] shadow-sm">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1 font-semibold">Your Uploads</p>
              <p className="text-xl font-bold text-emerald-400">{files.length}</p>
            </div>
          )}
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-center min-w-[120px] shadow-sm">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1 font-semibold">Total Uploads</p>
            <p className="text-xl font-bold text-indigo-400">{globalUploads}</p>
          </div>
        </div>
      </div>

      {/* QUICK UPLOAD SECTION */}
      <div className="border border-zinc-700 rounded-lg p-6 bg-zinc-950">
        <h2 className="text-lg font-semibold mb-2">Quick Upload</h2>
        <p className="text-sm text-zinc-400 mb-4">Files uploaded from here will be saved to your root directory.</p>
        
        <div className="space-y-4">
          {/* File Chooser & Location */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
              <label className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded cursor-pointer text-sm font-medium">
                Choose files
                <input 
                  type="file" 
                  multiple 
                  onChange={handleFileSelection}
                  className="hidden"
                />
              </label>
              <span className="text-sm text-zinc-400 break-words max-w-full">
                {selectedFiles.length > 0 
                  ? selectedFiles.map(f => f.name).join(", ") 
                  : "No file chosen"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Location</label>
              <select 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
              >
                <option>Central Europe</option>
                <option>Western US</option>
                <option>Eastern US</option>
                <option>Asia</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={handleUpload}
              disabled={selectedFiles.length === 0}
              className="bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 px-4 py-2 rounded text-sm font-medium"
            >
              Upload
            </button>
            <button 
              onClick={handleCancel}
              className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded text-sm font-medium"
            >
              Cancel
            </button>
          </div>

          {/* Notes Textarea */}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes to display under the download link (e.g., file password, social handles)."
            className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-vertical min-h-24"
          />

          {/* Uploading Files Progress */}
          {status === 'uploading' && (
            <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm text-zinc-300 mb-1">{currentUploadName}</p>
                    <div className="h-2 bg-zinc-900 rounded overflow-hidden">
                      <div 
                        className="h-2 bg-indigo-600 rounded"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">{progress}%</p>
                  </div>
                  <button onClick={() => { /* Not implemented real cancel yet */ }} className="text-sm text-zinc-400 hover:text-zinc-200 px-2 py-1">
                    Cancel
                  </button>
                </div>
            </div>
          )}

          {/* Uploaded Files List */}
          {files.length > 0 && (
            <div className="space-y-2 border-t border-zinc-700 pt-4">
              <div className="max-h-56 overflow-y-auto pr-2">
                <ul className="list-disc pl-5 space-y-1">
                  {files.map((file) => (
                    <li key={file.id} className="text-sm">
                      <button
                        onClick={() => navigate(`/file/${file.id}`)}
                        className="text-indigo-400 hover:text-indigo-300 underline text-left break-all"
                      >
                        {file.name} - {formatSize(file.size)}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400 break-all">{error}</p>
          )}
        </div>
      </div>

      {/* STORAGE STATS */}
      {isAuthenticated && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StorageCard title="Subscribed Storage" value={formatSize(totalStorage)} subtitle="Total allocation" color="indigo" />
            <StorageCard 
              title="Subscribed Storage Used" 
              value={formatSize(usedStorage)} 
              subtitle={`${usagePercent.toFixed(1)}% of total`} 
              color="emerald" 
            />
            <StorageCard title="Files With Expiry" value={files.length > 0 ? formatSize(usedStorage) : "0B"} subtitle={`0.0% over subscribed`} color="rose" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-zinc-800 rounded-lg p-6 bg-zinc-900">
              <h2 className="font-medium mb-4">Account Plan</h2>
              <div className="space-y-2 text-sm text-zinc-300">
                <p><span className="text-zinc-400">Plan:</span> Free Storage ({formatSize(totalStorage)})</p>
                <p><span className="text-zinc-400">File Expiry:</span> 7 days for free accounts</p>
                <p><span className="text-zinc-400">Region:</span> {location}</p>
              </div>
            </div>

            <QuickActions />
          </div>

          {/* Account statistics charts (similar to reference) */}
          <AccountStatsChart />
        </>
      )}
    </div>
  );
}
