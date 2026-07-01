import test from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';

import { validate } from './validate.js';

const runMiddleware = (mw, req) =>
  new Promise((resolve) => {
    mw(req, {}, (err) => resolve(err ?? null));
  });

test('validate replaces req.body with parsed/typed data on success', async () => {
  const schema = z.object({
    age: z.coerce.number().int().min(0),
    name: z.string().min(1),
  });
  const req = { body: { age: '42', name: 'Karim' } };

  const err = await runMiddleware(validate({ body: schema }), req);

  assert.equal(err, null);
  assert.deepEqual(req.body, { age: 42, name: 'Karim' });
});

test('validate forwards a 400 AppError on invalid input', async () => {
  const schema = z.object({ email: z.string().email() });
  const req = { body: { email: 'not-an-email' } };

  const err = await runMiddleware(validate({ body: schema }), req);

  assert.ok(err, 'expected an error to be forwarded');
  assert.equal(err.statusCode, 400);
  assert.equal(err.code, 'BAD_REQUEST');
  assert.ok(err.details?.issues?.length, 'should expose a structured issues list');
  assert.equal(err.details.issues[0].path, 'email');
});

test('validate skips parts that have no schema', async () => {
  const req = { params: { id: 'leave-me-alone' } };
  const err = await runMiddleware(validate({}), req);
  assert.equal(err, null);
  assert.equal(req.params.id, 'leave-me-alone');
});
