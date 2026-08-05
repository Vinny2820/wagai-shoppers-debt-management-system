"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeading } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/ui/feedback";
import { SkeletonLoader } from "@/components/ui/loading";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/layout/page-header";
import { api } from "@/lib/api-client";

type CustomerSummary = { id: string; name: string; phone: string };

type DebtSummary = {
  id: string;
  amount: number;
  balance: number;
  status: string;
  description: string | null;
  createdAt: string | null;
  customer: CustomerSummary;
};

type PaymentSummary = {
  id: string;
  amount: number;
  method: string;
  status: string;
  phone: string | null;
  mpesaReceipt: string | null;
  createdAt: string | null;
  customer: CustomerSummary;
  debt: {
    id: string;
    amount: number;
    balance: number;
    status: string;
    description: string | null;
  };
};

type DashboardSummary = {
  summary: {
    totalCustomers: number;
    totalDebtIssued: number;
    totalAmountPaid: number;
    outstandingBalance: number;
  };
  debtStatistics: {
    pendingDebts: number;
    partialDebts: number;
    paidDebts: number;
  };
  paymentStatistics: {
    cashPayments: number;
    mpesaPayments: number;
  };
  recentActivity: {
    debts: DebtSummary[];
    payments: PaymentSummary[];
  };
};

type DashboardData = {
  summary: DashboardSummary;
  debts: DebtSummary[];
  payments: PaymentSummary[];
};

type MetricCard = {
  label: string;
  value: string;
  detail: string;
  tone?: "default" | "positive" | "accent";
};

const money = (value: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(value);
const shortDate = (value: string | null) => value ? new Date(value).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" }) : "—";
const exactDate = (value: string | null) => value ? new Date(value).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" }) : "—";

const isSameDay = (value: string | null) => {
  if (!value) return false;
  const target = new Date(value);
  const today = new Date();
  return target.getFullYear() === today.getFullYear() && target.getMonth() === today.getMonth() && target.getDate() === today.getDate();
};

const isWithinRange = (value: string | null, days: number) => {
  if (!value) return false;
  const target = new Date(value);
  const now = new Date();
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return target >= cutoff;
};

export function DashboardManagement() {
  const { token } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDebt, setSelectedDebt] = useState<DebtSummary | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentSummary | null>(null);

  const load = useCallback(() => {
    if (!token) return Promise.resolve(null);
    return Promise.all([
      api<DashboardSummary>("/dashboard/summary", { token }),
      api<DebtSummary[]>("/debts", { token }),
      api<PaymentSummary[]>("/payments", { token }),
    ]).then(([summary, debts, payments]) => ({ summary, debts, payments }));
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    void load()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setError("");
        }
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Unable to load dashboard data.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [load]);

  const metrics = useMemo<MetricCard[]>(() => {
    if (!data) return [];
    const { summary, debtStatistics } = data.summary;
    const todayPayments = data.payments.filter((payment) => payment.status === "SUCCESS" && isSameDay(payment.createdAt)).reduce((total, payment) => total + payment.amount, 0);
    const activeDebts = data.debts.filter((debt) => debt.balance > 0 && debt.status !== "PAID").length;
    return [
      { label: "Total Outstanding Debt", value: money(summary.outstandingBalance), detail: `${debtStatistics.pendingDebts + debtStatistics.partialDebts} active balances`, tone: "accent" },
      { label: "Total Amount Collected", value: money(summary.totalAmountPaid), detail: `${summary.totalCustomers} customers contributing`, tone: "positive" },
      { label: "Total Customers", value: String(summary.totalCustomers), detail: "Customers with debt activity", tone: "default" },
      { label: "Customers With Active Debts", value: String(activeDebts), detail: "Unpaid balances in progress", tone: "default" },
      { label: "Overdue Debts", value: String(data.debts.filter((debt) => debt.balance > 0 && debt.status !== "PAID").length), detail: "Based on outstanding unpaid balances", tone: "default" },
      { label: "Payments Today", value: money(todayPayments), detail: "Collected today", tone: "positive" },
    ];
  }, [data]);

  const collectionSummary = useMemo(() => {
    if (!data) return { today: 0, week: 0, month: 0 };
    return {
      today: data.payments.filter((payment) => payment.status === "SUCCESS" && isSameDay(payment.createdAt)).reduce((total, payment) => total + payment.amount, 0),
      week: data.payments.filter((payment) => payment.status === "SUCCESS" && isWithinRange(payment.createdAt, 7)).reduce((total, payment) => total + payment.amount, 0),
      month: data.payments.filter((payment) => payment.status === "SUCCESS" && isWithinRange(payment.createdAt, 30)).reduce((total, payment) => total + payment.amount, 0),
    };
  }, [data]);

  if (loading) return <><PageHeader title="Dashboard" description="A business-ready overview of customer activity and collections." /><SkeletonLoader className="h-72" /></>;
  if (error) return <ErrorState description={error} retry={() => window.location.reload()} />;
  if (!data) return <EmptyState title="No dashboard data" description="The dashboard will appear here once the backend data is available." />;

  return <>
    <PageHeader title="Dashboard" description="A business-ready overview of customer activity and collections." actions={<div className="page-actions"><Link className="button button-secondary" href="/customers">Customers</Link><Link className="button button-secondary" href="/debts">Debts</Link><Link className="button button-secondary" href="/payments">Payments</Link><Link className="button button-secondary" href="/reports">Reports</Link></div>} />
    <div className="metric-grid">
      {metrics.map((metric) => <Card key={metric.label} className={`metric-card ${metric.tone === "positive" ? "metric-card-positive" : metric.tone === "accent" ? "metric-card-accent" : ""}`}><p>{metric.label}</p><strong>{metric.value}</strong><span>{metric.detail}</span></Card>)}
    </div>
    <div className="dashboard-grid">
      <Card>
        <CardHeading title="Recent debts" description="Latest debt records and outstanding balances." />
        {data.summary.recentActivity.debts.length === 0 ? <EmptyState title="No recent debts" description="Create a debt record to start tracking balances." /> : <>
          <div className="table-wrap customer-desktop"><table className="data-table"><thead><tr><th>Customer</th><th>Amount</th><th>Balance</th><th>Status</th><th>Date</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{data.summary.recentActivity.debts.map((debt) => <tr key={debt.id}><td>{debt.customer.name}<br /><small>{debt.customer.phone}</small></td><td>{money(debt.amount)}</td><td>{money(debt.balance)}</td><td><Badge>{debt.status}</Badge></td><td>{shortDate(debt.createdAt)}</td><td><Button size="sm" variant="ghost" onClick={() => setSelectedDebt(debt)}>View</Button></td></tr>)}</tbody></table></div>
          <div className="customer-mobile">{data.summary.recentActivity.debts.map((debt) => <div key={debt.id} className="customer-card"><div><strong>{debt.customer.name}</strong><span>{money(debt.balance)} balance</span><span>{shortDate(debt.createdAt)}</span></div><div><Button size="sm" variant="ghost" onClick={() => setSelectedDebt(debt)}>View</Button></div></div>)}</div>
        </>}
      </Card>
      <Card>
        <CardHeading title="Recent payments" description="Latest payments captured against debt balances." />
        {data.summary.recentActivity.payments.length === 0 ? <EmptyState title="No recent payments" description="Payments will appear here after they are recorded." /> : <>
          <div className="table-wrap customer-desktop"><table className="data-table"><thead><tr><th>Customer</th><th>Amount</th><th>Method</th><th>Date</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{data.summary.recentActivity.payments.map((payment) => <tr key={payment.id}><td>{payment.customer.name}<br /><small>{payment.customer.phone}</small></td><td>{money(payment.amount)}</td><td><Badge>{payment.method}</Badge></td><td>{shortDate(payment.createdAt)}</td><td><Button size="sm" variant="ghost" onClick={() => setSelectedPayment(payment)}>View</Button></td></tr>)}</tbody></table></div>
          <div className="customer-mobile">{data.summary.recentActivity.payments.map((payment) => <div key={payment.id} className="customer-card"><div><strong>{payment.customer.name}</strong><span>{money(payment.amount)}</span><span>{shortDate(payment.createdAt)}</span></div><div><Button size="sm" variant="ghost" onClick={() => setSelectedPayment(payment)}>View</Button></div></div>)}</div>
        </>}
      </Card>
      <Card>
        <CardHeading title="Collection summary" description="Collections captured in the current period." />
        <div className="report-summary-grid">
          <div className="report-summary-card"><p>Today</p><strong>{money(collectionSummary.today)}</strong></div>
          <div className="report-summary-card"><p>This week</p><strong>{money(collectionSummary.week)}</strong></div>
          <div className="report-summary-card"><p>This month</p><strong>{money(collectionSummary.month)}</strong></div>
        </div>
      </Card>
      <Card>
        <CardHeading title="Quick actions" description="Jump to the main operational screens." />
        <div className="quick-actions"><Link className="button button-secondary" href="/customers">Customers</Link><Link className="button button-secondary" href="/debts">Debts</Link><Link className="button button-secondary" href="/payments">Payments</Link><Link className="button button-secondary" href="/reports">Reports</Link></div>
      </Card>
    </div>
    <Modal open={selectedDebt !== null} title="Debt details" onClose={() => setSelectedDebt(null)}>
      {selectedDebt && <div className="modal-copy"><p><strong>Customer:</strong> {selectedDebt.customer.name}</p><p><strong>Amount:</strong> {money(selectedDebt.amount)}</p><p><strong>Balance:</strong> {money(selectedDebt.balance)}</p><p><strong>Status:</strong> {selectedDebt.status}</p><p><strong>Description:</strong> {selectedDebt.description ?? "—"}</p><p><strong>Created:</strong> {exactDate(selectedDebt.createdAt)}</p></div>}
    </Modal>
    <Modal open={selectedPayment !== null} title="Payment details" onClose={() => setSelectedPayment(null)}>
      {selectedPayment && <div className="modal-copy"><p><strong>Customer:</strong> {selectedPayment.customer.name}</p><p><strong>Amount:</strong> {money(selectedPayment.amount)}</p><p><strong>Method:</strong> {selectedPayment.method}</p><p><strong>Status:</strong> {selectedPayment.status}</p><p><strong>Date:</strong> {exactDate(selectedPayment.createdAt)}</p><p><strong>Receipt:</strong> {selectedPayment.mpesaReceipt ?? selectedPayment.phone ?? "—"}</p></div>}
    </Modal>
  </>;
}
