"use client";

import { useEffect } from "react";
import { cn } from "@/lib/cn";

export function Toast({ message, tone = "success", onDismiss }: { message: string; tone?: "success" | "error"; onDismiss?: () => void }) {
  useEffect(() => {
    if (!onDismiss) return;
    const timeout = window.setTimeout(onDismiss, 5000);
    return () => window.clearTimeout(timeout);
  }, [onDismiss]);
  return <div className={cn("toast", `toast-${tone}`)} role="status">{message}{onDismiss && <button aria-label="Dismiss notification" onClick={onDismiss}>×</button>}</div>;
}
