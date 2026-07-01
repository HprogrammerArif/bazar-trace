import { asyncHandler } from '../../utils/async-handler.js';
import { ok } from '../../utils/response.js';
import * as userService from './user.service.js';

export const list = asyncHandler(async (_req, res) => {
  ok(res, await userService.list());
});

export const get = asyncHandler(async (req, res) => {
  ok(res, await userService.get(req.params.id));
});

export const update = asyncHandler(async (req, res) => {
  ok(res, await userService.update(req.params.id, req.body));
});
