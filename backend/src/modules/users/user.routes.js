import { Router } from '../../api/v1/router-helper.js';
import { authGuard } from '../../middlewares/auth-guard.js';
import { roleGuard } from '../../middlewares/role-guard.js';
import { validate } from '../../middlewares/validate.js';
import { ROLES } from '../../shared/constants/roles.js';
import * as userController from './user.controller.js';
import { updateUserSchema, userIdParam } from './user.schema.js';

const router = Router();

router.use(authGuard, roleGuard(ROLES.ADMIN));

router.get('/', userController.list);
router.get('/:id', validate({ params: userIdParam }), userController.get);
router.patch(
  '/:id',
  validate({ params: userIdParam, body: updateUserSchema }),
  userController.update,
);

export default router;
