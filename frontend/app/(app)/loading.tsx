import { SkeletonLoader } from "@/components/ui/loading";
export default function Loading() { return <div className="loading-page" aria-label="Loading page"><SkeletonLoader className="h-8 w-48" /><div className="metric-grid">{Array.from({ length: 4 }, (_, index) => <SkeletonLoader key={index} className="h-36" />)}</div><SkeletonLoader className="h-72" /></div>; }
