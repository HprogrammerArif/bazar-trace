import * as analyticsRepository from './analytics.repository.js';

export async function dashboard() {
  const [counts, sales, expiring, lowStock] = await Promise.all([
    analyticsRepository.counts(),
    analyticsRepository.dailySales(7),
    analyticsRepository.expiringProducts(14),
    analyticsRepository.lowStockProducts(),
  ]);
  return { counts, sales, expiring, lowStock };
}

export async function profitLoss(filters) {
  return analyticsRepository.profitLoss(filters);
}
