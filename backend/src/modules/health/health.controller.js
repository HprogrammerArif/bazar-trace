import { asyncHandler } from '../../utils/async-handler.js';
import { ok } from '../../utils/response.js';
import * as healthService from './health.service.js';

export const getHealth = asyncHandler(async (_req, res) => {
  ok(res, await healthService.checkHealth());
});
