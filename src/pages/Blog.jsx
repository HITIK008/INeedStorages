export default function Blog() {
  const posts = [
    {
      title: "Exploit GitHub as infinite storage",
      date: "December 19, 2024 · 20 min read",
      summary: "How to use Git hosting as your personal storage layer while staying within reasonable limits.",
    },
    {
      title: "The Real Cost of Storage: A Fresh Start",
      date: "December 2, 2024 · 3 min read",
      summary: "Why reliable storage is expensive, why files now expire, and how we keep prices sustainable.",
    },
    {
      title: "When Privacy Meets Reality: Dealing with Bad Actors",
      date: "December 2, 2024 · 5 min read",
      summary: "Balancing strong privacy guarantees with abuse prevention when running a public file host.",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 text-sm">
      <div>
        <h1 className="text-2xl font-semibold mb-2">INeedStorage blog</h1>
        <p className="text-zinc-400">
          Thoughts on storage, performance, and digital privacy.
        </p>
      </div>

      <div className="border-t border-zinc-700 pt-4 space-y-6">
        {posts.map((post, idx) => (
          <article key={idx} className="space-y-1">
            <h2 className="text-lg font-semibold text-indigo-300 hover:text-indigo-200 cursor-pointer">
              {post.title}
            </h2>
            <p className="text-xs text-zinc-500">{post.date}</p>
            <p className="text-zinc-300">{post.summary}</p>
            <button className="mt-1 text-xs text-indigo-400 hover:text-indigo-300">
              Read more →
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
