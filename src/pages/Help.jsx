export default function Help() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 text-sm">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Help</h1>
        <p className="text-zinc-400">
          Everything you need to know about using INeedStorage.
        </p>
      </div>

      <div className="border border-zinc-800 bg-zinc-950/80 rounded-xl p-8 space-y-6 text-zinc-200 shadow-sm">
        <p className="text-zinc-300">
          This page covers common questions about account access, file storage,
          privacy, and service behavior.
        </p>

        <ul className="list-disc pl-6 space-y-4">
          <li>
            <p className="font-semibold">Lost Account ID?</p>
            <p className="text-zinc-300">
              We cannot recover lost account IDs. Save your 16-character ID in a
              safe place.
            </p>
          </li>
          <li>
            <p className="font-semibold">What makes INeedStorage different?</p>
            <p className="text-zinc-300">
              We focus on simple uploads, fast downloads, and practical anonymous
              account access.
            </p>
          </li>
          <li>
            <p className="font-semibold">Privacy?</p>
            <p className="text-zinc-300">
              We prioritize minimal collection and account-ID-based access. Your
              files are your responsibility.
            </p>
          </li>
          <li>
            <p className="font-semibold">File Size Limit?</p>
            <p className="text-zinc-300">
              Free plans currently support uploads up to 500MB per file.
            </p>
          </li>
          <li>
            <p className="font-semibold">Upload stuck at 99%?</p>
            <p className="text-zinc-300">
              If your upload seems to hang at 99%, it is still processing. Check your internet connectivity upload speeds depend entirely on your WiFi or mobile data connection. A faster connection means a faster upload!
            </p>
          </li>
          <li>
            <p className="font-semibold">Earn Extra Storage (Referrals)</p>
            <p className="text-zinc-300">
              Share your referral code from the Settings page! When a new user signs up using your code, both of you will receive 100MB of bonus storage space, up to a maximum of 1GB total bonus.
            </p>
          </li>
          <li>
            <p className="font-semibold">Bandwidth limits?</p>
            <p className="text-zinc-300">
              No strict per-file download cap today, but fair-use and abuse
              controls may apply.
            </p>
          </li>
          <li>
            <p className="font-semibold">File expiry (Free Accounts)</p>
            <p className="text-zinc-300">
              Files are temporary by default. Expiry behavior and retention depend
              on plan type and account storage limits.
            </p>
          </li>
          <li>
            <p className="font-semibold">DMCA / Takedowns?</p>
            <p className="text-zinc-300">
              Abuse reports are reviewed. You are responsible for uploaded content.
            </p>
          </li>
          <li>
            <p className="font-semibold">How is INeedStorage funded?</p>
            <p className="text-zinc-300">
              Through paid storage plans and minimal operating-cost support.
            </p>
          </li>
          <li>
            <p className="font-semibold">Why is the interface simple?</p>
            <p className="text-zinc-300">
              We invest most resources in upload reliability and file delivery
              speed, not heavy visual effects.
            </p>
          </li>
        </ul>

        <section className="pt-2">
          <h2 className="text-xl font-semibold mb-3">Technical Documentation</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>
              <a href="/help/webhooks" className="text-indigo-300 hover:text-indigo-200 underline">
                Webhook Notifications
              </a>
              <span className="text-zinc-300"> - Integrate event-based notifications for your workflows.</span>
            </li>
            <li>
              <a href="/help/landing-page" className="text-indigo-300 hover:text-indigo-200 underline">
                Custom Landing Pages
              </a>
              <span className="text-zinc-300"> - Build branded pages for shared file links.</span>
            </li>
          </ol>
        </section>
      </div>
    </div>
  );
}
