import { Router } from 'express';
import { TaskController } from '../controllers/task.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { taskValidation } from '../validations/task.validation';
import { validateRequest } from '../validations/auth.validation';

const router = Router();
const controller = new TaskController();

router.get('/', authenticate, authorize('Super Admin', 'Admin', 'Manager', 'Team Lead', 'Employee'), controller.list.bind(controller));
router.post('/', authenticate, authorize('Super Admin', 'Admin', 'Manager', 'Team Lead'), taskValidation, validateRequest, controller.create.bind(controller));
router.put('/:id', authenticate, authorize('Super Admin', 'Admin', 'Manager', 'Team Lead'), taskValidation, validateRequest, controller.update.bind(controller));
router.delete('/:id', authenticate, authorize('Super Admin', 'Admin', 'Manager', 'Team Lead'), controller.remove.bind(controller));

export default router;
