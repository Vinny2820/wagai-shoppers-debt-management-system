"use client";
import { ErrorState } from "@/components/ui/feedback";
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <main className="centered-page"><ErrorState description="Please try loading the page again. If this problem continues, contact your administrator." retry={reset} /></main>; }
