import type { ReactNode } from "react";
import type { AppRoute, RouteId } from "../../app/routes";
import { BottomNav } from "./BottomNav";

type AppShellProps = {
  activeRoute: RouteId;
  routes: AppRoute[];
  startupError: string | null;
  children: ReactNode;
  onNavigate: (routeId: RouteId) => void;
};

export function AppShell({ activeRoute, routes, startupError, children, onNavigate }: AppShellProps) {
  return (
    <div className="h-dvh overflow-hidden bg-ink text-white">
      <div className="mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden border-x border-line/70 bg-[radial-gradient(circle_at_top_right,rgba(229,9,20,0.22),transparent_34%),linear-gradient(180deg,#050505_0%,#0b0b0b_100%)]">
        <header className="shrink-0 border-b border-line/80 bg-ink/86 px-5 pb-3 pt-[calc(env(safe-area-inset-top)+18px)] backdrop-blur-xl">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.38em] text-danger">dnsfit</p>
              <h1 className="mt-2 text-2xl font-black tracking-[-0.04em]">Tracker privado</h1>
            </div>
            <div className="rounded-full border border-line bg-panel px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
              Local
            </div>
          </div>
          {startupError ? (
            <div className="mt-4 rounded-2xl border border-danger/50 bg-danger/10 p-3 text-sm text-white">
              {startupError}
            </div>
          ) : null}
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto px-5 pb-8 pt-5">{children}</main>
        <BottomNav activeRoute={activeRoute} routes={routes} onNavigate={onNavigate} />
      </div>
    </div>
  );
}
