import { Router } from '../router-helper.js';
import analyticsRoutes from '../../../modules/analytics/analytics.routes.js';
import authRoutes from '../../../modules/auth/auth.routes.js';
import healthRoutes from '../../../modules/health/health.routes.js';
import productRoutes from '../../../modules/products/product.routes.js';
import transactionRoutes from '../../../modules/transactions/transaction.routes.js';
import userRoutes from '../../../modules/users/user.routes.js';

const router = Router();

router.use('/health',        healthRoutes);
router.use('/auth',          authRoutes);
router.use('/users',         userRoutes);
router.use('/products',      productRoutes);
router.use('/transactions',  transactionRoutes);
router.use('/analytics',     analyticsRoutes);

export default router;
