"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import CreatorSearch from "@/components/CreatorSearch";

const Navbar = () => {
  const { data: session, status } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);
  const username = session?.user?.username;

  return (
    <nav className="relative z-50 flex min-h-16 items-center gap-2 border-b border-slate-800 bg-slate-950/95 px-3 text-white shadow-xl backdrop-blur md:gap-4 md:px-4">
      <Link
        className="flex shrink-0 items-center gap-2 font-bold"
        href="/"
        aria-label="GetFunds home"
      >
        <Image
          src="/tea.gif"
          width={42}
          height={42}
          alt=""
          unoptimized
        />
        <span className="hidden sm:inline">GetFunds Demo</span>
      </Link>

      <CreatorSearch />

      <Link
        href="/explore"
        className="hidden shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white md:inline-block"
      >
        Explore
      </Link>

      <div className="relative shrink-0">
        {status === "loading" && (
          <span className="text-sm text-slate-400">Loading session...</span>
        )}

        {status === "unauthenticated" && (
          <Link
            href="/login"
            className="rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-2.5 text-sm font-semibold hover:from-purple-500 hover:to-blue-500"
          >
            Creator login
          </Link>
        )}

        {status === "authenticated" && (
          <>
            <button
              type="button"
              aria-expanded={showDropdown}
              aria-controls="account-menu"
              onClick={() => setShowDropdown((visible) => !visible)}
              onBlur={() => {
                window.setTimeout(() => setShowDropdown(false), 150);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold hover:bg-blue-600"
            >
              Account
              <svg
                aria-hidden="true"
                className="size-3"
                viewBox="0 0 10 6"
                fill="none"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m1 1 4 4 4-4"
                />
              </svg>
            </button>

            <div
              id="account-menu"
              className={`absolute right-0 top-12 w-48 overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-2xl ${
                showDropdown ? "" : "hidden"
              }`}
            >
              <Link
                href="/dashboard"
                className="block px-4 py-3 text-sm hover:bg-slate-800"
              >
                Creator analytics
              </Link>
              <Link
                href="/explore"
                className="block px-4 py-3 text-sm hover:bg-slate-800 md:hidden"
              >
                Explore creators
              </Link>
              {username && (
                <Link
                  href={`/${username}`}
                  className="block px-4 py-3 text-sm hover:bg-slate-800"
                >
                  Public page
                </Link>
              )}
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="block w-full border-t border-slate-800 px-4 py-3 text-left text-sm text-red-200 hover:bg-slate-800"
              >
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
