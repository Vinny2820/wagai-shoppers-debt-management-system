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

type RecentDebt = { id: string; amount: number; balance: number; status: string; description: string | null; createdAt: string | null };
type RecentPayment = { id: string; amount: number; method: string; phone: string | null; createdAt: string | null };
type Customer = { id: string; name: string; phone: string; createdAt: string | null; totalDebt: number; totalPaid: number; outstandingBalance: number; debtCount: number; hasDebt: boolean; status: "ACTIVE" | "CLEARED"; recentDebts: RecentDebt[]; recentPayments: RecentPayment[] };
const money = (value: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(value);
const shortDate = (value: string | null) => value ? new Date(value).toLocaleDateString() : "—";

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
  return <><PageHeader title={customer.name} description={customer.phone} /><div className="dashboard-grid"><Card><h2>Personal information</h2><p>Phone: {customer.phone}</p><p>Created: {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : "—"}</p></Card><Card><h2>Financial summary</h2><p>Outstanding: {money(customer.outstandingBalance)}</p><p>Total debt: {money(customer.totalDebt)}</p><p>Total paid: {money(customer.totalPaid)}</p><p>Debt count: {customer.debtCount}</p><Badge>{customer.status}</Badge></Card><Card><h2>Recent debts</h2>{customer.recentDebts.length === 0 ? <p>No debt activity yet.</p> : <ul>{customer.recentDebts.map((debt) => <li key={debt.id}><strong>{money(debt.amount)}</strong> · {debt.description ?? "Debt"} · {shortDate(debt.createdAt)} · {debt.balance > 0 ? `${money(debt.balance)} remaining` : "Paid"}</li>)}</ul>}</Card><Card><h2>Recent payments</h2>{customer.recentPayments.length === 0 ? <p>No payments recorded yet.</p> : <ul>{customer.recentPayments.map((payment) => <li key={payment.id}><strong>{money(payment.amount)}</strong> · {payment.method} · {shortDate(payment.createdAt)}{payment.phone ? ` · ${payment.phone}` : ""}</li>)}</ul>}</Card></div></>;
}
