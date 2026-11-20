"use client";

import { useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const Login = () => {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [router, status]);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg items-center px-6 py-16">
      <section className="w-full rounded-2xl border border-slate-800 bg-slate-900/95 p-8 text-center shadow-2xl">
        <span className="inline-flex rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-200">
          Portfolio demo
        </span>
        <h1 className="mt-5 text-3xl font-bold">Creator sign in</h1>
        <p className="mt-3 text-slate-400">
          GitHub verifies your identity. GetFunds stores your creator profile, public project folders, and verified test contribution data.
        </p>

        <button
          type="button"
          onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
          disabled={status === "loading"}
          className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-lg bg-white px-5 py-3 font-semibold text-slate-950 hover:bg-slate-200 disabled:cursor-wait disabled:opacity-60"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-6 fill-current"
          >
            <path d="M12 .7a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2.23c-3.22.7-3.9-1.37-3.9-1.37-.52-1.34-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.57-.29-5.27-1.28-5.27-5.68 0-1.26.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.16 1.18a10.96 10.96 0 0 1 5.76 0c2.2-1.49 3.16-1.18 3.16-1.18.63 1.58.23 2.75.11 3.04.74.8 1.19 1.82 1.19 3.08 0 4.42-2.71 5.38-5.29 5.67.42.36.79 1.07.79 2.16v3.22c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z" />
          </svg>
          {status === "loading" ? "Checking session..." : "Continue with GitHub"}
        </button>

        <div className="mt-6 rounded-lg border border-blue-400/20 bg-blue-400/10 p-4 text-left text-sm text-blue-100">
          <p className="font-semibold">What this interview demo proves</p>
          <p className="mt-1 text-blue-200/80">
            OAuth authentication, protected mutations, Razorpay test-signature verification, creator search, GridFS uploads, and MongoDB aggregation.
          </p>
        </div>
      </section>
    </main>
  );
};

export default Login;
