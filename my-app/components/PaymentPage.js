"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getPublicCreatorData } from "@/actions/useractions";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ShareButton from "@/components/ShareButton";
import {
  currency,
  formatDate,
  formatFileSize,
  fundingProgress,
} from "@/lib/format";

const emptyForm = {
  name: "",
  message: "",
  amount: "",
};

const RAZORPAY_SCRIPT_ID = "razorpay-checkout-script";
let razorpayLoaderPromise;

const loadRazorpayCheckout = () => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay Checkout requires a browser."));
  }

  if (window.Razorpay) {
    return Promise.resolve();
  }

  if (razorpayLoaderPromise) {
    return razorpayLoaderPromise;
  }

  razorpayLoaderPromise = new Promise((resolve, reject) => {
    let script = document.getElementById(RAZORPAY_SCRIPT_ID);
    const shouldAppendScript = !script;
    let timeout;

    const cleanup = () => {
      window.clearTimeout(timeout);
      script?.removeEventListener("load", handleLoad);
      script?.removeEventListener("error", handleError);
    };

    const handleLoad = () => {
      cleanup();

      if (window.Razorpay) {
        resolve();
        return;
      }

      razorpayLoaderPromise = undefined;
      reject(new Error("Razorpay loaded without exposing Checkout. Please retry."));
    };

    const handleError = () => {
      cleanup();
      script?.remove();
      razorpayLoaderPromise = undefined;
      reject(
        new Error(
          "Razorpay Checkout was blocked. Check your internet connection or ad blocker, then retry.",
        ),
      );
    };

    if (!script) {
      script = document.createElement("script");
      script.id = RAZORPAY_SCRIPT_ID;
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
    }

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });

    timeout = window.setTimeout(() => {
      cleanup();
      script?.remove();
      razorpayLoaderPromise = undefined;
      reject(
        new Error(
          "Razorpay Checkout timed out. Check your connection or disable blocking extensions, then retry.",
        ),
      );
    }, 15000);

    if (window.Razorpay) {
      handleLoad();
      return;
    }

    if (shouldAppendScript) {
      document.head.appendChild(script);
    }
  });

  return razorpayLoaderPromise;
};

const PaymentPage = ({ username, initialData }) => {
  const [creatorData, setCreatorData] = useState(initialData);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [checkoutReady, setCheckoutReady] = useState(false);
  const [supporterView, setSupporterView] = useState("top");

  const {
    profile,
    projects,
    stats,
    testCheckoutEnabled,
    topContributions,
    recentContributions = [],
  } = creatorData;
  const fundingGoal = profile.fundingGoal || 10000;
  const progress = fundingProgress(stats.totalAmount, fundingGoal);
  const goalReached = progress >= 100;
  const visibleContributions =
    supporterView === "top" ? topContributions : recentContributions;

  useEffect(() => {
    if (!testCheckoutEnabled) {
      return undefined;
    }

    let active = true;

    loadRazorpayCheckout()
      .then(() => {
        if (active) setCheckoutReady(true);
      })
      .catch((error) => {
        if (active) setFormError(error.message);
      });

    return () => {
      active = false;
    };
  }, [testCheckoutEnabled]);

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const refreshCreatorData = async () => {
    const freshData = await getPublicCreatorData(username);

    if (freshData) {
      setCreatorData(freshData);
    }
  };

  const submitContribution = async (event) => {
    event.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      await loadRazorpayCheckout();
      setCheckoutReady(true);

      const orderResponse = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          name: form.name,
          message: form.message,
          amount: Number(form.amount),
        }),
      });
      const orderResult = await orderResponse.json();

      if (!orderResponse.ok || !orderResult.ok) {
        setFormError(orderResult.error || "Could not create a Razorpay test order.");
        setSubmitting(false);
        return;
      }

      const checkout = new window.Razorpay({
        key: orderResult.checkout.keyId,
        amount: orderResult.checkout.amount,
        currency: orderResult.checkout.currency,
        name: "GetFunds Test Mode",
        description: `Test contribution to @${username}`,
        order_id: orderResult.checkout.orderId,
        prefill: {
          name: orderResult.checkout.supporterName,
        },
        notes: {
          creator: username,
        },
        theme: {
          color: "#7c3aed",
        },
        modal: {
          ondismiss: () => setSubmitting(false),
        },
        handler: async (paymentResult) => {
          try {
            const verificationResponse = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(paymentResult),
            });
            const verification = await verificationResponse.json();

            if (!verificationResponse.ok || !verification.ok) {
              setFormError(
                verification.error || "The Razorpay test payment could not be verified.",
              );
              return;
            }

            setForm(emptyForm);
            await refreshCreatorData();
            toast.success(verification.message);
          } catch {
            setFormError("Payment returned successfully, but server verification failed.");
          } finally {
            setSubmitting(false);
          }
        },
      });

      checkout.on("payment.failed", (response) => {
        setFormError(
          response?.error?.description || "The Razorpay test payment was marked as failed.",
        );
        setSubmitting(false);
      });

      checkout.open();
    } catch (error) {
      setFormError(error.message || "Could not open Razorpay Test Checkout.");
      setSubmitting(false);
    }
  };

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={4000}
        theme="dark"
      />

      <section className="relative">
        <div className="relative h-52 overflow-hidden bg-gradient-to-r from-purple-950 via-slate-900 to-blue-950 md:h-[350px]">
          {profile.coverpic ? (
            <Image
              className="object-cover opacity-80"
              src={profile.coverpic}
              alt=""
              fill
              sizes="100vw"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center text-lg text-slate-300">
              Creator cover
            </div>
          )}
        </div>

        <div className="absolute -bottom-16 left-1/2 size-32 -translate-x-1/2 overflow-hidden rounded-full border-4 border-slate-950 bg-slate-800 md:size-36">
          <Image
            className="object-cover"
            src={profile.profilepic || "/avatar.gif"}
            alt={`${profile.name}'s profile`}
            fill
            sizes="(min-width: 768px) 144px, 128px"
            unoptimized
          />
        </div>
      </section>

      <main className="mx-auto mb-24 mt-24 w-[92%] max-w-6xl">
        <header className="text-center">
          <span className="inline-flex rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-200">
            Razorpay Test Mode · no real money
          </span>
          <h1 className="mt-4 text-3xl font-bold">{profile.name}</h1>
          <p className="mt-1 text-slate-400">@{username}</p>
          {profile.bio ? (
            <p className="mx-auto mt-4 max-w-2xl whitespace-pre-line text-slate-300">
              {profile.bio}
            </p>
          ) : (
            <p className="mt-3 text-slate-300">
              Support this creator through Razorpay&apos;s official mock checkout.
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm text-slate-400">
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="max-w-xs truncate text-blue-300 hover:underline"
              >
                🔗 {profile.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              </a>
            )}
            {profile.joinedAt && <span>Joined {formatDate(profile.joinedAt)}</span>}
            <ShareButton
              path={`/${username}`}
              title={`Support ${profile.name} on GetFunds`}
            />
          </div>
        </header>

        <section
          className="mx-auto mt-8 max-w-3xl rounded-2xl border border-slate-700 bg-slate-900/90 p-6"
          aria-labelledby="funding-progress"
        >
          <div className="flex items-end justify-between gap-4">
            <div>
              <p id="funding-progress" className="text-sm text-slate-400">
                Test funding progress
                {goalReached && (
                  <span className="ml-2 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-200">
                    Goal reached 🎉
                  </span>
                )}
              </p>
              <p className="mt-1 text-2xl font-bold">
                {currency.format(stats.totalAmount)}
              </p>
            </div>
            <p className="text-right text-sm text-slate-300">
              {progress}% of {currency.format(fundingGoal)}
            </p>
          </div>
          <div
            className="mt-4 h-3 overflow-hidden rounded-full bg-slate-700"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <div
              className={`h-full rounded-full bg-gradient-to-r transition-all ${
                goalReached ? "from-emerald-500 to-teal-400" : "from-purple-500 to-blue-500"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </section>

        <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ["Total raised", currency.format(stats.totalAmount)],
            ["Contributions", stats.contributionCount],
            ["Supporters", stats.supporterCount],
            ["Average", currency.format(stats.averageAmount)],
          ].map(([label, value]) => (
            <article
              key={label}
              className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-center"
            >
              <p className="text-xs uppercase tracking-wide text-slate-400">
                {label}
              </p>
              <p className="mt-2 text-xl font-bold">{value}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-5 md:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Project folders</h2>
              <p className="mt-1 text-sm text-slate-400">
                Public files uploaded by this creator and stored in MongoDB GridFS.
              </p>
            </div>
            <span className="text-sm text-slate-500">
              {projects.length} {projects.length === 1 ? "folder" : "folders"}
            </span>
          </div>

          {projects.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-700 p-7 text-center text-slate-400">
              This creator has not published a project folder yet.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {projects.map((project) => (
                <article
                  key={project.id}
                  className="rounded-xl border border-slate-700 bg-slate-800/60 p-5"
                >
                  <h3 className="text-lg font-bold">📁 {project.title}</h3>
                  {project.description && (
                    <p className="mt-2 text-sm text-slate-300">
                      {project.description}
                    </p>
                  )}
                  <ul className="mt-4 space-y-2">
                    {project.files.map((file) => (
                      <li key={file.id}>
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between gap-3 rounded-lg bg-slate-900 px-3 py-2 text-sm text-blue-200 hover:bg-slate-950"
                        >
                          <span className="truncate">{file.filename}</span>
                          <span className="shrink-0 text-xs text-slate-500">
                            {formatFileSize(file.size)}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold">Supporters</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {supporterView === "top"
                    ? "Ranked by verified test contribution amount."
                    : "Latest verified test contributions."}
                </p>
              </div>
              <div className="flex rounded-lg border border-slate-700 p-1 text-sm" role="tablist">
                {[
                  ["top", "Top"],
                  ["recent", "Recent"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={supporterView === value}
                    onClick={() => setSupporterView(value)}
                    className={`rounded-md px-3 py-1 ${
                      supporterView === value
                        ? "bg-purple-600 font-semibold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {visibleContributions.length === 0 ? (
              <div className="mt-8 rounded-xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
                No verified test contributions yet. Be the first supporter.
              </div>
            ) : (
              <ol className="mt-6 space-y-4">
                {visibleContributions.map((contribution, index) => (
                  <li
                    key={contribution.id}
                    className="flex gap-3 rounded-xl bg-slate-800/70 p-4"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-purple-600 font-bold">
                      {supporterView === "top" ? index + 1 : contribution.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-semibold">{contribution.name}</p>
                        <p className="shrink-0 font-bold text-emerald-300">
                          {currency.format(contribution.amount)}
                        </p>
                      </div>
                      {contribution.message && (
                        <p className="mt-1 break-words text-sm text-slate-300">
                          “{contribution.message}”
                        </p>
                      )}
                      {supporterView === "recent" && contribution.createdAt && (
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(contribution.createdAt)}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="rounded-2xl border border-purple-500/30 bg-slate-900 p-5 md:p-8">
            <h2 className="text-2xl font-bold">Open Razorpay Test Checkout</h2>
            <p className="mt-1 text-sm text-amber-200">
              Razorpay displays a mock payment screen. Test keys cannot move real money.
            </p>

            {!testCheckoutEnabled && (
              <p className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100">
                Add server-only RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET test keys to .env.local, then restart the server.
              </p>
            )}

            <form className="mt-6 space-y-4" onSubmit={submitContribution}>
              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="name">
                  Supporter name
                </label>
                <input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  minLength={2}
                  maxLength={60}
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                  placeholder="Enter a demo supporter name"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="message">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  maxLength={240}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                  placeholder="Write an optional message"
                />
                <p className="mt-1 text-right text-xs text-slate-500">
                  {form.message.length}/240
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="amount">
                  Test amount in rupees
                </label>
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  value={form.amount}
                  onChange={handleChange}
                  min={10}
                  max={100000}
                  step={1}
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                  placeholder="100"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[100, 500, 1000].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        amount: String(amount),
                      }))
                    }
                    className="rounded-lg bg-slate-800 p-2 text-sm hover:bg-slate-700"
                  >
                    {currency.format(amount)}
                  </button>
                ))}
              </div>

              {formError && (
                <p
                  className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200"
                  role="alert"
                >
                  {formError}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || !testCheckoutEnabled}
                className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-3 font-semibold hover:from-purple-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? "Opening secure test checkout..."
                  : !testCheckoutEnabled
                    ? "Configure Razorpay test keys"
                    : !checkoutReady
                      ? "Load Razorpay Test Checkout"
                      : "Pay with Razorpay Test Mode"}
              </button>

              {testCheckoutEnabled && (
                <p className="text-center text-xs text-slate-500">
                  In Razorpay&apos;s UPI test flow, use success@razorpay or failure@razorpay.
                </p>
              )}
            </form>
          </section>
        </div>
      </main>
    </>
  );
};

export default PaymentPage;
