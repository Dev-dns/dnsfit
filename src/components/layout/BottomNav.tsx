import type { AppRoute, RouteId } from "../../app/routes";

type BottomNavProps = {
  activeRoute: RouteId;
  routes: AppRoute[];
  onNavigate: (routeId: RouteId) => void;
};

export function BottomNav({ activeRoute, routes, onNavigate }: BottomNavProps) {
  return (
    <nav className="z-30 shrink-0 border-t border-line bg-ink/92 px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-3 backdrop-blur-xl">
      <div className="grid grid-cols-5 gap-1 rounded-3xl border border-line bg-panel/80 p-1">
        {routes.map((route) => {
          const isActive = route.id === activeRoute;
          return (
            <button
              key={route.id}
              type="button"
              className={`rounded-2xl px-2 py-3 text-center transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-danger ${
                isActive ? "bg-danger text-white shadow-[0_0_24px_rgba(229,9,20,0.28)]" : "text-muted hover:bg-white/5 hover:text-white"
              }`}
              onClick={() => onNavigate(route.id)}
            >
              <span className="block font-mono text-[9px] uppercase tracking-[0.18em] opacity-75">{route.eyebrow}</span>
              <span className="mt-1 block text-[12px] font-bold">{route.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
