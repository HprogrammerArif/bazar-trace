import { asyncHandler } from '../../utils/async-handler.js';
import { created, noContent, ok } from '../../utils/response.js';
import * as productService from './product.service.js';

export const list = asyncHandler(async (req, res) => {
  ok(res, await productService.list(req.query));
});

export const get = asyncHandler(async (req, res) => {
  ok(res, await productService.get(req.params.id));
});

export const getByBarcode = asyncHandler(async (req, res) => {
  ok(res, await productService.getByBarcode(req.params.barcode));
});

export const create = asyncHandler(async (req, res) => {
  created(res, await productService.create(req.body, req.user.id));
});

export const update = asyncHandler(async (req, res) => {
  ok(res, await productService.update(req.params.id, req.body));
});

export const remove = asyncHandler(async (req, res) => {
  await productService.remove(req.params.id);
  noContent(res);
});
