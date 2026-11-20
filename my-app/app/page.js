import Link from "next/link";
import Image from "next/image";

const features = [
  {
    image: "/man.gif",
    title: "GitHub creator identity",
    description: "NextAuth OAuth provisions a local creator profile without storing passwords.",
  },
  {
    image: "/coin.gif",
    title: "Razorpay Test Checkout",
    description: "Create test orders, display the official mock checkout, and verify HMAC signatures without moving real money.",
  },
  {
    image: "/group.gif",
    title: "Discovery and portfolios",
    description: "Search creators, visit payable public profiles, and inspect project folders stored with MongoDB GridFS.",
  },
];

export default function Home() {
  return (
    <main>
      <section className="mx-auto flex min-h-[58vh] max-w-5xl flex-col items-center justify-center px-6 py-20 text-center">
        <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-200">
          Portfolio project · no real payments
        </span>
        <div className="mt-6 flex items-center justify-center gap-2">
          <h1 className="text-5xl font-bold md:text-7xl">GetFunds</h1>
          <Image
            width={76}
            height={76}
            src="/tea.gif"
            alt=""
            unoptimized
          />
        </div>
        <p className="mt-6 max-w-2xl text-lg text-slate-300">
          A full-stack crowdfunding demonstration with GitHub OAuth, Razorpay Test Checkout, creator discovery, GridFS portfolios, and aggregate analytics.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login"
            className="rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 font-semibold hover:from-purple-500 hover:to-blue-500"
          >
            Create a demo page
          </Link>
          <Link
            href="/explore"
            className="rounded-lg border border-blue-500/60 px-6 py-3 font-semibold text-blue-100 hover:bg-blue-500/10"
          >
            Explore creators
          </Link>
          <Link
            href="/about"
            className="rounded-lg border border-slate-600 px-6 py-3 font-semibold hover:bg-slate-800"
          >
            Explore the architecture
          </Link>
        </div>
      </section>

      <section className="border-y border-slate-800 bg-slate-950/70 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Features designed for technical discussion</h2>
            <p className="mt-2 text-slate-400">
              Every feature maps to a concrete backend or frontend engineering decision.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
              >
                <Image
                  className="size-16 rounded-full bg-slate-700 p-2"
                  src={feature.image}
                  alt=""
                  width={64}
                  height={64}
                  unoptimized
                />
                <h3 className="mt-5 text-xl font-bold">{feature.title}</h3>
                <p className="mt-2 text-slate-400">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-center text-3xl font-bold">End-to-end flow</h2>
        <div className="mt-8 grid gap-3 text-center text-sm md:grid-cols-6">
          {[
            "GitHub OAuth",
            "Protected dashboard",
            "Dynamic creator page",
            "Razorpay test order",
            "Signature verification",
            "Live analytics refresh",
          ].map((step, index) => (
            <div
              key={step}
              className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4"
            >
              <span className="text-xs font-bold text-blue-300">STEP {index + 1}</span>
              <p className="mt-2 font-semibold">{step}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
