import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import type { PrismaClient } from '@prisma/client';
import { checkRoleOnce, resetRoleCheckForTests } from './boot-check.js';

const clientAs = (row: { rolsuper: boolean; rolbypassrls: boolean }) =>
  ({ $queryRaw: async () => [{ rolname: 'r', ...row }] }) as unknown as PrismaClient;

beforeEach(() => resetRoleCheckForTests());

test('production exits when the role bypasses RLS', async () => {
  const codes: number[] = [];
  await checkRoleOnce(clientAs({ rolsuper: false, rolbypassrls: true }), { APP_ENV: 'production' }, (c) => void codes.push(c));
  assert.deepEqual(codes, [1]);
});

test('production keeps running as a role RLS applies to', async () => {
  const codes: number[] = [];
  await checkRoleOnce(clientAs({ rolsuper: false, rolbypassrls: false }), { APP_ENV: 'production' }, (c) => void codes.push(c));
  assert.deepEqual(codes, []);
});

test('outside production the check does not run', async () => {
  const codes: number[] = [];
  await checkRoleOnce(clientAs({ rolsuper: true, rolbypassrls: true }), {}, (c) => void codes.push(c));
  assert.deepEqual(codes, []);
});
