export const parseWarmupMultipliers = (value: string) => value
  .split(/[ ,;]+/)
  .map((item) => Number(item.trim().replace(",", ".")))
  .filter((item) => Number.isFinite(item) && item > 0 && item <= 1.5);

export const calculateWarmupWeight = (workingWeight: number, multiplier: number) => {
  const raw = workingWeight * multiplier;
  return Math.round(raw * 2) / 2;
};
