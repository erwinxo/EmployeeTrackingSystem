import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
const controller = new UserController();

// Only Admins can manage users/employees
router.get('/', authenticate, authorize('ADMIN'), controller.list.bind(controller));
router.post('/', authenticate, authorize('ADMIN'), controller.create.bind(controller));
router.put('/:id', authenticate, authorize('ADMIN'), controller.update.bind(controller));
router.delete('/:id', authenticate, authorize('ADMIN'), controller.remove.bind(controller));

export default router;
