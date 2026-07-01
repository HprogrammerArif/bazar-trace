import { asyncHandler } from '../../utils/async-handler.js';
import { ok } from '../../utils/response.js';
import * as analyticsService from './analytics.service.js';

export const dashboard = asyncHandler(async (_req, res) => {
  ok(res, await analyticsService.dashboard());
});

export const profitLoss = asyncHandler(async (req, res) => {
  const result = await analyticsService.profitLoss(req.query);
  ok(res, result);
});
