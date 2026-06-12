// Floor plans carry a configuration label (1 BHK / 2 BHK / Jodi …) and an
// optional carpet area, alongside the image URL. To avoid a schema migration we
// keep the existing `floorPlans String[]` column and pack the three fields into
// each entry with a unit-separator char that never appears in URLs or labels.
// Legacy entries (a bare URL with no separator) parse as an unlabeled plan.

export const PLAN_LABELS = [
  "1 BHK", "2 BHK", "2.5 BHK", "3 BHK", "3.5 BHK", "4 BHK",
  "Jodi flat", "Penthouse", "Duplex", "Shop / Commercial", "Master plan",
] as const;

export type FloorPlan = { label: string; carpet: string; url: string };

const SEP = String.fromCharCode(31); // ASCII unit separator — never in URLs/labels

export function encodeFloorPlan(p: FloorPlan): string {
  return `${p.label}${SEP}${p.carpet}${SEP}${p.url}`;
}

export function parseFloorPlan(s: string): FloorPlan {
  if (s.includes(SEP)) {
    const parts = s.split(SEP);
    return { label: parts[0] || "", carpet: parts[1] || "", url: parts.slice(2).join(SEP) };
  }
  return { label: "", carpet: "", url: s }; // legacy unlabeled plan
}

export const parseFloorPlans = (arr: string[]): FloorPlan[] => arr.map(parseFloorPlan);
