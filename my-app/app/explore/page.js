import Link from "next/link";
import CreatorCard from "@/components/CreatorCard";
import { getExploreData } from "@/actions/useractions";

// Rebuild the leaderboard at most once a minute; contribution verification
// and profile updates don't need to invalidate it immediately.
export const revalidate = 60;

export const metadata = {
  title: "Explore creators",
  description: "Discover GetFunds demo creators ranked by verified test funding.",
};

const CreatorGrid = ({ creators, ranked }) => (
  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {creators.map((creator, index) => (
      <CreatorCard
        key={creator.id}
        creator={creator}
        rank={ranked ? index + 1 : undefined}
      />
    ))}
  </div>
);

export default async function ExplorePage() {
  let data;

  try {
    data = await getExploreData();
  } catch {
    data = null;
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-14">
      <header className="max-w-3xl">
        <h1 className="text-4xl font-bold">Explore creators</h1>
        <p className="mt-3 text-lg text-slate-300">
          Leaderboards are built with a MongoDB aggregation over verified test contributions.
        </p>
      </header>

      {!data ? (
        <p className="mt-10 rounded-xl border border-red-500/40 bg-red-500/10 p-6 text-red-200">
          Creators could not be loaded right now. Please try again shortly.
        </p>
      ) : (
        <>
          <section className="mt-12">
            <h2 className="text-2xl font-bold">Top funded</h2>
            {data.topCreators.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
                No verified contributions yet. Visit a creator and be the first supporter.
              </p>
            ) : (
              <CreatorGrid creators={data.topCreators} ranked />
            )}
          </section>

          <section className="mt-14">
            <h2 className="text-2xl font-bold">Newest creators</h2>
            {data.newestCreators.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
                No creators yet.{" "}
                <Link href="/login" className="text-blue-300 underline">
                  Create the first page
                </Link>
                .
              </p>
            ) : (
              <CreatorGrid creators={data.newestCreators} />
            )}
          </section>
        </>
      )}
    </main>
  );
}
