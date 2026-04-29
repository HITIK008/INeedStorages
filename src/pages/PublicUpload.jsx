import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../services/api';
import { formatSize } from '../utils/formatSize';
import { formatDate } from '../utils/formatDate';

export default function PublicUpload() {
  const { linkId } = useParams();
  const [linkInfo, setLinkInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState('Central Europe');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchLinkInfo();
  }, [linkId]);

  const fetchLinkInfo = async () => {
    try {
      setLoading(true);
      const [linkResp, filesResp] = await Promise.all([
        apiClient.getUploadLinkInfo(linkId),
        apiClient.getUploadLinkFiles(linkId),
      ]);
      const resp = linkResp;
      setLinkInfo(resp.uploadLink);
      setUploadedFiles(filesResp.files || []);
      setFatalError(null);
    } catch (err) {
      setFatalError(err.message || 'Invalid or expired upload link');
      setLinkInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    setSelectedFiles(Array.from(e.target.files || []));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    if (!linkInfo) return;

    setUploading(true);
    setProgress(0);
    setUploadError(null);
    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + Math.random() * 20, 99));
      }, 100);

      const result = await apiClient.uploadViaLink(linkId, selectedFiles, notes, location);
      clearInterval(progressInterval);
      setProgress(100);

      setUploadedFiles(prev => [...(result.files || []), ...prev]);
      setSelectedFiles([]);
      setNotes('');
      
      setTimeout(() => {
        setProgress(0);
        fetchLinkInfo(); // Refresh link info and full uploaded-file list
      }, 1500);
    } catch (err) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-zinc-300">Loading upload link...</p>
        </div>
      </div>
    );
  }

  if (fatalError || !linkInfo) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="max-w-md mx-auto p-6 bg-zinc-900 border border-zinc-700 rounded-lg text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-2">⚠️ Error</h1>
          <p className="text-zinc-300 mb-4">{fatalError}</p>
          <p className="text-sm text-zinc-400">This upload link may be expired or invalid.</p>
        </div>
      </div>
    );
  }

  const currentFilesCount = uploadedFiles.length;
  const slotsRemaining = Math.max(0, linkInfo.maxUploads - currentFilesCount);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">📁 Temporary Upload Link</h1>
          <p className="text-zinc-400">Upload your files to share. This link will expire on {new Date(linkInfo.expiresAt).toLocaleDateString()} at {new Date(linkInfo.expiresAt).toLocaleTimeString()}</p>
        </div>

        {/* Upload Box */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-8 mb-6">
          {uploadError && (
            <div className="mb-4 border border-amber-700/60 bg-amber-900/20 rounded p-3">
              <p className="text-amber-200 text-sm">
                {uploadError.toLowerCase().includes("storage")
                  ? "Upgrage your plan to enjoy more storage"
                  : uploadError}
              </p>
            </div>
          )}
          <label className="block text-sm font-medium text-zinc-300 mb-4">Choose files to upload</label>
          <div className="border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-500 transition">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={triggerFileInput}
              className="text-indigo-400 hover:text-indigo-300 font-medium"
            >
              {selectedFiles.length === 0 ? '👇 Click to select files' : `✓ ${selectedFiles.length} file(s) selected`}
            </button>
            {selectedFiles.length > 0 && (
              <p className="text-sm text-zinc-400 mt-2">
                {selectedFiles.map(f => f.name).join(', ')}
              </p>
            )}
          </div>

          {/* Location & Notes */}
          <div className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-zinc-300">Location</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
              >
                <option>Central Europe</option>
                <option>Western US</option>
                <option>Eastern US</option>
                <option>Asia</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-300">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about these files..."
                className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-vertical min-h-20"
              />
            </div>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-zinc-300">Uploading...</p>
                <p className="text-sm text-zinc-400">{progress}%</p>
              </div>
              <div className="h-2 bg-zinc-800 rounded overflow-hidden">
                <div
                  className="h-2 bg-indigo-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Upload Button */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || uploading || slotsRemaining === 0}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded font-medium text-white transition"
            >
              {uploading ? 'Uploading...' : 'Upload Files'}
            </button>
            <button
              onClick={() => setSelectedFiles([])}
              className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded font-medium text-white transition"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Link Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-zinc-900 border border-zinc-700 rounded p-4 text-center">
            <p className="text-2xl font-bold text-indigo-400">{currentFilesCount}</p>
            <p className="text-xs text-zinc-400">Files Uploaded</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-700 rounded p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{slotsRemaining}</p>
            <p className="text-xs text-zinc-400">Slots Remaining</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-700 rounded p-4 text-center">
            <p className="text-sm font-mono text-zinc-300">{linkId}</p>
            <p className="text-xs text-zinc-400">Link ID</p>
          </div>
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">✓ Files Uploaded</h2>
            <div className="space-y-2">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex justify-between items-center p-3 bg-zinc-800 rounded">
                  <div>
                    <p className="text-sm font-medium text-zinc-100">📄 {file.name}</p>
                    <p className="text-xs text-zinc-400">
                      {formatSize(file.size)} • {formatDate(file.uploadedAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => apiClient.downloadFile(file.id)}
                    className="text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-100 px-3 py-1 rounded font-medium"
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {slotsRemaining === 0 && (
          <div className="bg-amber-900/20 border border-amber-700 rounded-lg p-4 text-center">
            <p className="text-amber-200">This upload link has reached its maximum file limit.</p>
          </div>
        )}
      </div>
    </div>
  );
}
