import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { registerValidation, validateRequest } from '../validations/auth.validation';

const router = Router();
const authController = new AuthController();

router.post('/login', authController.login.bind(authController));
router.post('/register', registerValidation, validateRequest, authController.register.bind(authController));
router.post('/refresh-token', authController.refreshToken.bind(authController));

export default router;
