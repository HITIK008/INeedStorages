import { useState, useEffect, useMemo, useRef } from "react";
import { useFiles } from "../hooks/useFiles";
import { formatSize } from "../utils/formatSize";
import { formatDate } from "../utils/formatDate";
import { useNavigate } from "react-router-dom";

import useUpload from "../hooks/useUpload";
import { getDirectories, createDirectory, deleteDirectory } from "../services/file.service";
import { apiClient } from "../services/api";

const LARGE_FILE_THRESHOLD_BYTES = 50 * 1024 * 1024; // 50MB
const UNUSED_DAYS = 30;

export default function Files() {
  const navigate = useNavigate();
  const [currentDirectoryId, setCurrentDirectoryId] = useState(null);
  const { files, refreshFiles, removeFile, editFile } = useFiles(currentDirectoryId);
  const [copyedId, setCopyedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [directories, setDirectories] = useState([]);
  const fileInputRef = useRef(null);
  const { startUpload } = useUpload();
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [generatedLink, setGeneratedLink] = useState(null);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [linkError, setLinkError] = useState(null);
  const [linkMaxUploads, setLinkMaxUploads] = useState(9999);
  const [linkExpiryDays, setLinkExpiryDays] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [cleanupBusy, setCleanupBusy] = useState(false);
  const [sortField, setSortField] = useState("uploadedAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const sortedFiles = useMemo(() => {
    if (!files) return [];
    return [...files].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (sortField === "size") {
        aVal = Number(a.size || 0);
        bVal = Number(b.size || 0);
      } else if (sortField === "uploadedAt") {
        aVal = new Date(a.uploadedAt || 0).getTime();
        bVal = new Date(b.uploadedAt || 0).getTime();
      } else {
        aVal = String(aVal || "").toLowerCase();
        bVal = String(bVal || "").toLowerCase();
      }
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [files, sortField, sortOrder]);

  // load directories from server
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const dirs = await getDirectories();
        if (mounted) setDirectories(dirs || []);
      } catch (err) {
        console.error('Failed to load directories', err);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    refreshFiles();
    const interval = setInterval(() => {
      refreshFiles();
    }, 60_000);
    return () => clearInterval(interval);
  }, [refreshFiles]);

  const handleCopyLink = (fileId) => {
    const link = `${window.location.origin}/file/${fileId}`;
    navigator.clipboard.writeText(link);
    setCopyedId(fileId);
    setTimeout(() => setCopyedId(null), 2000);
  };

  const handleDelete = async (fileId) => {
    if (window.confirm("Are you sure you want to delete this file?")) {
      await removeFile(fileId);
    }
  };

  const startEdit = (file) => {
    setEditingId(file.id);
    setEditName(file.name);
    setEditNotes(file.notes || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditNotes("");
  };

  const saveEdit = async (fileId) => {
    try {
      await editFile(fileId, { name: editName, notes: editNotes });
      cancelEdit();
    } catch (err) {
      alert(err.message || "Failed to save changes");
    }
  };


  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    if (checked) setSelectedIds(files.map(f => f.id));
    else setSelectedIds([]);
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected item(s)?`)) return;
    for (const id of selectedIds) {
      try { await removeFile(id); } catch (e) { console.error(e); }
    }
    setSelectedIds([]);
    setSelectAll(false);
  };

  const handleNewDirectory = () => {
    const name = window.prompt('New directory name:');
    if (!name) return;
    (async () => {
      try {
        const resp = await createDirectory(name, null);
        const created = resp && resp.directory ? resp.directory : resp;
        setDirectories(prev => [created, ...prev]);
      } catch (err) {
        alert(err.message || 'Failed to create directory');
      }
    })();
  };

  const handleTriggerUpload = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleDeleteDirectory = async (dir) => {
    try {
      await deleteDirectory(dir.id);
      setDirectories((prev) => prev.filter((d) => d.id !== dir.id));
      if (currentDirectoryId === dir.id) {
        setCurrentDirectoryId(null);
      }
      refreshFiles();
    } catch (err) {
      alert(err.message || "Failed to delete folder");
    }
  };

  const handleFilesInput = async (e) => {
    const chosen = Array.from(e.target.files || []);
    if (chosen.length === 0) return;
    try {
      await startUpload(chosen, '', 'Central Europe', currentDirectoryId);
      refreshFiles();
    } catch (err) {
      console.error('Upload failed', err);
      alert(err.message || 'Upload failed');
    } finally {
      e.target.value = null;
    }
  };

  const handleCreateUploadLink = () => {
    setShowLinkModal(true);
    setGeneratedLink(null);
    setLinkError(null);
  };

  const handleGenerateUploadLink = async () => {
    setGeneratingLink(true);
    setLinkError(null);
    try {
      const resp = await apiClient.createUploadLink(Number(linkMaxUploads || 1), Number(linkExpiryDays || 1));
      const linkId = resp?.uploadLink?.id;
      const frontendLinkUrl = linkId ? `${window.location.origin}/upload/${linkId}` : resp?.linkUrl;
      setGeneratedLink({ ...resp, linkUrl: frontendLinkUrl });
    } catch (err) {
      console.error('Error creating upload link:', err);
      setLinkError(err.message || 'Failed to create upload link');
    } finally {
      setGeneratingLink(false);
    }
  };

  const largeFiles = useMemo(
    () => (files || []).filter((f) => Number(f.size || 0) >= LARGE_FILE_THRESHOLD_BYTES),
    [files]
  );

  const unusedFiles = useMemo(() => {
    const cutoff = Date.now() - UNUSED_DAYS * 24 * 60 * 60 * 1000;
    return (files || []).filter((f) => {
      const uploadedAt = f.uploadedAt ? new Date(f.uploadedAt).getTime() : 0;
      const noActivity = Number(f.views || 0) === 0 && Number(f.downloads || 0) === 0;
      return uploadedAt > 0 && uploadedAt <= cutoff && noActivity;
    });
  }, [files]);

  const suggestedIds = useMemo(() => {
    const ids = new Set();
    largeFiles.forEach((f) => ids.add(f.id));
    unusedFiles.forEach((f) => ids.add(f.id));
    return Array.from(ids);
  }, [largeFiles, unusedFiles]);

  const runCleanup = async (ids, label) => {
    if (!ids.length) return;
    setCleanupBusy(true);
    try {
      await Promise.all(ids.map((id) => apiClient.deleteFile(id)));
      await refreshFiles();
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
      alert(`${label} cleanup completed. Removed ${ids.length} file(s).`);
    } catch (err) {
      alert(err.message || "Cleanup failed");
    } finally {
      setCleanupBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Your Files</h1>
        <p className="text-zinc-400">
          Manage and share your uploaded files
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 items-center">
        <button onClick={handleNewDirectory} className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded text-sm font-medium">
          New Directory
        </button>
        <button onClick={handleTriggerUpload} className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded text-sm font-medium">
          Upload Files
        </button>
        <button onClick={handleCreateUploadLink} disabled={generatingLink} className="bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 px-4 py-2 rounded text-sm font-medium">
          {generatingLink ? 'Creating...' : 'Create Upload Link'}
        </button>
        <input ref={fileInputRef} type="file" multiple onChange={handleFilesInput} className="hidden" />
        <button onClick={handleDeleteSelected} className="ml-auto bg-rose-700 hover:bg-rose-600 px-4 py-2 rounded text-sm font-medium">
          Delete Selected
        </button>
      </div>

      {/* Auto-clean Suggestions */}
      <div className="border border-zinc-700 rounded-lg p-4 bg-zinc-950 space-y-3">
        <h3 className="text-sm font-semibold text-zinc-100">Auto-clean Suggestions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded p-3">
            <p className="text-zinc-400">Large files (≥ 50MB)</p>
            <p className="text-amber-300 font-semibold">{largeFiles.length}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded p-3">
            <p className="text-zinc-400">Unused for 30 days</p>
            <p className="text-rose-300 font-semibold">{unusedFiles.length}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded p-3">
            <p className="text-zinc-400">Total suggested</p>
            <p className="text-indigo-300 font-semibold">{suggestedIds.length}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            disabled={cleanupBusy || largeFiles.length === 0}
            onClick={() => runCleanup(largeFiles.map((f) => f.id), "Large files")}
            className="bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 px-3 py-1 rounded text-xs font-medium"
          >
            Clean Large Files
          </button>
          <button
            disabled={cleanupBusy || unusedFiles.length === 0}
            onClick={() => runCleanup(unusedFiles.map((f) => f.id), "Unused files")}
            className="bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 px-3 py-1 rounded text-xs font-medium"
          >
            Clean Unused 30d
          </button>
          <button
            disabled={cleanupBusy || suggestedIds.length === 0}
            onClick={() => runCleanup(suggestedIds, "Suggested")}
            className="bg-rose-700 hover:bg-rose-600 disabled:opacity-50 px-3 py-1 rounded text-xs font-medium"
          >
            One-click Cleanup
          </button>
        </div>
      </div>
      {/* Files Table */}
      {directories.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-zinc-300 mb-2">Directories</h3>
          <div className="space-y-2">
            {directories.map(dir => (
              <div
                key={dir.id}
                className={`flex items-center justify-between cursor-pointer border rounded px-4 py-2 ${
                  currentDirectoryId === dir.id
                    ? "bg-zinc-800 border-zinc-700"
                    : "bg-zinc-900 border-zinc-800"
                }`}
              >
                <button
                  onClick={() => { setCurrentDirectoryId(dir.id); }}
                  className="text-sm text-zinc-200 hover:text-white"
                >
                  📁 {dir.name}
                </button>
                <div className="flex items-center gap-3">
                  <div className="text-xs text-zinc-400">{new Date(dir.createdAt).toLocaleString()}</div>
                  <button
                    onClick={() => handleDeleteDirectory(dir)}
                    className="text-xs text-rose-400 hover:text-rose-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {currentDirectoryId && (
        <div className="mb-3">
          <button onClick={() => { setCurrentDirectoryId(null); }} className="text-sm text-indigo-400">← Back to root</button>
        </div>
      )}
      <div className="border border-zinc-700 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-700 bg-zinc-900">
              <th className="px-6 py-3 text-left text-sm font-medium text-zinc-300">
                <input type="checkbox" className="rounded" checked={selectAll} onChange={handleSelectAll} />
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-zinc-300">Name</th>
              <th 
                className="px-6 py-3 text-left text-sm font-medium text-zinc-300 cursor-pointer hover:text-white select-none group"
                onClick={() => { setSortField("size"); setSortOrder(sortField === "size" && sortOrder === "desc" ? "asc" : "desc"); }}
              >
                Size <span className="text-zinc-500 group-hover:text-zinc-300">{sortField === "size" ? (sortOrder === "asc" ? "↑" : "↓") : "↕"}</span>
              </th>
              <th className="px-6 py-3 text-center text-sm font-medium text-zinc-300">V</th>
              <th className="px-6 py-3 text-center text-sm font-medium text-zinc-300">D</th>
              <th 
                className="px-6 py-3 text-left text-sm font-medium text-zinc-300 cursor-pointer hover:text-white select-none group"
                onClick={() => { setSortField("uploadedAt"); setSortOrder(sortField === "uploadedAt" && sortOrder === "desc" ? "asc" : "desc"); }}
              >
                Date Modified <span className="text-zinc-500 group-hover:text-zinc-300">{sortField === "uploadedAt" ? (sortOrder === "asc" ? "↑" : "↓") : "↕"}</span>
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-zinc-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedFiles && sortedFiles.length > 0 ? (
              sortedFiles.map((file) => (
                <tr key={file.id} className="border-b border-zinc-800 hover:bg-zinc-900/50 align-top">
                  <td className="px-6 py-3">
                    <input type="checkbox" className="rounded" checked={selectedIds.includes(file.id)} onChange={() => toggleSelect(file.id)} />
                  </td>
                  <td className="px-6 py-3 text-sm text-indigo-400 hover:text-indigo-300 cursor-pointer max-w-[200px] sm:max-w-xs md:max-w-sm lg:max-w-md break-all">
                    {editingId === file.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-100"
                      />
                    ) : (
                      <button
                        onClick={() => navigate(`/file/${file.id}`)}
                        className="text-indigo-400 hover:text-indigo-300 underline text-left"
                      >
                        📄 {file.name}
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-3 text-sm text-zinc-300 whitespace-nowrap">{formatSize(file.size)}</td>
                  <td className="px-6 py-3 text-center text-sm text-zinc-400">{file.views ?? 0}</td>
                  <td className="px-6 py-3 text-center text-sm text-zinc-400">{file.downloads ?? 0}</td>
                  <td className="px-6 py-3 text-sm text-zinc-400">
                    {formatDate(file.uploadedAt)}
                  </td>
                  <td className="px-6 py-3 text-sm">
                    <div className="flex flex-col gap-1">
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(file)}
                          className="text-zinc-200 bg-zinc-700 hover:bg-zinc-600 px-2 py-1 rounded text-xs font-medium"
                        >
                          {editingId === file.id ? "Editing" : "Edit"}
                        </button>
                        <button
                          onClick={() => navigate(`/file/${file.id}`)}
                          className="text-emerald-400 hover:text-emerald-300 font-medium text-xs"
                        >
                          View
                        </button>
                        <button
                          onClick={() => apiClient.downloadFile(file.id)}
                          className="text-cyan-400 hover:text-cyan-300 font-medium text-xs"
                        >
                          Download
                        </button>
                        <button
                          onClick={() => handleCopyLink(file.id)}
                          className="text-indigo-400 hover:text-indigo-300 font-medium text-xs"
                        >
                          {copyedId === file.id ? "✓ Copied" : "Copy Link"}
                        </button>
                        <button
                          onClick={() => handleDelete(file.id)}
                          className="text-rose-400 hover:text-rose-300 font-medium text-xs"
                        >
                          Delete
                        </button>
                      </div>
                      {editingId === file.id && (
                        <div className="mt-2 space-y-2">
                          <textarea
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="Notes for this file..."
                            className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-100 resize-none"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEdit(file.id)}
                              className="bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded text-xs font-medium text-white"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="bg-zinc-800 hover:bg-zinc-700 px-3 py-1 rounded text-xs font-medium text-zinc-200"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-zinc-400">
                  No files uploaded yet. <br /> Upload files from the Overview page to see them here.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Upload Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 max-w-2xl w-full relative">
            <button 
              onClick={() => { setShowLinkModal(false); setGeneratedLink(null); setLinkError(null); }} 
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >✕</button>
            <h2 className="text-2xl font-bold text-white mb-4">✨ Upload Link</h2>
            <div className="space-y-4 mb-4">
              <p className="text-sm text-zinc-300">
                Temporary upload link for others to add files to this directory.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-sm text-zinc-300">Max files:</label>
                <input
                  type="number"
                  min={1}
                  value={linkMaxUploads}
                  onChange={(e) => setLinkMaxUploads(e.target.value)}
                  className="w-24 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-100"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-sm text-zinc-300">Link expiration:</label>
                {[1, 3, 7].map((d) => (
                  <label key={d} className="inline-flex items-center gap-2 text-sm text-zinc-200">
                    <input
                      type="radio"
                      name="expiryDays"
                      value={d}
                      checked={linkExpiryDays === d}
                      onChange={() => setLinkExpiryDays(d)}
                      className="accent-indigo-500"
                    />
                    {d} Day{d > 1 ? "s" : ""}
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleGenerateUploadLink}
                  disabled={generatingLink}
                  className="bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 px-4 py-2 rounded text-sm font-medium text-white"
                >
                  {generatingLink ? "Generating..." : "Generate"}
                </button>
                <button
                  onClick={() => {
                    setShowLinkModal(false);
                    setGeneratedLink(null);
                    setLinkError(null);
                  }}
                  className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded text-sm font-medium text-white"
                >
                  Hide
                </button>
              </div>
            </div>
            {linkError ? (
              <div className="bg-red-900/20 border border-red-700 rounded p-4 mb-4">
                <p className="text-red-400 text-sm"><strong>Error:</strong> {linkError}</p>
              </div>
            ) : generatedLink ? (
              <div className="space-y-4">
                <ul className="list-disc pl-5 text-sm text-zinc-300">
                  <li>
                    <a href={generatedLink.linkUrl} target="_blank" rel="noreferrer" className="text-indigo-300 hover:text-indigo-200 underline break-all">
                      {generatedLink.uploadLink.id}
                    </a>{" "}
                    - Expiry: {new Date(generatedLink.uploadLink.expiresAt).toLocaleDateString()}, {new Date(generatedLink.uploadLink.expiresAt).toLocaleTimeString()} / Max uploads : {generatedLink.uploadLink.maxUploads}
                  </li>
                </ul>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedLink.linkUrl);
                      alert('Link copied');
                    }}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded font-medium text-white transition"
                  >
                    📋 Copy Link
                  </button>
                  <button
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = generatedLink.linkUrl;
                      a.target = '_blank';
                      a.click();
                    }}
                    className="flex-1 bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded font-medium text-white transition"
                  >
                    🔗 Open
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
  