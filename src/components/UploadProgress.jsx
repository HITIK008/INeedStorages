
export default function UploadProgress({ progress }) {
    return (
      <div className="mt-3">
        <div className="h-2 bg-zinc-800 rounded">
          <div
            className="h-2 bg-indigo-600 rounded"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-zinc-400 mt-1">{progress}%</p>
      </div>
    );
  }
  