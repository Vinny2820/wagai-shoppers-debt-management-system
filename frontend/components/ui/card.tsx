import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <section className={cn("card", className)} {...props} />;
}

export function CardHeading({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="card-heading"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</div>;
}
