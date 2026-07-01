import { AppError } from '../../utils/app-error.js';
import * as productRepository from './product.repository.js';

export const list = (query) => productRepository.list(query);

export async function get(id) {
  const product = await productRepository.findById(id);
  if (!product) throw AppError.notFound('Product not found');
  return product;
}

export async function getByBarcode(barcode) {
  const product = await productRepository.findByBarcode(barcode);
  if (!product) throw AppError.notFound('Product not found for that barcode');
  return product;
}

export function create(input, userId) {
  if (input.sellPrice < input.costPrice) {
    // Not blocking — just a soft warning would happen elsewhere; rule here is structural only.
  }
  return productRepository.insert(input, userId);
}

export async function update(id, patch) {
  await get(id);
  return productRepository.update(id, patch);
}

export async function remove(id) {
  await get(id);
  return productRepository.softDelete(id);
}
