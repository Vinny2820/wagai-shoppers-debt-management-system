import { ApplicationShell } from "@/components/layout/application-shell";
import { ProtectedRoute } from "@/components/auth/route-guards";

export default function WorkspaceLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <ProtectedRoute><ApplicationShell>{children}</ApplicationShell></ProtectedRoute>; }
