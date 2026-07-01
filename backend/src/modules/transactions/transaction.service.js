import { TXN_TYPES } from '../../shared/constants/transaction-types.js';
import { AppError } from '../../utils/app-error.js';
import * as productRepository from '../products/product.repository.js';
import * as txnRepository from './transaction.repository.js';

export const list = (query) => txnRepository.list(query);

export async function record(input, userId) {
  const product = await productRepository.findById(input.productId);
  if (!product || !product.isActive) {
    throw AppError.notFound('Product not found');
  }

  if (input.type === TXN_TYPES.OUT) {
    if (product.expiryDate && new Date(product.expiryDate) < new Date()) {
      throw AppError.badRequest('Cannot sell an expired product');
    }
    const stock = await txnRepository.currentStock(input.productId);
    if (input.quantity > stock) {
      throw AppError.conflict('Insufficient stock', { available: stock, requested: input.quantity });
    }
  }

  return txnRepository.insert({ ...input, userId });
}
