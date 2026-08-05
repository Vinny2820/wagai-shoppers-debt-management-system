"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeading } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { SkeletonLoader } from "@/components/ui/loading";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/layout/page-header";
import { api } from "@/lib/api-client";

type CustomerSummary = { id: string; name: string; phone: string };

type DebtRecord = { id: string; amount: number; balance: number; status: string; description: string | null; createdAt: string | null; customer: CustomerSummary };

type PaymentRecord = { id: string; amount: number; method: string; status: string; createdAt: string | null; customer: CustomerSummary; debt: { id: string; amount: number; balance: number; status: string; description: string | null } };

type ReportFilters = { startDate: string; endDate: string; customerId: string; method: string; debtStatus: string };

const money = (value: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(value);
const shortDate = (value: string | null) => value ? new Date(value).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" }) : "—";

export function ReportManagement() {
  const { token } = useAuth();
  const [debts, setDebts] = useState<DebtRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<ReportFilters>({ startDate: "", endDate: "", customerId: "ALL", method: "ALL", debtStatus: "ALL" });

  const load = useCallback(() => {
    if (!token) return Promise.resolve([[], [], []] as [DebtRecord[], PaymentRecord[], CustomerSummary[]]);
    return Promise.all([
      api<DebtRecord[]>("/debts", { token }),
      api<PaymentRecord[]>("/payments", { token }),
      api<CustomerSummary[]>("/customers", { token }),
    ]);
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    void load()
      .then(([nextDebts, nextPayments, nextCustomers]) => {
        if (!cancelled) {
          setDebts(nextDebts);
          setPayments(nextPayments);
          setCustomers(nextCustomers);
          setError("");
        }
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Unable to load reports.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [load]);

  const filteredDebts = useMemo(() => debts.filter((debt) => {
    const dateOk = (!filters.startDate || (debt.createdAt && debt.createdAt >= filters.startDate)) && (!filters.endDate || (debt.createdAt && debt.createdAt <= `${filters.endDate}T23:59:59.999Z`));
    const customerOk = filters.customerId === "ALL" || debt.customer.id === filters.customerId;
    const statusOk = filters.debtStatus === "ALL" || debt.status === filters.debtStatus;
    return dateOk && customerOk && statusOk;
  }), [debts, filters]);

  const filteredPayments = useMemo(() => payments.filter((payment) => {
    const dateOk = (!filters.startDate || (payment.createdAt && payment.createdAt >= filters.startDate)) && (!filters.endDate || (payment.createdAt && payment.createdAt <= `${filters.endDate}T23:59:59.999Z`));
    const customerOk = filters.customerId === "ALL" || payment.customer.id === filters.customerId;
    const methodOk = filters.method === "ALL" || payment.method === filters.method;
    return dateOk && customerOk && methodOk;
  }), [filters, payments]);

  const summary = useMemo(() => {
    const outstanding = filteredDebts.reduce((total, debt) => total + debt.balance, 0);
    const collections = filteredPayments.reduce((total, payment) => total + payment.amount, 0);
    const active = filteredDebts.filter((debt) => debt.balance > 0 && debt.status !== "PAID").length;
    const paid = filteredDebts.filter((debt) => debt.status === "PAID").length;
    return { outstanding, collections, active, paid, customers: new Set(filteredDebts.map((debt) => debt.customer.id)).size };
  }, [filteredDebts, filteredPayments]);

  if (loading) return <><PageHeader title="Reports" description="Build operational reports from live debt and payment records." /><SkeletonLoader className="h-72" /></>;
  if (error) return <ErrorState description={error} retry={() => window.location.reload()} />;

  return <>
    <PageHeader title="Reports" description="Build operational reports from live debt and payment records." />
    <Card>
      <CardHeading title="Report filters" description="Filter the business views by date, customer, method, or debt status." />
      <div className="customer-tools">
        <Input aria-label="Start date" type="date" value={filters.startDate} onChange={(event) => setFilters((current) => ({ ...current, startDate: event.target.value }))} />
        <Input aria-label="End date" type="date" value={filters.endDate} onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value }))} />
        <Select aria-label="Customer" value={filters.customerId} onChange={(event) => setFilters((current) => ({ ...current, customerId: event.target.value }))}><option value="ALL">All customers</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</Select>
        <Select aria-label="Payment method" value={filters.method} onChange={(event) => setFilters((current) => ({ ...current, method: event.target.value }))}><option value="ALL">All methods</option><option value="MPESA">MPESA</option><option value="CASH">Cash</option></Select>
        <Select aria-label="Debt status" value={filters.debtStatus} onChange={(event) => setFilters((current) => ({ ...current, debtStatus: event.target.value }))}><option value="ALL">All debt statuses</option><option value="ACTIVE">ACTIVE</option><option value="PARTIAL">PARTIAL</option><option value="PAID">PAID</option><option value="PENDING">PENDING</option></Select>
      </div>
    </Card>
    <div className="dashboard-grid">
      <Card>
        <CardHeading title="Debt report" description="Current debt portfolio after applying the active filters." />
        {filteredDebts.length === 0 ? <EmptyState title="No debt report rows" description="No debts match the selected filters." /> : <div className="table-wrap"><table className="data-table"><thead><tr><th>Customer</th><th>Original Amount</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead><tbody>{filteredDebts.map((debt) => <tr key={debt.id}><td>{debt.customer.name}<br /><small>{debt.customer.phone}</small></td><td>{money(debt.amount)}</td><td>{money(debt.amount - debt.balance)}</td><td>{money(debt.balance)}</td><td><Badge>{debt.status}</Badge></td></tr>)}</tbody></table></div>}
      </Card>
      <Card>
        <CardHeading title="Payment report" description="Payment activity captured in the selected period." />
        {filteredPayments.length === 0 ? <EmptyState title="No payment report rows" description="No payments match the selected filters." /> : <div className="table-wrap"><table className="data-table"><thead><tr><th>Customer</th><th>Amount</th><th>Method</th><th>Date</th></tr></thead><tbody>{filteredPayments.map((payment) => <tr key={payment.id}><td>{payment.customer.name}<br /><small>{payment.customer.phone}</small></td><td>{money(payment.amount)}</td><td><Badge>{payment.method}</Badge></td><td>{shortDate(payment.createdAt)}</td></tr>)}</tbody></table></div>}
      </Card>
      <Card>
        <CardHeading title="Customer statement" description="A concise view of debts and payments per customer." />
        {customers.length === 0 ? <EmptyState title="No customer statements" description="Customer statements will appear when customer data is available." /> : <div className="table-wrap"><table className="data-table"><thead><tr><th>Customer</th><th>Debts</th><th>Payments</th><th>Running balance</th></tr></thead><tbody>{customers.map((customer) => {
          const debtTotal = filteredDebts.filter((debt) => debt.customer.id === customer.id).reduce((total, debt) => total + debt.balance, 0);
          const paymentTotal = filteredPayments.filter((payment) => payment.customer.id === customer.id).reduce((total, payment) => total + payment.amount, 0);
          return <tr key={customer.id}><td>{customer.name}<br /><small>{customer.phone}</small></td><td>{money(debtTotal)}</td><td>{money(paymentTotal)}</td><td>{money(debtTotal - paymentTotal)}</td></tr>;
        })}</tbody></table></div>}
      </Card>
      <Card>
        <CardHeading title="Summary report" description="Overall totals from the current filter set." />
        <div className="report-summary-grid">
          <div className="report-summary-card"><p>Outstanding debt</p><strong>{money(summary.outstanding)}</strong></div>
          <div className="report-summary-card"><p>Collections</p><strong>{money(summary.collections)}</strong></div>
          <div className="report-summary-card"><p>Active debts</p><strong>{String(summary.active)}</strong></div>
          <div className="report-summary-card"><p>Paid debts</p><strong>{String(summary.paid)}</strong></div>
          <div className="report-summary-card"><p>Customer totals</p><strong>{String(summary.customers)}</strong></div>
        </div>
      </Card>
    </div>
  </>;
}
