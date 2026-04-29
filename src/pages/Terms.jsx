export default function Terms() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 text-sm">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Terms of Service</h1>
        <p className="text-zinc-400">
          By using INeedStorage, you agree to these terms and responsibilities.
        </p>
      </div>

      <div className="border border-zinc-800 bg-zinc-950/80 rounded-xl p-8 space-y-6 text-zinc-200 shadow-sm">
        <p className="text-zinc-300">
          By using INeedStorage (the "Service"), you agree to the following:
        </p>

        <section>
          <h2 className="text-xl font-semibold mb-2">1. Acceptable Use</h2>
          <p className="text-zinc-300">
            You are responsible for all content uploaded, downloaded, or shared
            through this Service. You agree not to use the platform for illegal,
            harmful, or abusive activity.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">2. Prohibited Content</h2>
          <p className="text-zinc-300 mb-2">
            The following categories are strictly prohibited:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-zinc-300">
            <li>
              <strong>Child Exploitation:</strong> Any media depicting abuse or
              inappropriate touching of minors.
            </li>
            <li>
              <strong>Terrorism:</strong> Content that promotes or glorifies
              terror-related acts.
            </li>
            <li>
              <strong>Extreme Gore:</strong> Graphic or shocking content
              depicting severe harm.
            </li>
            <li>
              <strong>Malware / Viruses:</strong> Software designed to damage or
              compromise systems.
            </li>
            <li>
              <strong>Doxing:</strong> Sharing private personal or organizational
              information with malicious intent.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">3. Content Removal</h2>
          <p className="text-zinc-300">
            We reserve the right to remove content that violates these terms or
            content we consider dangerous, illegal, or harmful to users.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">4. Disclaimer</h2>
          <p className="text-zinc-300">
            The Service is provided "as is" without warranties. We are not liable
            for any loss, damage, or interruption related to use of the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">5. Changes</h2>
          <p className="text-zinc-300">
            We may update these terms over time. Continued use of INeedStorage
            indicates acceptance of updated terms.
          </p>
        </section>
      </div>
    </div>
  );
}
