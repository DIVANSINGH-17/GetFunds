import Image from "next/image";
import Link from "next/link";
import { currency, fundingProgress } from "@/lib/format";

const CreatorCard = ({ creator, rank }) => {
  const progress = fundingProgress(creator.totalAmount, creator.fundingGoal);

  return (
    <Link
      href={`/${creator.username}`}
      className="group flex flex-col rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-blue-500/50 hover:bg-slate-900/70"
    >
      <div className="flex items-center gap-3">
        {rank && (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-purple-600 text-sm font-bold">
            {rank}
          </span>
        )}
        <Image
          src={creator.profilepic || "/avatar.gif"}
          alt=""
          width={48}
          height={48}
          unoptimized
          className="size-12 shrink-0 rounded-full bg-slate-800 object-cover"
        />
        <div className="min-w-0">
          <p className="truncate font-semibold group-hover:text-blue-200">
            {creator.name}
          </p>
          <p className="truncate text-sm text-slate-400">@{creator.username}</p>
        </div>
      </div>

      {creator.bio && (
        <p className="mt-3 line-clamp-2 text-sm text-slate-300">{creator.bio}</p>
      )}

      <div className="mt-auto pt-4">
        <div className="flex justify-between text-xs text-slate-400">
          <span>{currency.format(creator.totalAmount)} raised</span>
          <span>{progress}% of {currency.format(creator.fundingGoal)}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </Link>
  );
};

export default CreatorCard;
