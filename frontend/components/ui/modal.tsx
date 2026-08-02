"use client";

import { useEffect, type ReactNode } from "react";
import { Button } from "./button";

export function Modal({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);
  if (!open) return null;
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={(event) => event.stopPropagation()}><div className="modal-header"><h2 id="modal-title">{title}</h2><Button variant="ghost" size="sm" aria-label="Close dialog" onClick={onClose}>×</Button></div>{children}</section></div>;
}

export function ConfirmDialog({ open, title, description, confirmLabel = "Confirm", onConfirm, onClose }: { open: boolean; title: string; description: string; confirmLabel?: string; onConfirm: () => void; onClose: () => void }) {
  return <Modal open={open} title={title} onClose={onClose}><p className="modal-copy">{description}</p><div className="dialog-actions"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="danger" onClick={onConfirm}>{confirmLabel}</Button></div></Modal>;
}
