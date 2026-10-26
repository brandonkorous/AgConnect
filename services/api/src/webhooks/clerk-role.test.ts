import { test } from 'node:test';
import assert from 'node:assert/strict';
import { UserRole } from '@agconn/db';
import { deriveRoleFromEvent } from './clerk.js';

test('a user cannot make themselves admin through unsafe_metadata', () => {
  assert.equal(deriveRoleFromEvent({ unsafe_metadata: { role: 'admin' } }), UserRole.worker);
});

test('self-declared worker, employer and training_org roles are kept', () => {
  for (const role of ['worker', 'employer', 'training_org']) {
    assert.equal(deriveRoleFromEvent({ unsafe_metadata: { role } }), role);
  }
});

test('admin set by the server in public_metadata is kept', () => {
  const data = { public_metadata: { role: 'admin' }, unsafe_metadata: { role: 'worker' } };
  assert.equal(deriveRoleFromEvent(data), UserRole.admin);
});
