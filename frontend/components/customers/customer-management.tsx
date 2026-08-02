"use client";

import Link from "next/link";
import { type ChangeEvent, type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { SkeletonLoader } from "@/components/ui/loading";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Toast } from "@/components/ui/toast";
import { PageHeader } from "@/components/layout/page-header";
import { api } from "@/lib/api-client";

type Customer = { id: string; name: string; phone: string; createdAt: string | null; totalDebt: number; totalPaid: number; outstandingBalance: number; debtCount: number; hasDebt: boolean; status: "ACTIVE" | "CLEARED" };
type CustomerForm = Pick<Customer, "name" | "phone">;
type Sort = "name" | "createdAt" | "totalDebt" | "outstandingBalance";
type ToastMessage = { message: string; tone: "success" | "error" } | null;

const initialForm: CustomerForm = { name: "", phone: "" };
const money = (value: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(value);

export function CustomerManagement() {
  const { token } = useAuth();
  const [items, setItems] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [debt, setDebt] = useState("ALL");
  const [sort, setSort] = useState<Sort>("createdAt");
  const [descending, setDescending] = useState(true);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [reloadKey, setReloadKey] = useState(0);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [form, setForm] = useState<CustomerForm>(initialForm);
  const [saving, setSaving] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [toast, setToast] = useState<ToastMessage>(null);

  const load = useCallback((): Promise<Customer[]> => {
    if (!token) return Promise.resolve([]);
    return api<Customer[]>("/customers", { token });
  }, [token]);

  const reload = useCallback(() => {
    setLoading(true);
    setReloadKey((current) => current + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    void load()
      .then((customers) => {
        if (!cancelled) {
          setItems(customers);
          setError("");
        }
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Unable to load customers.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [load, reloadKey]);

  const handleQueryChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
    setPage(1);
  }, []);
  const handleStatusChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    setStatus(event.target.value);
    setPage(1);
  }, []);
  const handleDebtChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    setDebt(event.target.value);
    setPage(1);
  }, []);
  const handleSortChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    setSort(event.target.value as Sort);
    setPage(1);
  }, []);
  const handleSizeChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    setSize(Number(event.target.value));
    setPage(1);
  }, []);
  const toggleSortDirection = useCallback(() => {
    setDescending((current) => !current);
    setPage(1);
  }, []);
  const closeEditor = useCallback(() => {
    setEditingCustomer(null);
    setCreatingCustomer(false);
    setForm(initialForm);
  }, []);
  const openCreate = useCallback(() => {
    setForm(initialForm);
    setCreatingCustomer(true);
  }, []);
  const openEdit = useCallback((customer: Customer) => {
    setForm({ name: customer.name, phone: customer.phone });
    setEditingCustomer(customer);
  }, []);
  const closeDeleteDialog = useCallback(() => setDeletingCustomer(null), []);
  const dismissToast = useCallback(() => setToast(null), []);
  const handleFormChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }, []);

  const saveCustomer = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || (!creatingCustomer && !editingCustomer)) return;
    setSaving(true);
    try {
      const isEditing = editingCustomer !== null;
      await api<Customer>(isEditing ? `/customers/${editingCustomer.id}` : "/customers", {
        token,
        method: isEditing ? "PATCH" : "POST",
        body: JSON.stringify(form),
      });
      closeEditor();
      setToast({ message: isEditing ? "Customer updated." : "Customer created.", tone: "success" });
      reload();
    } catch (reason) {
      setToast({ message: reason instanceof Error ? reason.message : "Unable to save customer.", tone: "error" });
    } finally {
      setSaving(false);
    }
  }, [closeEditor, creatingCustomer, editingCustomer, form, reload, token]);

  const deleteCustomer = useCallback(async () => {
    if (!token || !deletingCustomer) return;
    try {
      await api(`/customers/${deletingCustomer.id}`, { token, method: "DELETE" });
      setDeletingCustomer(null);
      setToast({ message: "Customer deleted.", tone: "success" });
      reload();
    } catch (reason) {
      setToast({ message: reason instanceof Error ? reason.message : "Unable to delete customer.", tone: "error" });
    }
  }, [deletingCustomer, reload, token]);

  const filtered = useMemo(() => items
    .filter((customer) => `${customer.name} ${customer.phone}`.toLowerCase().includes(query.toLowerCase())
      && (status === "ALL" || customer.status === status)
      && (debt === "ALL" || (debt === "HAS" ? customer.hasDebt : !customer.hasDebt)))
    .sort((left, right) => {
      const value = sort === "name"
        ? left.name.localeCompare(right.name)
        : sort === "createdAt"
          ? new Date(left.createdAt ?? 0).getTime() - new Date(right.createdAt ?? 0).getTime()
          : left[sort] - right[sort];
      return descending ? -value : value;
    }), [debt, descending, items, query, sort, status]);
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * size, currentPage * size);

  if (loading) return <><PageHeader title="Customers" description="Manage customers and financial summaries." /><SkeletonLoader className="h-72" /></>;
  if (error) return <ErrorState description={error} retry={reload} />;

  return <>
    <PageHeader title="Customers" description="Manage customers and financial summaries." actions={<Button onClick={openCreate}>Add customer</Button>} />
    <Card>
      <div className="customer-tools">
        <Input aria-label="Search customers" placeholder="Search name or phone" value={query} onChange={handleQueryChange} />
        <Select aria-label="Status" value={status} onChange={handleStatusChange}><option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="CLEARED">Cleared</option></Select>
        <Select aria-label="Debt" value={debt} onChange={handleDebtChange}><option value="ALL">All customers</option><option value="HAS">Has debt</option><option value="NONE">No debt</option></Select>
        <Select aria-label="Sort" value={sort} onChange={handleSortChange}><option value="createdAt">Created date</option><option value="name">Name</option><option value="outstandingBalance">Outstanding balance</option><option value="totalDebt">Total debt</option></Select>
        <Button variant="secondary" onClick={toggleSortDirection}>{descending ? "Descending" : "Ascending"}</Button>
      </div>
      {visible.length === 0 ? <EmptyState title="No customers found" description="Try adjusting your search or filters." action={<Button onClick={openCreate}>Add customer</Button>} /> : <>
        <div className="table-wrap customer-desktop"><table className="data-table"><thead><tr><th>Customer</th><th>Phone</th><th>Outstanding</th><th>Total debt</th><th>Total paid</th><th>Debts</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{visible.map((customer) => <tr key={customer.id}><td><Link className="table-link" href={`/customers/${customer.id}`}>{customer.name}</Link></td><td>{customer.phone}</td><td>{money(customer.outstandingBalance)}</td><td>{money(customer.totalDebt)}</td><td>{money(customer.totalPaid)}</td><td>{customer.debtCount}</td><td><Badge>{customer.status}</Badge></td><td><Button size="sm" variant="ghost" onClick={() => openEdit(customer)}>Edit</Button><Button size="sm" variant="ghost" onClick={() => setDeletingCustomer(customer)}>Delete</Button></td></tr>)}</tbody></table></div>
        <div className="customer-mobile">{visible.map((customer) => <div key={customer.id} className="customer-card"><Link href={`/customers/${customer.id}`}><strong>{customer.name}</strong><span>{customer.phone}</span><span>{money(customer.outstandingBalance)}</span><Badge>{customer.status}</Badge><span>{customer.debtCount} debts</span></Link><div><Button size="sm" variant="ghost" onClick={() => openEdit(customer)}>Edit</Button><Button size="sm" variant="ghost" onClick={() => setDeletingCustomer(customer)}>Delete</Button></div></div>)}</div>
        <div className="pagination"><span>{filtered.length} customers</span><Select aria-label="Rows per page" value={size} onChange={handleSizeChange}>{[10, 25, 50, 100].map((count) => <option key={count}>{count}</option>)}</Select><Button size="sm" variant="secondary" disabled={currentPage === 1} onClick={() => setPage((current) => current - 1)}>Previous</Button><span>Page {currentPage} of {pages}</span><Button size="sm" variant="secondary" disabled={currentPage === pages} onClick={() => setPage((current) => current + 1)}>Next</Button></div>
      </>}
    </Card>
    <Modal open={creatingCustomer || editingCustomer !== null} title={editingCustomer ? "Edit customer" : "Add customer"} onClose={closeEditor}>
      <form className="customer-form" onSubmit={saveCustomer}><label>Name<Input required name="name" value={form.name} onChange={handleFormChange} /></label><label>Phone<Input required name="phone" type="tel" value={form.phone} onChange={handleFormChange} /></label><div className="dialog-actions"><Button variant="secondary" onClick={closeEditor}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save customer"}</Button></div></form>
    </Modal>
    <ConfirmDialog open={deletingCustomer !== null} title="Delete customer" description={`Delete ${deletingCustomer?.name ?? "this customer"}? This cannot be undone.`} confirmLabel="Delete" onConfirm={deleteCustomer} onClose={closeDeleteDialog} />
    {toast && <Toast message={toast.message} tone={toast.tone} onDismiss={dismissToast} />}
  </>;
}
