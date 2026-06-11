// Possession stage of a project — the buyer's #1 practical filter.
export const STAGES = ["New launch", "Under construction", "Ready to move"] as const;
export type Stage = (typeof STAGES)[number];

// UI colors per stage (Tailwind classes used on badges).
export const STAGE_BADGE: Record<string, string> = {
  "Ready to move": "bg-hx-success/10 text-hx-success",
  "Under construction": "bg-hx-warning/15 text-amber-700",
  "New launch": "bg-violet-100 text-violet-700",
};

// Solid variant for badges laid over photos (translucent ones wash out there).
export const STAGE_BADGE_SOLID: Record<string, string> = {
  "Ready to move": "bg-white/95 text-hx-success",
  "Under construction": "bg-white/95 text-amber-700",
  "New launch": "bg-white/95 text-violet-700",
};

/**
 * Coerce free input to a valid stage. Falls back to reading the possession
 * text ("Ready to move" → Ready to move) so old listings classify sensibly.
 */
export function normalizeStage(input?: string | null, possession?: string | null): Stage {
  if (input && (STAGES as readonly string[]).includes(input)) return input as Stage;
  if (possession && /ready/i.test(possession)) return "Ready to move";
  if (input && /launch|new/i.test(input)) return "New launch";
  return "Under construction";
}
