import test from 'node:test';
import assert from 'node:assert/strict';

import { hashPassword, verifyPassword } from './password.js';

test('hashPassword produces a verifiable hash', async () => {
  const hash = await hashPassword('S3cret-Pass!');
  assert.notEqual(hash, 'S3cret-Pass!', 'hash must not equal plaintext');
  assert.ok(hash.startsWith('$2'), 'bcryptjs hash should start with $2');
  assert.equal(await verifyPassword('S3cret-Pass!', hash), true);
});

test('verifyPassword rejects wrong password', async () => {
  const hash = await hashPassword('right-password');
  assert.equal(await verifyPassword('wrong-password', hash), false);
});
