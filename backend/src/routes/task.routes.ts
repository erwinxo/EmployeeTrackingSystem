import { Router } from 'express';
import { TaskController } from '../controllers/task.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { taskValidation } from '../validations/task.validation';
import { validateRequest } from '../validations/auth.validation';

import { checkFeature } from '../middleware/setting.middleware';

const router = Router();
const controller = new TaskController();

router.use(authenticate);
router.use(checkFeature('FEATURE_TASKS'));

router.get('/', authorize('ADMIN', 'MANAGER', 'PROJECT_MANAGER', 'EMPLOYEE'), controller.list.bind(controller));
router.post('/', authorize('ADMIN', 'MANAGER', 'PROJECT_MANAGER'), taskValidation, validateRequest, controller.create.bind(controller));
router.put('/:id', authorize('ADMIN', 'MANAGER', 'PROJECT_MANAGER'), taskValidation, validateRequest, controller.update.bind(controller));
router.delete('/:id', authorize('ADMIN', 'MANAGER', 'PROJECT_MANAGER'), controller.remove.bind(controller));

export default router;
