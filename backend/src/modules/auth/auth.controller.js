import { asyncHandler } from '../../utils/async-handler.js';
import { created, ok } from '../../utils/response.js';
import * as authService from './auth.service.js';

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  ok(res, result);
});

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  created(res, result);
});

export const me = asyncHandler(async (req, res) => {
  const user = await authService.me(req.user.id);
  ok(res, user);
});

export const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user.id, req.body);
  ok(res, { message: 'Password changed successfully' });
});
