import { asyncHandler } from '../../utils/async-handler.js';
import { created, ok } from '../../utils/response.js';
import * as txnService from './transaction.service.js';

export const list = asyncHandler(async (req, res) => {
  ok(res, await txnService.list(req.query));
});

export const create = asyncHandler(async (req, res) => {
  const txn = await txnService.record(req.body, req.user.id);
  created(res, txn);
});
