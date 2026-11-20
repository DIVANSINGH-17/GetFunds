const architecture = [
  {
    title: "Authentication",
    detail: "GitHub OAuth through NextAuth provisions a local MongoDB creator and enriches the session with an immutable ID and public username.",
  },
  {
    title: "Authorization",
    detail: "Dashboard rendering and profile mutations verify the server session instead of trusting a browser-provided email or username.",
  },
  {
    title: "Verified test-payment lifecycle",
    detail: "The server creates a Razorpay test order, Checkout returns payment identifiers, and a server-only HMAC check verifies the signature before analytics include it.",
  },
  {
    title: "Analytics",
    detail: "MongoDB aggregation calculates total funding, contribution count, unique supporter names, and average contribution independently of the top-ten query.",
  },
  {
    title: "Creator discovery",
    detail: "A debounced global search ranks username and display-name prefixes before similar substring matches, then links to server-rendered public profiles.",
  },
  {
    title: "Project storage",
    detail: "Authenticated creators publish project folders whose metadata uses Mongoose and whose validated file bytes use MongoDB GridFS with public safe-download routes.",
  },
];

export default function About() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-14">
      <header className="max-w-3xl">
        <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-200">
          Technical portfolio project
        </span>
        <h1 className="mt-5 text-4xl font-bold">How GetFunds Demo works</h1>
        <p className="mt-4 text-lg leading-8 text-slate-300">
          GetFunds demonstrates the architecture of a creator crowdfunding product without moving real money. It combines identity, protected mutations, Razorpay Test Checkout, public portfolios, discovery, and aggregate analytics.
        </p>
      </header>

      <section className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {architecture.map((item) => (
          <article
            key={item.title}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
          >
            <h2 className="text-xl font-bold">{item.title}</h2>
            <p className="mt-3 leading-7 text-slate-400">{item.detail}</p>
          </article>
        ))}
      </section>

      <section className="mt-12 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-7">
        <h2 className="text-2xl font-bold">Why Razorpay Test Mode?</h2>
        <p className="mt-3 max-w-4xl leading-7 text-blue-100/80">
          Test Mode displays Razorpay&apos;s real Checkout experience and mock bank success/failure screens, but test keys cannot move money. The project still follows the important production pattern: create the order on the server, keep the secret server-only, verify the returned signature, confirm the remote amount and status, and make completion idempotent.
        </p>
      </section>
    </main>
  );
}

export const metadata = {
  title: "Architecture",
  description: "Understand the authentication, authorization, data, and analytics architecture behind GetFunds Demo.",
};
