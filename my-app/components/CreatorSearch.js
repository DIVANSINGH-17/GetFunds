"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { searchCreators } from "@/actions/useractions";

const CreatorSearch = () => {
  const router = useRouter();
  const listboxId = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      setResults([]);
      setLoading(false);
      return undefined;
    }

    let active = true;
    setLoading(true);

    const timer = window.setTimeout(async () => {
      try {
        const suggestions = await searchCreators(trimmedQuery);

        if (active) {
          setResults(suggestions);
          setOpen(true);
        }
      } catch {
        if (active) {
          setResults([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query]);

  const visitCreator = (username) => {
    setOpen(false);
    setQuery("");
    router.push(`/${username}`);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (results[0]) {
      visitCreator(results[0].username);
    }
  };

  return (
    <div className="relative mx-2 w-full max-w-xl">
      <form onSubmit={handleSubmit} role="search">
        <label className="sr-only" htmlFor="creator-search">
          Search creators
        </label>
        <div className="relative">
          <input
            id="creator-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => query.trim().length >= 2 && setOpen(true)}
            onBlur={() => window.setTimeout(() => setOpen(false), 150)}
            placeholder="Search creators..."
            autoComplete="off"
            role="combobox"
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-expanded={open}
            aria-haspopup="listbox"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2 pl-4 pr-10 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            {loading ? "…" : "⌕"}
          </span>
        </div>
      </form>

      {open && query.trim().length >= 2 && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-12 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl"
        >
          {loading && results.length === 0 ? (
            <p className="p-4 text-sm text-slate-400">Finding similar creators...</p>
          ) : results.length === 0 ? (
            <p className="p-4 text-sm text-slate-400">
              No creator names match “{query.trim()}”.
            </p>
          ) : (
            <ul>
              {results.map((creator) => (
                <li key={creator.id} role="option" aria-selected="false">
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => visitCreator(creator.username)}
                    className="flex w-full items-center gap-3 border-b border-slate-800 px-4 py-3 text-left last:border-0 hover:bg-slate-800"
                  >
                    <Image
                      src={creator.profilepic || "/avatar.gif"}
                      alt=""
                      width={38}
                      height={38}
                      unoptimized
                      className="size-10 rounded-full object-cover"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">
                        {creator.name}
                      </span>
                      <span className="block truncate text-xs text-slate-400">
                        @{creator.username}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default CreatorSearch;
