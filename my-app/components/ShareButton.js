"use client";

import { useState } from "react";

const ShareButton = ({ path, title, className = "" }) => {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = new URL(path, window.location.origin).toString();

    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }

      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // The user dismissing the native share sheet is not an error.
      if (error?.name !== "AbortError") {
        window.prompt("Copy this link:", url);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      className={`rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold hover:bg-slate-800 ${className}`}
    >
      {copied ? "Link copied ✓" : "Share page"}
    </button>
  );
};

export default ShareButton;
