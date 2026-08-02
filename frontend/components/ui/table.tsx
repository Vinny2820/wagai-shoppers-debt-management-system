import type { TableHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return <div className="table-wrap"><table className={cn("data-table", className)} {...props} /></div>;
}
