import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() { return <main className="centered-page"><p className="eyebrow">404 error</p><h1>We couldn’t find that page.</h1><p>The page may have moved or the link may be incomplete.</p><Link href="/"><Button>Back to dashboard</Button></Link></main>; }
