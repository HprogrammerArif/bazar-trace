import { Router } from '../../api/v1/router-helper.js';
import { authGuard } from '../../middlewares/auth-guard.js';
import * as analyticsController from './analytics.controller.js';

const router = Router();

router.use(authGuard);

router.get('/dashboard', analyticsController.dashboard);
router.get('/profit-loss', analyticsController.profitLoss);

export default router;
