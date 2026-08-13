import { Router } from 'express';
import { TaskController } from '../controllers/task.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { taskValidation } from '../validations/task.validation';
import { validateRequest } from '../validations/auth.validation';

const router = Router();
const controller = new TaskController();

router.get('/', authenticate, authorize('ADMIN', 'MANAGER', 'PROJECT_MANAGER', 'EMPLOYEE'), controller.list.bind(controller));
router.post('/', authenticate, authorize('ADMIN', 'MANAGER', 'PROJECT_MANAGER'), taskValidation, validateRequest, controller.create.bind(controller));
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER', 'PROJECT_MANAGER'), taskValidation, validateRequest, controller.update.bind(controller));
router.delete('/:id', authenticate, authorize('ADMIN', 'MANAGER', 'PROJECT_MANAGER'), controller.remove.bind(controller));

export default router;
