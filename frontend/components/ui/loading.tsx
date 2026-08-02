import { cn } from "@/lib/cn";

export function LoadingSpinner({ label = "Loading", className }: { label?: string; className?: string }) {
  return <span className={cn("spinner", className)} role="status" aria-label={label}><span className="sr-only">{label}</span></span>;
}

export function SkeletonLoader({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden="true" />;
}
