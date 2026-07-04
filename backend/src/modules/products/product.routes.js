import { Router } from '../../api/v1/router-helper.js';
import { authGuard } from '../../middlewares/auth-guard.js';
import { roleGuard } from '../../middlewares/role-guard.js';
import { validate } from '../../middlewares/validate.js';
import { ROLES } from '../../shared/constants/roles.js';
import * as productController from './product.controller.js';
import {
  barcodeParam,
  createProductSchema,
  listQuery,
  productIdParam,
  updateProductSchema,
} from './product.schema.js';

const router = Router();

router.use(authGuard);

router.get('/', validate({ query: listQuery }), productController.list);
router.get('/barcode/:barcode', validate({ params: barcodeParam }), productController.getByBarcode);
router.get('/:id', validate({ params: productIdParam }), productController.get);

router.post(
  '/',
  roleGuard(ROLES.ADMIN, ROLES.STAFF),
  validate({ body: createProductSchema }),
  productController.create,
);

router.patch(
  '/:id',
  roleGuard(ROLES.ADMIN, ROLES.STAFF),
  validate({ params: productIdParam, body: updateProductSchema }),
  productController.update,
);

router.delete(
  '/:id',
  roleGuard(ROLES.ADMIN),
  validate({ params: productIdParam }),
  productController.remove,
);

export default router;
