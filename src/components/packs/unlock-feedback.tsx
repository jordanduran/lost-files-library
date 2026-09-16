"use client";

import { Check, LockKeyhole } from "lucide-react";
import { useEffect, useState } from "react";
import "./unlock-feedback.css";

// Triggered by the vote action, never by hydration of an existing unlock.
export function useUnlockFeedback() {
  const [recentUnlock, setRecentUnlock] = useState<string | null>(null);
  useEffect(() => {
    if (!recentUnlock) return;
    const timer = window.setTimeout(() => setRecentUnlock(null), 850);
    return () => window.clearTimeout(timer);
  }, [recentUnlock]);
  return [recentUnlock, setRecentUnlock] as const;
}

export function UnlockFeedback({ label }: { label: string }) {
  return (
    <span className="unlock-feedback" role="status">
      <span className="unlock-feedback-icon" aria-hidden="true">
        <LockKeyhole className="unlock-feedback-lock" size={14} />
        <Check className="unlock-feedback-check" size={14} />
      </span>
      <span className="unlock-feedback-label">
        <span>{label}</span>
        <span className="unlock-feedback-scramble" aria-hidden="true" />
      </span>
    </span>
  );
}
