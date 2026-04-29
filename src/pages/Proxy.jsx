export default function Proxy() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 text-sm">
      <div>
        <h1 className="text-2xl font-semibold mb-2">INeedStorage Proxy</h1>
        <p className="text-zinc-400">Access options if your ISP or network blocks the main domain.</p>
      </div>

      <div className="border border-zinc-800 bg-zinc-950/80 rounded-xl p-8 space-y-8 text-zinc-200 shadow-sm">
        <section>
          <h2 className="text-xl font-semibold mb-2">Mirror Domains</h2>
          <p className="text-zinc-300 mb-3">Information should stay accessible. So should your files.</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><a href="#" className="text-indigo-300 hover:text-indigo-200 underline">ineedstorage.app</a> (Active)</li>
            <li><a href="#" className="text-indigo-300 hover:text-indigo-200 underline">ineedstorage.site</a> (Active)</li>
            <li><a href="#" className="text-indigo-300 hover:text-indigo-200 underline">ineedstorage.link</a> (Active)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">DNS Solutions</h2>
          <p className="text-zinc-300 mb-3">
            If mirrors are blocked, switch DNS to one of these public providers:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Cloudflare:</strong> 1.1.1.1</li>
            <li><strong>Google:</strong> 8.8.8.8</li>
            <li><strong>Quad9:</strong> 9.9.9.9</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Additional Access Methods</h2>
          <ul className="list-disc pl-6 space-y-1 text-zinc-300">
            <li>Use a trusted VPN provider</li>
            <li>
              Try Tor Browser (
              <a
                href="https://www.torproject.org/"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-300 hover:text-indigo-200 underline"
              >
                torproject.org
              </a>
              )
            </li>
            <li>Use a web proxy gateway</li>
          </ul>
        </section>

        <section className="space-y-2">
          <p className="text-zinc-300">
            If your ISP is still blocking access, contact us at{" "}
            <a
              href="mailto:support.ineedstorage@gmail.com"
              className="text-indigo-300 hover:text-indigo-200 underline"
            >
              support.ineedstorage@gmail.com
            </a>.
          </p>
          <p className="italic text-zinc-400">
            Reliable access matters. We keep adding fallback routes when networks block availability.
          </p>
        </section>
      </div>
    </div>
  );
}
