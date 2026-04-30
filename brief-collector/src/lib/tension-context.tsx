'use client';

import { createContext, useContext, useMemo } from 'react';
import { getTensionsForStep, type Tension } from './tensions';

export const TensionContext = createContext<Tension[]>([]);

export function useTensionsForStep(stepId: string): Tension[] {
  const all = useContext(TensionContext);
  return useMemo(() => getTensionsForStep(all, stepId), [all, stepId]);
}

/** Check if a specific field is involved in any active tension */
export function useFieldHasTension(field: string): boolean {
  const all = useContext(TensionContext);
  return useMemo(() => all.some((t) => t.fields.includes(field)), [all, field]);
}
