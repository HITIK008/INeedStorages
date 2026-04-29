import { Link } from "react-router-dom";

export default function Pricing() {
  const plans = [
    {
      name: "50 GB",
      price: "$0.99",
      inrPrice: "₹79",
      period: "/month",
      features: [
        "50 GB Total Storage",
        "Permanent Storage (No expiry)",
        "Priority upload/download speeds",
      ],
      buttonText: "Subscribe",
    },
    {
      name: "100 GB",
      price: "$1.99",
      inrPrice: "₹149",
      period: "/month",
      features: [
        "100 GB Total Storage",
        "Permanent Storage (No expiry)",
        "Priority upload/download speeds",
      ],
      buttonText: "Subscribe",
    },
    {
      name: "500 GB",
      price: "$7.99",
      inrPrice: "₹599",
      period: "/month",
      features: [
        "500 GB Total Storage",
        "Permanent Storage (No expiry)",
        "Priority upload/download speeds",
      ],
      buttonText: "Subscribe",
      highlighted: true,
    },
    {
      name: "1 TB",
      price: "$14.99",
      inrPrice: "₹1,199",
      period: "/month",
      features: [
        "1,024 GB Total Storage",
        "Permanent Storage (No expiry)",
        "Highest priority speeds",
      ],
      buttonText: "Subscribe",
    },
    {
      name: "5 TB",
      price: "$69.99",
      inrPrice: "₹5,499",
      period: "/month",
      features: [
        "5,120 GB Total Storage",
        "Permanent Storage (No expiry)",
        "Highest priority speeds",
      ],
      buttonText: "Subscribe",
    },
    {
      name: "10 TB",
      price: "$129.99",
      inrPrice: "₹9,999",
      period: "/month",
      features: [
        "10,240 GB Total Storage",
        "Permanent Storage (No expiry)",
        "Highest priority speeds",
      ],
      buttonText: "Subscribe",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl font-extrabold text-white sm:text-5xl tracking-tight mb-4">
          Choose your storage plan
        </h1>
        <p className="text-xl text-zinc-400">
          Simple, scalable pricing. Start with a free 500MB account, or upgrade to permanent storage tiers when you need more space.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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

            <div className="mb-6 border-b border-zinc-800 pb-4">
              <h2 className="text-2xl font-bold text-white mb-2">{plan.name}</h2>
              <div className="flex items-baseline text-4xl font-extrabold text-emerald-400">
                {plan.price}
                <span className="text-xl text-zinc-400 font-medium ml-1">{plan.period}</span>
              </div>
              <div className="text-sm text-zinc-500 mt-1">or {plan.inrPrice}{plan.period}</div>
            </div>

            <ul className="flex-1 space-y-4 mb-8">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start">
                  <svg
                    className={`h-5 w-5 shrink-0 ${plan.highlighted ? "text-indigo-400" : "text-zinc-500"}`}
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

            <Link
              to="/contact"
              className={`block text-center w-full py-3 px-4 rounded-xl font-semibold transition-all ${
                plan.highlighted
                  ? "bg-indigo-600 text-white hover:bg-indigo-500"
                  : "bg-zinc-800 text-white hover:bg-zinc-700"
              }`}
            >
              {plan.buttonText}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
