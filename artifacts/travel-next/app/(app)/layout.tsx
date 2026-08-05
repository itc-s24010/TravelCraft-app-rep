import { AppShell } from "@/components/layout/AppShell";

// Auth is enforced by middleware.ts — no client-side guard needed here.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
