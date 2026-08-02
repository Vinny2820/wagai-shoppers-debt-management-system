"use client";

import { type ChangeEvent, type FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Debt } from "@/components/debts/debt-management";
import { useAuth } from "@/components/auth/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState, EmptyState } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Toast } from "@/components/ui/toast";
import { PageHeader } from "@/components/layout/page-header";
import { api } from "@/lib/api-client";

const money = (value: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(value);
export default function DebtDetailPage() {
  const { id } = useParams<{ id: string }>(); const { token } = useAuth(); const [debt, setDebt] = useState<Debt | null>(null); const [error, setError] = useState(""); const [refresh, setRefresh] = useState(0); const [paymentOpen, setPaymentOpen] = useState(false); const [paymentAmount, setPaymentAmount] = useState(""); const [paymentMethod, setPaymentMethod] = useState("MPESA"); const [saving, setSaving] = useState(false); const [deleting, setDeleting] = useState(false); const [toast, setToast] = useState<string | null>(null);
  const load = useCallback(() => token ? api<Debt>(`/debts/${id}`, { token }) : Promise.resolve(null), [id, token]); const retry = useCallback(() => setRefresh((value) => value + 1), []);
  useEffect(() => { let cancelled = false; void load().then((value) => { if (!cancelled) { setDebt(value); setError(""); } }).catch(() => { if (!cancelled) setError("Unable to load debt. Please try again."); }); return () => { cancelled = true; }; }, [load, refresh]);
  const openPayment = useCallback(() => { setPaymentAmount(""); setPaymentMethod("MPESA"); setPaymentOpen(true); }, []);
  const closePayment = useCallback(() => setPaymentOpen(false), []);
  const submitPayment = useCallback(async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!token || !debt) return; const amount = Number(paymentAmount); if (!Number.isFinite(amount) || amount <= 0 || amount > debt.outstandingBalance) { setToast("Enter an amount up to the outstanding balance."); return; } setSaving(true); try { await api("/payments", { token, method: "POST", body: JSON.stringify({ debtId: debt.id, customerId: debt.customerId, amount, method: paymentMethod, ...(paymentMethod === "MPESA" ? { phone: debt.customer.phone } : {}) }) }); closePayment(); setToast("Payment recorded."); retry(); } catch { setToast("Unable to record payment. Please try again."); } finally { setSaving(false); } }, [closePayment, debt, paymentAmount, paymentMethod, retry, token]);
  const deleteDebt = useCallback(async () => { if (!token || !debt) return; try { await api(`/debts/${debt.id}`, { token, method: "DELETE" }); window.location.assign("/debts"); } catch { setDeleting(false); setToast("Unable to delete debt. Please try again."); } }, [debt, token]);
  if (error) return <ErrorState description={error} retry={retry} />; if (!debt) return <div className="route-loading"><LoadingSpinner label="Loading debt" /></div>;
  const payments = [...debt.payments].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()); const rows = payments.map((payment, index) => ({ payment, balance: debt.outstandingBalance + payments.slice(0, index).reduce((sum, newerPayment) => sum + newerPayment.amount, 0) }));
  return <><PageHeader title={`Debt · ${debt.customer.name}`} description={debt.description || "Debt details"} actions={<><Button variant="secondary" onClick={openPayment} disabled={debt.outstandingBalance === 0}>Record payment</Button><Link href="/debts"><Button variant="secondary">Edit debt</Button></Link><Button variant="danger" onClick={() => setDeleting(true)}>Delete</Button></>} /><div className="dashboard-grid"><Card><h2>Customer</h2><p><Link className="table-link" href={`/customers/${debt.customer.id}`}>{debt.customer.name}</Link></p><p>{debt.customer.phone}</p><p>Created: {debt.createdAt ? new Date(debt.createdAt).toLocaleDateString() : "—"}</p></Card><Card><h2>Financial summary</h2><p>Original amount: {money(debt.amount)}</p><p>Payments made: {money(debt.totalPaid)}</p><p>Outstanding: {money(debt.outstandingBalance)}</p><Badge>{debt.status}</Badge></Card></div><Card className="debt-history"><h2>Payment history</h2>{rows.length === 0 ? <EmptyState title="No payments yet" description="Payments recorded against this debt will appear here." /> : <div className="table-wrap"><table className="data-table"><thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Phone</th><th>Running balance</th></tr></thead><tbody>{rows.map(({ payment, balance: runningBalance }) => <tr key={payment.id}><td>{payment.createdAt ? new Date(payment.createdAt).toLocaleString() : "—"}</td><td>{money(payment.amount)}</td><td>{payment.method}</td><td>{payment.phone || "—"}</td><td>{money(runningBalance)}</td></tr>)}</tbody></table></div>}</Card><Modal open={paymentOpen} title="Record payment" onClose={closePayment}><form className="customer-form" onSubmit={submitPayment}><label>Amount<Input required type="number" min="0.01" max={debt.outstandingBalance} step="0.01" value={paymentAmount} onChange={(event: ChangeEvent<HTMLInputElement>) => setPaymentAmount(event.target.value)} /></label><label>Method<Select value={paymentMethod} onChange={(event: ChangeEvent<HTMLSelectElement>) => setPaymentMethod(event.target.value)}><option value="MPESA">MPESA</option><option value="CASH">Cash</option></Select></label><div className="dialog-actions"><Button variant="secondary" onClick={closePayment}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Recording…" : "Record payment"}</Button></div></form></Modal><ConfirmDialog open={deleting} title="Delete debt" description="Delete this debt? This cannot be undone." confirmLabel="Delete" onClose={() => setDeleting(false)} onConfirm={deleteDebt} />{toast && <Toast message={toast} tone="success" onDismiss={() => setToast(null)} />}</>;
}
