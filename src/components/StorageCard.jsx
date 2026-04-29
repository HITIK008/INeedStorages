export default function StorageCard({ title, value, subtitle, color }) {
    const colorMap = {
      indigo: "text-indigo-400",
      emerald: "text-emerald-400",
      rose: "text-rose-400",
    };
  
    return (
      <div className="border border-zinc-800 rounded-lg p-6 bg-zinc-900">
        <h3 className="text-sm text-zinc-400 mb-2">{title}</h3>
        <div className={`text-2xl font-semibold ${colorMap[color]}`}>
          {value}
        </div>
        <p className="text-sm text-zinc-500 mt-1">{subtitle}</p>
      </div>
    );
  }
  