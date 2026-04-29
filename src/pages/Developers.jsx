import { useState } from "react";

function CopyableBlock({ text, children, className }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
      <pre className={className}>{children}</pre>
    </div>
  );
}

export default function Developers() {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 text-zinc-300">
      <h1 className="text-4xl font-extrabold text-white mb-2">Developers</h1>
      <p className="text-lg text-zinc-400 mb-10">Tools to interact with INeedStorages programmatically</p>

      {/* Quick Links */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-10">
        <h2 className="text-xl font-bold text-white mb-4">Quick Links</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-indigo-400">
          <a href="#authentication" className="hover:underline">Authentication</a>
          <a href="#curl-upload" className="hover:underline">File Upload (CURL)</a>
          <a href="#api-reference" className="hover:underline">API Reference</a>
          <a href="#directory-management" className="hover:underline">Directory Management</a>
        </div>
      </div>

      {/* Important Notes */}
      <div className="bg-zinc-950 border-l-4 border-indigo-500 p-6 mb-10">
        <h2 className="text-xl font-bold text-white mb-4">Important Notes</h2>
        <ul className="list-disc pl-5 space-y-2 text-sm">
          <li><strong className="text-white">User ID:</strong> 16-character alphanumeric identifier, no password required</li>
          <li><strong className="text-white">File Expiry:</strong> Free accounts: 7 days, Premium: 30 days</li>
          <li><strong className="text-white">Storage Limits:</strong> Free accounts: 500MB, Premium: Unlimited</li>
          <li><strong className="text-white">Authentication:</strong> Pass <code className="bg-zinc-800 px-1 rounded">x-user-id</code> header for all operations</li>
          <li><strong className="text-white">CORS:</strong> Cross-Origin Resource Sharing is enabled for all origins.</li>
          <li><strong className="text-white">Base URL:</strong> <code className="bg-zinc-800 px-1 rounded">https://ineedstorages.com</code></li>
        </ul>
      </div>

      {/* Authentication */}
      <section id="authentication" className="mb-10">
        <h2 className="text-2xl font-bold text-white mb-4 border-b border-zinc-800 pb-2">Authentication</h2>
        <p className="mb-4">All authenticated endpoints require the user ID to be passed in the request header.</p>
        <div className="bg-zinc-900 border border-zinc-800 rounded p-4 mb-4">
          <p className="text-sm font-semibold mb-2">Authorization Header:</p>
          <code className="text-indigo-300">x-user-id: YOUR_USER_ID</code>
        </div>
        <p className="text-sm text-zinc-400">Your user ID is a 16-character alphanumeric string stored in localStorage.</p>
      </section>

      {/* File Upload Using CURL */}
      <section id="curl-upload" className="mb-10">
        <h2 className="text-2xl font-bold text-white mb-4 border-b border-zinc-800 pb-2">File Upload Using CURL</h2>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">Upload a File</h3>
          <p className="text-sm mb-2">Upload a file to your account directory.</p>
          <CopyableBlock 
            text={`curl -X POST https://ineedstorages.com/api/upload \\
  -H "x-user-id: YOUR_USER_ID" \\
  -H "Content-Type: multipart/form-data" \\
  -F "file=@sample.mp4" \\
  -F "notes=My video file" \\
  -F "directoryId=DIRECTORY_ID"`}
            className="bg-zinc-900 border border-zinc-800 rounded p-4 overflow-x-auto text-sm text-green-400"
          >
            <code>
curl -X POST https://ineedstorages.com/api/upload \
  -H "x-user-id: YOUR_USER_ID" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@sample.mp4" \
  -F "notes=My video file" \
  -F "directoryId=DIRECTORY_ID"
            </code>
          </CopyableBlock>
        </div>
      </section>

      {/* API Reference */}
      <section id="api-reference" className="mb-10">
        <h2 className="text-2xl font-bold text-white mb-6 border-b border-zinc-800 pb-2">API Reference</h2>

        {/* File Upload Endpoint */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-emerald-600/20 text-emerald-400 px-2 py-1 rounded text-xs font-bold">POST</span>
            <code className="text-lg font-mono">/api/upload</code>
            <span className="ml-auto bg-amber-600/20 text-amber-400 px-2 py-1 rounded text-xs font-bold">AUTHENTICATED</span>
          </div>
          <p className="mb-4">Upload a file to your account</p>
          <div className="space-y-2 text-sm">
            <p><strong>Header:</strong> <code className="bg-zinc-800 px-1 rounded">x-user-id: YOUR_USER_ID</code></p>
            <p className="font-semibold mt-4">Form Data:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><code className="text-indigo-300">file</code>: (file) - required, max 500MB</li>
              <li><code className="text-indigo-300">notes</code>: (string) - optional, file description</li>
              <li><code className="text-indigo-300">directoryId</code>: (string) - optional, parent directory</li>
              <li><code className="text-indigo-300">location</code>: (string) - optional, storage location</li>
            </ul>
            <p className="font-semibold mt-4">Response:</p>
            <pre className="bg-zinc-950 p-3 rounded text-xs overflow-x-auto">
{`{
  "success": true,
  "files": [
    {
      "id": "uuid",
      "name": "sample.mp4",
      "size": 1024000,
      "type": "video/mp4",
      "uploadedAt": "2024-04-13T...",
      "expiresAt": "2024-05-13T...",
      "views": 0,
      "downloads": 0
    }
  ]
}`}
            </pre>
          </div>
        </div>

        {/* File Download Endpoint */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-emerald-600/20 text-emerald-400 px-2 py-1 rounded text-xs font-bold">GET</span>
            <code className="text-lg font-mono">/api/files/:id/download</code>
            <span className="ml-auto bg-blue-600/20 text-blue-400 px-2 py-1 rounded text-xs font-bold">PUBLIC</span>
          </div>
          <p className="mb-4">Download a file (increments download count)</p>
          <p className="text-sm"><strong>Param id:</strong> file ID - required</p>
          <p className="text-sm mt-2"><strong>Response:</strong> File binary content</p>
        </div>
      </section>

      {/* Directory Management */}
      <section id="directory-management" className="mb-10">
        <h2 className="text-2xl font-bold text-white mb-6 border-b border-zinc-800 pb-2">Directory Management</h2>
        
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded p-4 flex items-center justify-between">
            <div>
              <span className="bg-emerald-600/20 text-emerald-400 px-2 py-1 rounded text-xs font-bold mr-3">GET</span>
              <code className="font-mono">/api/directories</code>
            </div>
            <span className="bg-amber-600/20 text-amber-400 px-2 py-1 rounded text-xs font-bold">AUTHENTICATED</span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="bg-emerald-600/20 text-emerald-400 px-2 py-1 rounded text-xs font-bold mr-3">POST</span>
                <code className="font-mono">/api/directories</code>
              </div>
              <span className="bg-amber-600/20 text-amber-400 px-2 py-1 rounded text-xs font-bold">AUTHENTICATED</span>
            </div>
            <p className="text-sm mb-2">Create a new directory</p>
            <pre className="bg-zinc-950 p-3 rounded text-xs">
{`{
  "name": "string", // Directory name - required, max 255 chars
  "parentId": "string" // Parent directory ID - optional
}`}
            </pre>
          </div>
        </div>
      </section>

      {/* Example Flow */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-white mb-4 border-b border-zinc-800 pb-2">Example: Complete Upload Flow</h2>
        <CopyableBlock
          text={`# Step 1: Generate a unique user ID
curl -X GET https://ineedstorages.com/api/generate-id

# Step 2: Create user account using the generated ID
curl -X POST https://ineedstorages.com/api/signup \\
  -H "Content-Type: application/json" \\
  -d '{"userId":"YOUR_GENERATED_ID"}'

# Step 3: Upload file
curl -X POST https://ineedstorages.com/api/upload \\
  -H "x-user-id: YOUR_GENERATED_ID" \\
  -F "file=@myfile.mp4" \\
  -F "notes=My video"

# Step 4: Get file info
curl -X GET https://ineedstorages.com/api/files \\
  -H "x-user-id: YOUR_GENERATED_ID"

# Step 5: Check storage
curl -X GET https://ineedstorages.com/api/storage \\
  -H "x-user-id: YOUR_GENERATED_ID"`}
          className="bg-zinc-900 border border-zinc-800 rounded p-4 overflow-x-auto text-sm text-zinc-300"
        >
          <code>
<span className="text-zinc-500"># Step 1: Generate a unique user ID</span>
{"\n"}curl -X GET https://ineedstorages.com/api/generate-id
{"\n\n"}
<span className="text-zinc-500"># Step 2: Create user account using the generated ID</span>
{"\n"}curl -X POST https://ineedstorages.com/api/signup \
  -H "Content-Type: application/json" \
  -d '{"{"}"userId":"YOUR_GENERATED_ID"{"}"}'
{"\n\n"}
<span className="text-zinc-500"># Step 3: Upload file</span>
{"\n"}curl -X POST https://ineedstorages.com/api/upload \
  -H "x-user-id: YOUR_GENERATED_ID" \
  -F "file=@myfile.mp4" \
  -F "notes=My video"
{"\n\n"}
<span className="text-zinc-500"># Step 4: Get file info</span>
{"\n"}curl -X GET https://ineedstorages.com/api/files \
  -H "x-user-id: YOUR_GENERATED_ID"
{"\n\n"}
<span className="text-zinc-500"># Step 5: Check storage</span>
{"\n"}curl -X GET https://ineedstorages.com/api/storage \
  -H "x-user-id: YOUR_GENERATED_ID"
          </code>
        </CopyableBlock>
      </section>
    </div>
  );
}
