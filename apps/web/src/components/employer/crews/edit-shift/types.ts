import type {
  ShiftView,
  ShiftAssignmentView,
  ShiftType,
  ShiftMetadata,
  CrewView,
  ActiveHireView,
} from '@/lib/api/employer-ops';

// Shape held by the Edit Shift form while the user is editing. Mirrors the
// PATCH body the API accepts; assignments + worker actions are managed
// separately and applied immediately.
export type ShiftDraft = {
  crewId: string | null;
  shiftDate: string;
  startTime: string;
  endTime: string;
  status: ShiftView['status'];
  shiftType: ShiftType;
  locationLabel: string;
  locationLat: number | null;
  locationLng: number | null;
  notes: string;
  metadata: ShiftMetadata;
  // Day-of-week toggles for additional sibling shifts. Local to the form;
  // converted to repeat dates relative to shiftDate at save time.
  repeatDow: { Mon: boolean; Tue: boolean; Wed: boolean; Thu: boolean; Fri: boolean; Sat: boolean; Sun: boolean };
};

export type EditShiftPageProps = {
  locale: string;
  shift: ShiftView;
  assignments: ShiftAssignmentView[];
  crews: CrewView[];
  hires: ActiveHireView[];
};

export const SECTION_IDS = [
  'type',
  'crew',
  'date',
  'loc',
  'logistics',
  'safety',
  'notify',
  'workers',
] as const;
export type SectionId = (typeof SECTION_IDS)[number];

// Day-of-week helpers used by the date/time section.
export const DOW_KEYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export type DowKey = (typeof DOW_KEYS)[number];

export function dowOfDate(iso: string): DowKey {
  const d = new Date(`${iso}T00:00:00.000Z`);
  // getUTCDay: 0=Sun..6=Sat
  const map: DowKey[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return map[d.getUTCDay()] ?? 'Mon';
}

export function repeatDatesForDraft(
  baseIso: string,
  repeatDow: ShiftDraft['repeatDow'],
): string[] {
  const base = new Date(`${baseIso}T00:00:00.000Z`);
  const baseDow = dowOfDate(baseIso);
  const out: string[] = [];
  const order: DowKey[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  // Compute Monday of the same ISO week as baseIso.
  const offsetFromMonday = order.indexOf(baseDow);
  const monday = new Date(base);
  monday.setUTCDate(base.getUTCDate() - offsetFromMonday);
  for (let i = 0; i < 7; i++) {
    const dow = order[i]!;
    if (!repeatDow[dow]) continue;
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    const iso = d.toISOString().slice(0, 10);
    if (iso === baseIso) continue;
    out.push(iso);
  }
  return out;
}
