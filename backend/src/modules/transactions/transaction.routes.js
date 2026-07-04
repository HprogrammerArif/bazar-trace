import { Router } from '../../api/v1/router-helper.js';
import { authGuard } from '../../middlewares/auth-guard.js';
import { validate } from '../../middlewares/validate.js';
import * as txnController from './transaction.controller.js';
import { createTxnSchema, listQuery } from './transaction.schema.js';

const router = Router();

router.use(authGuard);

router.get('/', validate({ query: listQuery }), txnController.list);
router.post('/', validate({ body: createTxnSchema }), txnController.create);

export default router;
