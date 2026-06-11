export type EntityBase = {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export const createId = () => crypto.randomUUID();

export const nowIso = () => new Date().toISOString();
