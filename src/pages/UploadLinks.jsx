import { useEffect, useState } from "react";
import { apiClient } from "../services/api";
import { formatSize } from "../utils/formatSize";

export default function UploadLinks() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const data = await apiClient.getUploadLinks();
        if (mounted) {
          setLinks(data || []);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || "Failed to load upload links");
          setLinks([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const handleCopy = (linkId) => {
    const url = `${window.location.origin}/upload/${linkId}`;
    navigator.clipboard.writeText(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Upload Links</h1>
        <p className="text-zinc-400">
          See the upload links created for your account.
        </p>
      </div>

      <div className="border border-zinc-700 rounded-lg overflow-hidden bg-zinc-950">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 border-b border-zinc-700">
            <tr>
              <th className="px-4 py-2 text-left text-zinc-300">#</th>
              <th className="px-4 py-2 text-left text-zinc-300">Upload Link Id</th>
              <th className="px-4 py-2 text-left text-zinc-300">Files</th>
              <th className="px-4 py-2 text-left text-zinc-300">Space</th>
              <th className="px-4 py-2 text-left text-zinc-300">Remaining Files</th>
              <th className="px-4 py-2 text-left text-zinc-300">Expires At</th>
              <th className="px-4 py-2 text-left text-zinc-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-4 text-center text-zinc-400">
                  Loading...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} className="px-4 py-4 text-center text-red-400">
                  {error}
                </td>
              </tr>
            ) : links.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-4 text-center text-zinc-400">
                  No upload links created yet.
                </td>
              </tr>
            ) : (
              links.map((link, idx) => {
                const remaining = Math.max(0, (link.maxUploads || 0) - (link.currentUploads || 0));
                return (
                  <tr key={link.id} className="border-t border-zinc-800">
                    <td className="px-4 py-2 text-zinc-300">{idx + 1}</td>
                    <td className="px-4 py-2">
                      <span className="text-indigo-400">{link.id}</span>
                    </td>
                    <td className="px-4 py-2 text-amber-300 font-medium">{link.filesCount ?? 0}</td>
                    <td className="px-4 py-2 text-rose-400 font-medium">{formatSize(link.occupiedBytes ?? 0)}</td>
                    <td className="px-4 py-2 text-zinc-300">{remaining}</td>
                    <td className="px-4 py-2 text-zinc-300">
                      {link.expiresAt ? new Date(link.expiresAt).toLocaleString() : "--"}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleCopy(link.id)}
                        className="bg-emerald-700 hover:bg-emerald-600 text-xs font-medium px-3 py-1 rounded text-zinc-100 mr-2"
                      >
                        Copy Link
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
