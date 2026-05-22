import type {
  ShiftView,
  ShiftAssignmentView,
  ShiftType,
  ShiftMetadata,
  CrewView,
  ActiveHireView,
} from '@/lib/api/employer-ops';

// Shape held by the Edit Shift form while the user is editing a single shift.
// Mirrors the PATCH body the API accepts; assignments + worker actions are
// managed separately and applied immediately. Recurrence is not an edit-time
// concept — a series is created on the new-shift page and managed separately.
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

// Weekday labels, Monday-first. Keyed to the `edit_shift.date_time.dow.*` i18n
// bundle. The new-shift page's weekday picker reuses these labels.
export const DOW_KEYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export type DowKey = (typeof DOW_KEYS)[number];
