import type { ReactNode } from "react";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { MorePage } from "../features/settings/MorePage";
import { ProgressPage } from "../features/progress/ProgressPage";
import { RoutinesPage } from "../features/routines/RoutinesPage";
import { TrainingPage } from "../features/training/TrainingPage";

export type RouteId = "dashboard" | "routines" | "training" | "progress" | "more";

export type AppRoute = {
  id: RouteId;
  label: string;
  eyebrow: string;
  element: ReactNode;
};

export const routes: AppRoute[] = [
  { id: "dashboard", label: "Inicio", eyebrow: "Hoy", element: <DashboardPage /> },
  { id: "routines", label: "Rutinas", eyebrow: "Plan", element: <RoutinesPage /> },
  { id: "training", label: "Entrenar", eyebrow: "Activo", element: <TrainingPage /> },
  { id: "progress", label: "Progreso", eyebrow: "Volumen", element: <ProgressPage /> },
  { id: "more", label: "Mas", eyebrow: "Datos", element: <MorePage /> }
];

export const getRouteById = (routeId: RouteId) => routes.find((route) => route.id === routeId) ?? routes[0];
