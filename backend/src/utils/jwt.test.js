import test from 'node:test';
import assert from 'node:assert/strict';

import { signToken, verifyToken } from './jwt.js';

test('signToken / verifyToken round trip preserves the claims', () => {
  const token = signToken({ sub: 42, role: 'ADMIN', email: 'a@b.c' });
  const decoded = verifyToken(token);
  assert.equal(decoded.sub, 42);
  assert.equal(decoded.role, 'ADMIN');
  assert.equal(decoded.email, 'a@b.c');
});

test('verifyToken rejects a tampered signature', () => {
  const token = signToken({ sub: 1 });
  // Flip a character in the signature segment
  const segs = token.split('.');
  segs[2] = segs[2].slice(0, -1) + (segs[2].slice(-1) === 'A' ? 'B' : 'A');
  const tampered = segs.join('.');
  assert.throws(() => verifyToken(tampered));
});

test('verifyToken rejects total garbage', () => {
  assert.throws(() => verifyToken('not.a.token'));
});
