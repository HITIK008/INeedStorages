export default function Pricing() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      inrPrice: "₹0",
      description: "For basic file sharing and temporary storage.",
      features: [
        "500 MB Total Storage",
        "Files expire after 7 days",
        "Standard upload/download speeds",
        "Ads on download links",
      ],
      buttonText: "Current Plan",
      highlighted: false,
    },
    {
      name: "Pro",
      price: "$1.99",
      inrPrice: "₹149",
      period: "/month",
      description: "Perfect for students and professionals sharing larger files.",
      features: [
        "50 GB Total Storage",
        "Files kept for 90 days",
        "Password protected files",
        "No ads on download links",
      ],
      buttonText: "Upgrade to Pro",
      highlighted: false,
    },
    {
      name: "Creator",
      price: "$5.99",
      inrPrice: "₹499",
      period: "/month",
      description: "Ideal for content creators who need permanent storage.",
      features: [
        "250 GB Total Storage",
        "Permanent Storage (No expiry)",
        "Priority upload/download speeds",
        "Custom branding on links",
      ],
      buttonText: "Upgrade to Creator",
      highlighted: true,
    },
    {
      name: "Max",
      price: "$14.99",
      inrPrice: "₹1,499",
      period: "/month",
      description: "For heavy users and small teams archiving large data.",
      features: [
        "1 TB (1,024 GB) Total Storage",
        "Permanent Storage (No expiry)",
        "Highest priority speeds",
        "Everything in Creator plan",
      ],
      buttonText: "Upgrade to Max",
      highlighted: false,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl font-extrabold text-white sm:text-5xl tracking-tight mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-xl text-zinc-400">
          Start for free, upgrade when you need permanent storage and premium features.
          No hidden fees or bandwidth charges.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative flex flex-col p-8 rounded-2xl border ${
              plan.highlighted
                ? "bg-indigo-900/20 border-indigo-500 shadow-xl shadow-indigo-500/10"
                : "bg-zinc-900/50 border-zinc-800"
            }`}
          >
            {plan.highlighted && (
              <div className="absolute -top-4 inset-x-0 flex justify-center">
                <span className="bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                  Most Popular
                </span>
              </div>
            )}

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-2">{plan.name}</h2>
              <p className="text-sm text-zinc-400 h-10">{plan.description}</p>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline text-4xl font-extrabold text-white">
                {plan.price}
                {plan.period && <span className="text-xl text-zinc-400 font-medium ml-1">{plan.period}</span>}
              </div>
              <div className="text-sm text-zinc-500 mt-1">or {plan.inrPrice}{plan.period}</div>
            </div>

            <ul className="flex-1 space-y-4 mb-8">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start">
                  <svg
                    className={`h-5 w-5 shrink-0 ${plan.highlighted ? "text-indigo-400" : "text-emerald-400"}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="ml-3 text-sm text-zinc-300">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              className={`w-full py-3 px-4 rounded-xl font-semibold transition-all ${
                plan.highlighted
                  ? "bg-indigo-600 text-white hover:bg-indigo-500"
                  : "bg-zinc-800 text-white hover:bg-zinc-700"
              }`}
            >
              {plan.buttonText}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center">
        <h2 className="text-lg font-semibold text-white mb-2">Non-profit organizations</h2>
        <p className="text-zinc-400">
          Qualifying non-profit sites and organizations get the Creator plan for free. <a href="/contact" className="text-indigo-400 hover:text-indigo-300">Contact us</a> to apply.
        </p>
      </div>
    </div>
  );
}
