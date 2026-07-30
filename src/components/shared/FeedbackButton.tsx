"use client";

import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";

const FEEDBACK_FORM_URL = process.env.NEXT_PUBLIC_FEEDBACK_FORM_URL;

/**
 * Opens the configured Google Form in a new tab. No in-app storage or backend --
 * Google Forms is the system of record for responses. Disabled with an explanatory
 * tooltip when the env var isn't set, rather than silently doing nothing.
 */
export function FeedbackButton() {
  const [showTooltip, setShowTooltip] = useState(false);
  const isConfigured = Boolean(FEEDBACK_FORM_URL);

  if (isConfigured) {
    return (
      <a
        href={FEEDBACK_FORM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] px-4 py-2 text-xs font-medium text-white/[0.88] transition-colors duration-200 hover:border-[#E88DAF] hover:text-[#E88DAF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E88DAF]"
      >
        <MessageSquarePlus className="h-3.5 w-3.5" />
        Feedback
      </a>
    );
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        disabled
        aria-describedby="feedback-disabled-tooltip"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        className="inline-flex cursor-not-allowed items-center gap-2 rounded-full border border-white/[0.08] px-4 py-2 text-xs font-medium text-white/[0.35]"
      >
        <MessageSquarePlus className="h-3.5 w-3.5" />
        Feedback
      </button>
      {showTooltip && (
        <div
          id="feedback-disabled-tooltip"
          role="tooltip"
          className="absolute bottom-full left-1/2 mb-2 w-56 -translate-x-1/2 rounded-lg border border-white/[0.12] bg-[#0A0A0A] px-3 py-2 text-center text-[11px] text-white/[0.65] shadow-lg"
        >
          Feedback collection is not configured for this deployment.
        </div>
      )}
    </div>
  );
}
