import type { ReactNode } from "react";
import { Button } from "./button";

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="state-panel"><div className="state-icon" aria-hidden="true">⌁</div><h2>{title}</h2><p>{description}</p>{action}</div>;
}

export function ErrorState({ title = "Something went wrong", description, retry }: { title?: string; description: string; retry?: () => void }) {
  return <div className="state-panel" role="alert"><div className="state-icon state-icon-error" aria-hidden="true">!</div><h2>{title}</h2><p>{description}</p>{retry && <Button variant="secondary" onClick={retry}>Try again</Button>}</div>;
}
