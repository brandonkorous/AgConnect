// WIOA-aligned column labels for the placement report. Defined here (not
// hardcoded in SQL) so labels can be updated without touching query code
// when CDFA / EDD reporting templates evolve. See
// docs/30-admin/02-placement-report/08-edge-cases.md ("Field label drift").

export const PLACEMENT_COLUMNS = [
  'Participant ID',
  'First Name',
  'Last Name',
  'County of Residence',
  'Language Preference',
  'Service Start Date',
  'Service End Date',
  'Hire Date',
  'Employer Name',
  'Employer EIN',
  'Occupation Title (English)',
  'SOC Code',
  'Wage at Placement ($/hr)',
  'Wage Annual Equivalent ($)',
  'Training Program Name (most recent)',
  'Training Funder',
  'Training Completion Date',
  'Certification Earned',
  'Certification ID',
  'Q2 Retention Flag (manual)',
  'Q4 Retention Flag (manual)',
] as const;

export type PlacementColumn = (typeof PLACEMENT_COLUMNS)[number];

export const PLACEMENT_COLUMNS_NO_NAMES: ReadonlyArray<PlacementColumn> =
  PLACEMENT_COLUMNS.filter((c) => c !== 'First Name' && c !== 'Last Name');
