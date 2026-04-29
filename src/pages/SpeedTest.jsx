import { useMemo, useState } from 'react';

export default function SpeedTest() {
  const [duration, setDuration] = useState(15);
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState(null);

  const rawApi = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  const apiBase = rawApi.endsWith('/api') ? rawApi.slice(0, -4) : rawApi.replace(/\/$/, '');

  const connection = useMemo(() => {
    const net = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!net) return null;
    return {
      type: net.effectiveType || 'unknown',
      downlink: net.downlink || null, // Mbps estimate from system/browser
      rtt: net.rtt || null,
    };
  }, []);

  const startSpeedTest = async () => {
    setTesting(true);
    setResults(null);
    try {
      await testDownloadSpeed();
    } catch (error) {
      console.error('Speed test error:', error);
      setResults({
        error: `Speed test failed: ${error.message || 'Unknown error'}`,
      });
    } finally {
      setTesting(false);
    }
  };

  const testDownloadSpeed = async () => {
    const startTime = performance.now();
    let totalBytes = 0;
    const sizeMbByDuration = { 15: 25, 30: 50, 45: 75 };
    const sizeMb = sizeMbByDuration[duration] || 25;

    const response = await fetch(`${apiBase}/api/speedtest/download?mb=${sizeMb}`, {
      method: 'GET',
      headers: {
        'x-user-id': localStorage.getItem('userId') || 'speedtest-user',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    if (!response.body) {
      throw new Error('Streaming response not available');
    }

    const reader = response.body.getReader();
    while (true) {
      const elapsedSeconds = (performance.now() - startTime) / 1000;
      if (elapsedSeconds >= duration) {
        try {
          await reader.cancel();
        } catch {
          // ignore cancel errors
        }
        break;
      }
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.length;
    }

    const elapsedSeconds = Math.max((performance.now() - startTime) / 1000, 0.1);
    const mbps = (totalBytes * 8) / (elapsedSeconds * 1_000_000);
    const mbsPerSecond = totalBytes / (1024 * 1024 * elapsedSeconds);

    setResults({
      downloadedMB: (totalBytes / (1024 * 1024)).toFixed(2),
      speedMBs: mbsPerSecond.toFixed(2),
      speedMbps: mbps.toFixed(2),
      duration: elapsedSeconds.toFixed(1),
      requestedMB: sizeMb,
      networkType: connection?.type || 'unknown',
      estimatedSystemMbps: connection?.downlink ? connection.downlink.toFixed(2) : null,
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-semibold mb-2">Speed Test</h1>
        <p className="text-zinc-400 mb-8">Download speed test based on real transfer from server.</p>

        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 mb-8">
          <p className="text-zinc-300 font-medium mb-4">Select duration:</p>
          <div className="flex gap-4 flex-wrap">
            {[15, 30, 45].map((sec) => (
              <label key={sec} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="duration"
                  value={sec}
                  checked={duration === sec}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  disabled={testing}
                  className="accent-indigo-600"
                />
                <span className="text-zinc-300">{sec} seconds</span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={startSpeedTest}
          disabled={testing}
          className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition ${
            testing
              ? 'bg-zinc-600 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
          }`}
        >
          {testing ? `Testing... (${duration}s)` : 'Start Download Speed Test'}
        </button>

        {results && !testing && (
          <div className="mt-8 bg-zinc-900 border border-zinc-700 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Test Results</h2>

            {results.error ? (
              <p className="text-red-500">{results.error}</p>
            ) : (
              <div className="space-y-3 text-zinc-100">
                <p className="text-2xl font-semibold">
                  Downloaded: {results.downloadedMB} MB
                </p>
                <p className="text-xl">
                  Average download speed: {results.speedMBs} MB/s | {results.speedMbps} mbps
                </p>
                <p className="text-sm text-zinc-400">
                  Test duration: {results.duration}s • Payload: {results.requestedMB} MB • Network: {results.networkType}
                </p>
                {results.estimatedSystemMbps && (
                  <p className="text-sm text-zinc-400">
                    System/browser estimated link speed: {results.estimatedSystemMbps} mbps
                  </p>
                )}
                <p className="text-xs text-zinc-500">
                  For realistic Wi-Fi/mobile internet speed, test against a deployed server (not localhost).
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
