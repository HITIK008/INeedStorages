export default function Privacy() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 text-sm">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Privacy</h1>
        <p className="text-zinc-400">
          How INeedStorage handles your data and protects account privacy.
        </p>
      </div>

      <div className="border border-zinc-800 bg-zinc-950/80 rounded-xl p-8 space-y-5 text-zinc-200 shadow-sm">
        <section>
          <h2 className="text-2xl font-semibold mb-2">Data We Collect</h2>
          <p className="text-zinc-300">
            INeedStorage does not require personally identifiable information to
            register for the service. To avoid sharing personal information, you
            can use privacy-friendly browsing practices (for example VPN/Tor and
            basic OPSEC guidelines).
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">What We Don&apos;t Log</h2>
          <p className="text-zinc-300 mb-2">
            We avoid logging sensitive activity that can be directly tied to your
            numbered account:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-zinc-300">
            <li>No logging of traffic content</li>
            <li>No logging of DNS requests</li>
            <li>No long-term storage of raw IP addresses in account activity logs</li>
            <li>No logging of per-account user bandwidth for profiling</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">Your Privacy and Account IDs</h2>
          <p className="text-zinc-300">
            At INeedStorage, we prioritize account-ID-based access. During sign up,
            you receive a unique 16-character account ID instead of creating a
            username/password profile. This account ID is used to access and manage
            your files, upload links, and storage settings.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-2">Proof of Ownership</h2>
          <p className="text-zinc-300">
            Since INeedStorage does not require personal identity data, account
            ownership is proven by your 16-character account ID. Keep it safe.
            If it is lost, you may permanently lose access to that account.
          </p>
        </section>
      </div>
    </div>
  );
}
