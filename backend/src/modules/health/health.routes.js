import { Router } from '../../api/v1/router-helper.js';
import * as healthController from './health.controller.js';

const router = Router();

router.get('/', healthController.getHealth);

export default router;
