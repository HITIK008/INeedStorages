import { formatSize } from "../utils/formatSize";
import { formatDate, getTimeRemaining } from "../utils/formatDate";
// import { formatDate, getTimeRemaining } from "../utils/formatDate";


export default function FileTable({ files, onDelete }) {
  if (files.length === 0) {
    return (
      <p className="text-zinc-400 text-sm">
        No files uploaded yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto border border-zinc-800 rounded-lg">
      <table className="w-full text-sm">
        <thead className="bg-zinc-900 border-b border-zinc-800">
          <tr className="text-left text-zinc-400">
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Size</th>
            <th className="px-4 py-3">Uploaded</th>
            <th className="px-4 py-3">Expires</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>

        <tbody>
          {files.map((file) => (
            <tr
              key={file.id}
              className="border-b border-zinc-800 hover:bg-zinc-900"
            >
              <td className="px-4 py-3">{file.name}</td>
              <td className="px-4 py-3">{formatSize(file.size)}</td>
              <td className="px-4 py-3">
                {formatDate(file.uploadedAt)}
              </td>
              <td className="px-4 py-3">
  <div className="flex flex-col">
    <span>{formatDate(file.expiresAt)}</span>
    <span
      className={`text-xs ${
        getTimeRemaining(file.expiresAt) === "Expired"
          ? "text-red-400"
          : "text-zinc-400"
      }`}
    >
      {getTimeRemaining(file.expiresAt)}
    </span>
  </div>
</td>

              <td className="px-4 py-3">
                <button
                  onClick={() => onDelete(file.id)}
                  className="text-red-400 hover:text-red-300 text-xs"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
