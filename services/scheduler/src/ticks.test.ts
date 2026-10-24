import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getRlsContext } from '@agconn/db';
import { trainingReminderTick } from './training-reminder-tick.js';
import { savedSearchTick } from './saved-search-tick.js';

const NOW = Date.parse('2026-10-24T08:00:00Z');

const program = {
  titleEn: 'Pesticide safety',
  locationName: null,
  county: 'Fresno',
  startDate: new Date(NOW + 2 * 60 * 60 * 1000),
  sessionTimes: [],
};

function trainingDeps(roles: (string | undefined)[], sent: unknown[]) {
  const findMany = async (args: { where: { program: { startDate: { gte: Date } } } }) => {
    roles.push(getRlsContext()?.role);
    const in2h = args.where.program.startDate.gte.getTime() < NOW + 3 * 60 * 60 * 1000;
    return in2h ? [{ id: 'e1', tenantId: 't1', workerId: 'w1', program }] : [];
  };
  const enqueue = async (job: unknown) => (sent.push(job), 'job-1');
  return { db: { enrollment: { findMany } }, enqueue } as never;
}

test('training reminder tick queries as the service role', async () => {
  const roles: (string | undefined)[] = [];
  const sent: unknown[] = [];
  await trainingReminderTick(trainingDeps(roles, sent), NOW);
  assert.deepEqual(roles, ['service', 'service']);
});

test('an enrollment starting in ~2h gets one reminder', async () => {
  const sent: { template: string; jobKey: string }[] = [];
  await trainingReminderTick(trainingDeps([], sent), NOW);
  assert.equal(sent.length, 1);
  assert.equal(sent[0]?.template, 'training.reminder.2h');
  assert.equal(sent[0]?.jobKey, 'training.reminder.2h-e1');
});

test('saved search tick queries and updates as the service role', async () => {
  const roles: (string | undefined)[] = [];
  const role = () => roles.push(getRlsContext()?.role);
  const search = { id: 's1', workerId: 'w1', lastNotifiedAt: null, filters: {} };
  const job = {
    id: 'j1', tenantId: 't1', titleEn: 'Pruner', county: 'Kern',
    wageMin: 18, wageMax: 21, seoSlug: 'pruner-kern',
  };
  const db = {
    savedSearch: { findMany: async () => (role(), [search]), update: async () => role() },
    jobPosting: { findFirst: async () => (role(), job) },
  };
  const sent: unknown[] = [];
  await savedSearchTick({ db, enqueue: async (j: unknown) => (sent.push(j), 'x') } as never);
  assert.deepEqual(roles, ['service', 'service', 'service']);
  assert.equal(sent.length, 1);
});
