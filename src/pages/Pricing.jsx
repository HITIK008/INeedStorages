export default function Pricing() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 text-sm">
      <div>
        <h1 className="text-2xl font-semibold mb-2">File Storage Pricing</h1>
        <p className="text-zinc-400">
          Simple pricing with a generous free tier and straightforward paid plans.
        </p>
      </div>

      <div className="border border-zinc-700 bg-zinc-950 rounded-lg p-6 space-y-4">
        <h2 className="font-semibold text-zinc-100 mb-2">Free accounts:</h2>
        <ul className="list-disc pl-6 space-y-1 text-zinc-300">
          <li>500MB maximum storage limit.</li>
          <li>Uploaded files automatically expire and are deleted after 7 days.</li>
        </ul>

        <h2 className="font-semibold text-zinc-100 mt-4 mb-2">Premium accounts:</h2>
        <ul className="list-disc pl-6 space-y-1 text-zinc-300">
          <li>Unlimited storage capacity starting from $12.00 / 100 GB / Month.</li>
          <li>Uploaded files are retained for 30 days before expiration.</li>
        </ul>

        <h2 className="font-semibold text-zinc-100 mt-4 mb-2">Non‑profit organizations:</h2>
        <ul className="list-disc pl-6 space-y-1 text-zinc-300">
          <li>Free permanent storage for qualifying non‑profit sites and organizations.</li>
          <li>Contact us to apply for a non‑profit account.</li>
        </ul>
      </div>
    </div>
  );
}
