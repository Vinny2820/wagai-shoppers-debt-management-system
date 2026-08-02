import { ApplicationShell } from "@/components/layout/application-shell";

export default function WorkspaceLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <ApplicationShell>{children}</ApplicationShell>; }
