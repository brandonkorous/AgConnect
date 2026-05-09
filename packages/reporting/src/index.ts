export { participantId, ParticipantPepperMissingError } from './anonymize.js';
export { toCsv, type CsvCell, type CsvOptions } from './csv.js';
export { toXlsx, type XlsxOptions } from './xlsx.js';
export {
  PLACEMENT_COLUMNS,
  PLACEMENT_COLUMNS_NO_NAMES,
  type PlacementColumn,
} from './placement-fields.js';

export const FORMAT_MIME = {
  csv: 'text/csv; charset=utf-8',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
} as const;

export type ReportFormat = keyof typeof FORMAT_MIME;
