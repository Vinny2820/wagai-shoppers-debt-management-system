import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
};

export function Button({ children, className, variant = "primary", size = "md", type = "button", ...props }: ButtonProps) {
  return <button type={type} className={cn("button", `button-${variant}`, `button-${size}`, className)} {...props}>{children}</button>;
}
