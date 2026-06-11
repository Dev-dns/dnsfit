export const calculateBackOffWeight = (topSetWeight: number, reductionPercent: number) => {
  const raw = topSetWeight * (1 - reductionPercent / 100);
  return Math.round(raw * 2) / 2;
};
