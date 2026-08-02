"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/feedback";
import { LoadingSpinner } from "@/components/ui/loading";
import { PageHeader } from "@/components/layout/page-header";
import { api } from "@/lib/api-client";

type Customer = { id: string; name: string; phone: string; createdAt: string | null; totalDebt: number; totalPaid: number; outstandingBalance: number; debtCount: number; hasDebt: boolean; status: "ACTIVE" | "CLEARED" };
const money = (value: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(value);

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const load = useCallback((): Promise<Customer | null> => token ? api<Customer>(`/customers/${id}`, { token }) : Promise.resolve(null), [id, token]);
  const retry = useCallback(() => setReloadKey((current) => current + 1), []);

  useEffect(() => {
    let cancelled = false;
    void load().then((result) => {
      if (!cancelled) { setCustomer(result); setError(""); }
    }).catch((reason: unknown) => {
      if (!cancelled) setError(reason instanceof Error ? reason.message : "Unable to load customer.");
    });
    return () => { cancelled = true; };
  }, [load, reloadKey]);

  if (error) return <ErrorState description={error} retry={retry} />;
  if (!customer) return <div className="route-loading"><LoadingSpinner label="Loading customer" /></div>;
  return <><PageHeader title={customer.name} description={customer.phone} /><div className="dashboard-grid"><Card><h2>Personal information</h2><p>Phone: {customer.phone}</p><p>Created: {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : "—"}</p></Card><Card><h2>Financial summary</h2><p>Outstanding: {money(customer.outstandingBalance)}</p><p>Total debt: {money(customer.totalDebt)}</p><p>Total paid: {money(customer.totalPaid)}</p><p>Debt count: {customer.debtCount}</p><Badge>{customer.status}</Badge></Card><Card><h2>Recent activity</h2><p>No recent activity is available yet.</p></Card></div></>;
}
