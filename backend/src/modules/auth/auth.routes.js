import { Router } from '../../api/v1/router-helper.js';
import { authGuard } from '../../middlewares/auth-guard.js';
import { roleGuard } from '../../middlewares/role-guard.js';
import { validate } from '../../middlewares/validate.js';
import { ROLES } from '../../shared/constants/roles.js';
import * as authController from './auth.controller.js';
import { loginSchema, registerSchema, changePasswordSchema } from './auth.schema.js';

const router = Router();

router.post('/login', validate({ body: loginSchema }), authController.login);

// Only an admin can mint new accounts (staff or another admin)
router.post(
  '/register',
  authGuard,
  roleGuard(ROLES.ADMIN),
  validate({ body: registerSchema }),
  authController.register,
);

router.get('/me', authGuard, authController.me);

router.patch(
  '/password',
  authGuard,
  validate({ body: changePasswordSchema }),
  authController.changePassword,
);

export default router;
