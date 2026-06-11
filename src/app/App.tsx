import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { initializeLocalData } from "../db/seed";
import { getRouteById, routes, type RouteId } from "./routes";

const getInitialRoute = (): RouteId => {
  const hash = window.location.hash.replace("#", "");
  return routes.some((route) => route.id === hash) ? (hash as RouteId) : "dashboard";
};

export function App() {
  const [activeRoute, setActiveRoute] = useState<RouteId>(getInitialRoute);
  const [startupError, setStartupError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initializeLocalData()
      .then(() => setIsReady(true))
      .catch((error: unknown) => {
        setStartupError(error instanceof Error ? error.message : "No se pudo iniciar IndexedDB.");
      });
  }, []);

  useEffect(() => {
    const onHashChange = () => setActiveRoute(getInitialRoute());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const route = useMemo(() => getRouteById(activeRoute), [activeRoute]);

  return (
    <AppShell
      activeRoute={activeRoute}
      routes={routes}
      startupError={startupError}
      onNavigate={(routeId) => {
        window.location.hash = routeId;
        setActiveRoute(routeId);
      }}
    >
      {isReady ? route.element : <StartupState hasError={Boolean(startupError)} />}
    </AppShell>
  );
}

function StartupState({ hasError }: { hasError: boolean }) {
  if (hasError) return null;

  return (
    <div className="rounded-[28px] border border-line bg-panel/86 p-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-danger">Local</p>
      <h2 className="mt-3 text-2xl font-black tracking-[-0.04em]">Preparando IndexedDB</h2>
      <p className="mt-3 text-sm leading-6 text-muted">Cargando musculos y ajustes base del dispositivo.</p>
    </div>
  );
}
