export const parseRestMinutesToSeconds = (value: string, fallbackSeconds: number) => {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return fallbackSeconds;

  const [minutesPart, secondsPart = ""] = normalized.split(".");
  const minutes = Number(minutesPart);
  if (!Number.isFinite(minutes) || minutes < 0) return fallbackSeconds;

  const paddedSeconds = secondsPart.length === 1 ? `${secondsPart}0` : secondsPart.slice(0, 2);
  const seconds = paddedSeconds ? Number(paddedSeconds) : 0;
  if (!Number.isFinite(seconds) || seconds < 0) return fallbackSeconds;

  return Math.max(1, Math.round(minutes * 60 + Math.min(seconds, 59)));
};

export const formatSecondsAsRestMinutes = (seconds: number | undefined) => {
  const safeSeconds = Math.max(0, Math.round(seconds ?? 0));
  const minutes = Math.floor(safeSeconds / 60);
  const restSeconds = (safeSeconds % 60).toString().padStart(2, "0");
  return `${minutes}.${restSeconds}`;
};
