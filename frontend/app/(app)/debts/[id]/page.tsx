"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Debt } from "@/components/debts/debt-management";
import { useAuth } from "@/components/auth/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState, EmptyState } from "@/components/ui/feedback";
import { LoadingSpinner } from "@/components/ui/loading";
import { PageHeader } from "@/components/layout/page-header";
import { api } from "@/lib/api-client";

const money = (value: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(value);
export default function DebtDetailPage() {
  const { id } = useParams<{ id: string }>(); const { token } = useAuth(); const [debt, setDebt] = useState<Debt | null>(null); const [error, setError] = useState(""); const [refresh, setRefresh] = useState(0);
  const load = useCallback(() => token ? api<Debt>(`/debts/${id}`, { token }) : Promise.resolve(null), [id, token]); const retry = useCallback(() => setRefresh((value) => value + 1), []);
  useEffect(() => { let cancelled = false; void load().then((value) => { if (!cancelled) { setDebt(value); setError(""); } }).catch(() => { if (!cancelled) setError("Unable to load debt. Please try again."); }); return () => { cancelled = true; }; }, [load, refresh]);
  if (error) return <ErrorState description={error} retry={retry} />; if (!debt) return <div className="route-loading"><LoadingSpinner label="Loading debt" /></div>;
  const payments = [...debt.payments].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()); const rows = payments.map((payment, index) => ({ payment, balance: debt.outstandingBalance + payments.slice(0, index).reduce((sum, newerPayment) => sum + newerPayment.amount, 0) }));
  return <><PageHeader title={`Debt · ${debt.customer.name}`} description={debt.description || "Debt details"} actions={<Link href="/debts"><Button variant="secondary">Back to debts</Button></Link>} /><div className="dashboard-grid"><Card><h2>Customer</h2><p><Link className="table-link" href={`/customers/${debt.customer.id}`}>{debt.customer.name}</Link></p><p>{debt.customer.phone}</p><p>Created: {debt.createdAt ? new Date(debt.createdAt).toLocaleDateString() : "—"}</p></Card><Card><h2>Financial summary</h2><p>Original amount: {money(debt.amount)}</p><p>Payments made: {money(debt.totalPaid)}</p><p>Outstanding: {money(debt.outstandingBalance)}</p><Badge>{debt.status}</Badge></Card></div><Card className="debt-history"><h2>Payment history</h2>{rows.length === 0 ? <EmptyState title="No payments yet" description="Payments recorded against this debt will appear here." /> : <div className="table-wrap"><table className="data-table"><thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Phone</th><th>Running balance</th></tr></thead><tbody>{rows.map(({ payment, balance: runningBalance }) => <tr key={payment.id}><td>{payment.createdAt ? new Date(payment.createdAt).toLocaleString() : "—"}</td><td>{money(payment.amount)}</td><td>{payment.method}</td><td>{payment.phone || "—"}</td><td>{money(runningBalance)}</td></tr>)}</tbody></table></div>}</Card></>;
}
