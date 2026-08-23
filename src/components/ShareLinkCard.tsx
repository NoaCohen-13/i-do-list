"use client";

import { useState } from "react";

export function ShareLinkCard({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input readOnly value={url} className="input flex-1" onFocus={(e) => e.target.select()} />
      <button type="button" onClick={handleCopy} className="btn-primary">
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}
