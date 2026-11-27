import { EARLY } from "./doors/early";
import { LATE } from "./doors/late";
import type { Door } from "./doors/types";

export { KIND_LABEL, type Door, type Kind } from "./doors/types";

/** All 24 doors, index = day - 1. */
export const DOORS: Door[] = [...EARLY, ...LATE];

if (import.meta.env.DEV && DOORS.some((d, i) => d.day !== i + 1)) console.warn("Door days out of order");
