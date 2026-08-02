"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth/auth-provider";

const navigation = [
  ["Dashboard", "/"], ["Customers", "/customers"], ["Debts", "/debts"], ["Payments", "/payments"], ["Reports", "/reports"], ["Settings", "/settings"],
] as const;

export function ApplicationShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const pageTitle = navigation.find(([, href]) => href === pathname)?.[0] ?? "Wagai Shoppers";
  const closeMenu = () => setIsMenuOpen(false);

  return <div className="app-shell">
    {isMenuOpen && <button className="drawer-overlay" aria-label="Close navigation" onClick={closeMenu} />}
    <aside className={cn("sidebar", isMenuOpen && "sidebar-open")} aria-label="Primary navigation">
      <Link className="brand" href="/" onClick={closeMenu}><span className="brand-mark" aria-hidden="true">W</span><span>Wagai <strong>Shoppers</strong></span></Link>
      <nav><p className="nav-label">Workspace</p>{navigation.map(([label, href]) => <Link key={href} href={href} onClick={closeMenu} className={cn("nav-link", pathname === href && "nav-link-active")} aria-current={pathname === href ? "page" : undefined}><span className="nav-dot" aria-hidden="true" />{label}</Link>)}</nav>
      <div className="profile"><div className="avatar">{currentUser?.email.slice(0, 2).toUpperCase()}</div><div><strong>{currentUser?.email}</strong><span>Signed in</span></div><button className="logout" type="button" onClick={() => { logout(); router.replace("/login"); }}>Log out</button></div>
    </aside>
    <div className="app-main"><header className="topbar"><button className="menu-button" aria-label="Open navigation" aria-expanded={isMenuOpen} onClick={() => setIsMenuOpen(true)}><span /><span /><span /></button><div className="topbar-title"><p>Wagai Shoppers</p><h1>{pageTitle}</h1></div><label className="search"><span className="sr-only">Search</span><Input type="search" placeholder="Search customers, debts..." /></label><button className="icon-button" aria-label="Notifications"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg></button><button className="avatar avatar-button" aria-label="Open user menu">WA</button></header><main className="content">{children}</main><footer className="app-footer">© {new Date().getFullYear()} Wagai Shoppers Debt Management System</footer></div>
  </div>;
}
