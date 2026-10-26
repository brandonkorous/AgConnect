import type { RlsContext } from '../rls.js';
import { AUDIT_ACTOR, ROW, TENANT, USER } from './fixture-ids.js';

// Each fixture row, by the label the expectations use.
export const TABLES: Record<string, { key: string; rows: Record<string, string> }> = {
  tenants: { key: 'id', rows: { A: TENANT.A, B: TENANT.B } },
  users: { key: 'id', rows: { workerA: USER.workerA, employerA: USER.employerA, workerB: USER.workerB, employerB: USER.employerB } },
  employer_profiles: { key: 'id', rows: { A: ROW.profileA, B: ROW.profileB } },
  employer_contacts: { key: 'id', rows: { A: ROW.contactA, B: ROW.contactB } },
  job_postings: { key: 'id', rows: { A: ROW.jobA, B: ROW.jobB, draftA: ROW.draftA, closedA: ROW.closedA } },
  applications: { key: 'id', rows: { A: ROW.appA, B: ROW.appB, closedA: ROW.appClosedA } },
  worker_profiles: { key: 'id', rows: { workerA: USER.workerA, workerB: USER.workerB } },
  conversations: { key: 'id', rows: { A: ROW.convA, B: ROW.convB } },
  conversation_participants: { key: 'id', rows: { workerA: ROW.cpWorkerA, employerA: ROW.cpEmployerA, workerB: ROW.cpWorkerB } },
  messages: { key: 'id', rows: { A: ROW.msgA, B: ROW.msgB } },
  shifts: { key: 'id', rows: { A: ROW.shiftA, B: ROW.shiftB } },
  shift_assignments: { key: 'id', rows: { A: ROW.assignA, B: ROW.assignB } },
  email_log: { key: 'id', rows: { A: ROW.emailA, B: ROW.emailB } },
  sms_log: { key: 'id', rows: { A: ROW.smsA, B: ROW.smsB } },
  audit_events: { key: 'actor_id', rows: { A: AUDIT_ACTOR.A, B: AUDIT_ACTOR.B } },
};

type Seen = Partial<Record<keyof typeof TABLES, string[]>>;

const ALL: Seen = Object.fromEntries(Object.entries(TABLES).map(([t, s]) => [t, Object.keys(s.rows)]));
const MARKETPLACE = ['A', 'B'];
// Employers with an active posting are public (employer_profiles_listed_read).
const LISTED = ['A', 'B'];

// service and webhook are cross-tenant by design on most tables; the exceptions are tenant-scoped.
const SERVICE_WIDE: Seen = {
  ...ALL, tenants: [], audit_events: [], email_log: ['A'],
};

export interface Scenario { name: string; ctx: RlsContext | null; sees: Seen }

export const SCENARIOS: Scenario[] = [
  { name: 'no RLS context', ctx: null, sees: {} },
  { name: 'anonymous', ctx: { role: 'anonymous' }, sees: { job_postings: MARKETPLACE, employer_profiles: LISTED } },
  {
    name: 'authenticated worker A',
    ctx: { role: 'authenticated', userId: USER.workerA, tenantId: TENANT.A },
    sees: {
      tenants: ['A'], users: ['workerA', 'employerA'], employer_profiles: LISTED,
      job_postings: [...MARKETPLACE, 'closedA'], applications: ['A', 'closedA'], worker_profiles: ['workerA'],
      conversations: ['A'], conversation_participants: ['workerA'],
      messages: ['A'], shifts: ['A'], shift_assignments: ['A'], sms_log: ['A'],
    },
  },
  {
    name: 'authenticated employer A',
    ctx: { role: 'authenticated', userId: USER.employerA, tenantId: TENANT.A, employerId: ROW.profileA },
    sees: {
      tenants: ['A'], users: ['employerA', 'workerA'], employer_profiles: LISTED, employer_contacts: ['A'],
      job_postings: ['A', 'B', 'draftA', 'closedA'], applications: ['A', 'closedA'],
      worker_profiles: ['workerA'], conversations: ['A'],
      conversation_participants: ['workerA', 'employerA'], messages: ['A'], shifts: ['A'],
      shift_assignments: ['A'],
    },
  },
  {
    name: 'authenticated with no tenant',
    ctx: { role: 'authenticated', userId: USER.noTenant },
    sees: { job_postings: MARKETPLACE, employer_profiles: LISTED },
  },
  { name: 'service in tenant A', ctx: { role: 'service', tenantId: TENANT.A }, sees: SERVICE_WIDE },
  { name: 'service with no tenant', ctx: { role: 'service' }, sees: { ...SERVICE_WIDE, email_log: [] } },
  { name: 'webhook', ctx: { role: 'webhook' }, sees: { ...SERVICE_WIDE, email_log: ['A', 'B'] } },
  { name: 'admin', ctx: { role: 'admin' }, sees: ALL },
  { name: 'system', ctx: { role: 'system' }, sees: { sms_log: ['A', 'B'] } },
  { name: 'audit_redact', ctx: { role: 'audit_redact' }, sees: { audit_events: ['A', 'B'] } },
  { name: 'audit_purge', ctx: { role: 'audit_purge' }, sees: { audit_events: ['A', 'B'] } },
];
