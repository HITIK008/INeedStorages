export default function HelpWebhooks() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 text-sm">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Webhook Notifications</h1>
        <p className="text-zinc-400">
          Get notified when important file events happen in your INeedStorage account.
        </p>
      </div>

      <div className="border border-zinc-800 bg-zinc-950/80 rounded-xl p-8 space-y-6 text-zinc-200 shadow-sm">
        <section>
          <h2 className="text-xl font-semibold mb-2">Setup</h2>
          <ol className="list-decimal pl-6 space-y-1 text-zinc-300">
            <li>Open the developer settings page.</li>
            <li>Add your webhook URL (HTTPS only).</li>
            <li>Choose events you want to receive.</li>
            <li>Save and test delivery.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Headers</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border border-zinc-700">
              <thead className="bg-zinc-900">
                <tr>
                  <th className="border border-zinc-700 px-3 py-2">Header</th>
                  <th className="border border-zinc-700 px-3 py-2">Description</th>
                  <th className="border border-zinc-700 px-3 py-2">Example</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-zinc-700 px-3 py-2 font-mono">X-INeedStorage-Signature</td>
                  <td className="border border-zinc-700 px-3 py-2">HMAC SHA-256 signature</td>
                  <td className="border border-zinc-700 px-3 py-2">sha256=abc123...</td>
                </tr>
                <tr>
                  <td className="border border-zinc-700 px-3 py-2 font-mono">X-INeedStorage-Event</td>
                  <td className="border border-zinc-700 px-3 py-2">Event type</td>
                  <td className="border border-zinc-700 px-3 py-2">FILE_EXPIRE</td>
                </tr>
                <tr>
                  <td className="border border-zinc-700 px-3 py-2 font-mono">User-Agent</td>
                  <td className="border border-zinc-700 px-3 py-2">Webhook client identifier</td>
                  <td className="border border-zinc-700 px-3 py-2">INeedStorage-Webhook/1.0</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Payload Example</h2>
          <pre className="bg-zinc-900 border border-zinc-700 rounded p-4 overflow-x-auto text-xs text-zinc-300">
{`{
  "event_type": "FILE_EXPIRE",
  "timestamp": "2026-04-13T12:30:00.000Z",
  "data": {
    "file_id": "abc123",
    "name": "report.pdf",
    "size": 2457600,
    "expires_at": "2026-04-20T12:30:00.000Z"
  }
}`}
          </pre>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Verify Requests</h2>
          <pre className="bg-zinc-900 border border-zinc-700 rounded p-4 overflow-x-auto text-xs text-zinc-300">
{`// pseudo code
signature = req.headers["x-ineedstorage-signature"]
expected  = hmac_sha256(secret, rawBody)

if signature == expected:
  // valid request`}
          </pre>
        </section>
      </div>
    </div>
  );
}

