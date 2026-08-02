import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("field", "min-h-28 resize-y", className)} {...props} />;
}
