import Link from "next/link";
import { GuestRoute } from "@/components/auth/route-guards";

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <GuestRoute><main className="auth-layout"><Link href="/" className="brand auth-brand"><span className="brand-mark">W</span><span>Wagai <strong>Shoppers</strong></span></Link>{children}</main></GuestRoute>; }
