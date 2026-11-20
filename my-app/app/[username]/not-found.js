import Link from "next/link";

export default function CreatorNotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <p className="text-6xl">🔍</p>
      <h1 className="mt-4 text-3xl font-bold">Creator not found</h1>
      <p className="mt-3 text-slate-400">
        This creator page doesn&apos;t exist, or the creator changed their username.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/explore"
          className="rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-2.5 font-semibold hover:from-purple-500 hover:to-blue-500"
        >
          Explore creators
        </Link>
        <Link
          href="/"
          className="rounded-lg border border-slate-600 px-5 py-2.5 font-semibold hover:bg-slate-800"
        >
          Home
        </Link>
      </div>
    </main>
  );
}
