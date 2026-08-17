import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
const controller = new UserController();

// Profile routes for authenticated users
router.get('/profile', authenticate, controller.getProfile.bind(controller));
router.put('/profile', authenticate, controller.updateProfile.bind(controller));
router.put('/change-password', authenticate, controller.changePassword.bind(controller));

// Only Admins can manage users/employees
router.get('/', authenticate, authorize('ADMIN'), controller.list.bind(controller));
router.post('/', authenticate, authorize('ADMIN'), controller.create.bind(controller));
router.put('/:id', authenticate, authorize('ADMIN'), controller.update.bind(controller));
router.delete('/:id', authenticate, authorize('ADMIN'), controller.remove.bind(controller));

export default router;
