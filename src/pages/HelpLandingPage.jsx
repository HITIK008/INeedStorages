export default function HelpLandingPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 text-sm">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Custom Landing Page Guide</h1>
        <p className="text-zinc-400">
          Personalize file download pages with your own HTML template.
        </p>
      </div>

      <div className="border border-zinc-800 bg-zinc-950/80 rounded-xl p-8 space-y-6 text-zinc-200 shadow-sm">
        <section>
          <h2 className="text-xl font-semibold mb-2">Overview</h2>
          <p className="text-zinc-300">
            Custom landing pages let you control how public download links are shown.
            Upload an HTML template and INeedStorage replaces variables with real file metadata.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Technical Requirements</h2>
          <ul className="list-disc pl-6 space-y-1 text-zinc-300">
            <li>File must be HTML format</li>
            <li>Maximum size: 100KB</li>
            <li>Inline JavaScript is removed for security</li>
            <li>External resources may be blocked by policy</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Available Variables</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border border-zinc-700">
              <thead className="bg-zinc-900">
                <tr>
                  <th className="border border-zinc-700 px-3 py-2">Variable</th>
                  <th className="border border-zinc-700 px-3 py-2">Description</th>
                  <th className="border border-zinc-700 px-3 py-2">Example</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-zinc-700 px-3 py-2 font-mono">{"{{FileName}}"}</td>
                  <td className="border border-zinc-700 px-3 py-2">File name</td>
                  <td className="border border-zinc-700 px-3 py-2">report.pdf</td>
                </tr>
                <tr>
                  <td className="border border-zinc-700 px-3 py-2 font-mono">{"{{DownloadLink}}"}</td>
                  <td className="border border-zinc-700 px-3 py-2">Direct file URL</td>
                  <td className="border border-zinc-700 px-3 py-2">https://.../download/abc</td>
                </tr>
                <tr>
                  <td className="border border-zinc-700 px-3 py-2 font-mono">{"{{Size}}"}</td>
                  <td className="border border-zinc-700 px-3 py-2">File size</td>
                  <td className="border border-zinc-700 px-3 py-2">24.5 MB</td>
                </tr>
                <tr>
                  <td className="border border-zinc-700 px-3 py-2 font-mono">{"{{Downloads}}"}</td>
                  <td className="border border-zinc-700 px-3 py-2">Download count</td>
                  <td className="border border-zinc-700 px-3 py-2">57</td>
                </tr>
                <tr>
                  <td className="border border-zinc-700 px-3 py-2 font-mono">{"{{SHA1}}"}</td>
                  <td className="border border-zinc-700 px-3 py-2">File hash</td>
                  <td className="border border-zinc-700 px-3 py-2">ab34...fd10</td>
                </tr>
                <tr>
                  <td className="border border-zinc-700 px-3 py-2 font-mono">{"{{Note}}"}</td>
                  <td className="border border-zinc-700 px-3 py-2">Uploader note</td>
                  <td className="border border-zinc-700 px-3 py-2">Password: 1234</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Example Template</h2>
          <pre className="bg-zinc-900 border border-zinc-700 rounded p-4 overflow-x-auto text-xs text-zinc-300">
{`<!doctype html>
<html>
  <head><title>{{FileName}}</title></head>
  <body>
    <h1>{{FileName}}</h1>
    <p>Size: {{Size}}</p>
    <p>Downloads: {{Downloads}}</p>
    <p>{{Note}}</p>
    <a href="{{DownloadLink}}">Download</a>
  </body>
</html>`}
          </pre>
        </section>
      </div>
    </div>
  );
}

