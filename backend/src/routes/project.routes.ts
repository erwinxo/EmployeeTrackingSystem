import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { projectValidation } from '../validations/project.validation';
import { validateRequest } from '../validations/auth.validation';

const router = Router();
const controller = new ProjectController();

router.get('/', authenticate, authorize('ADMIN', 'MANAGER', 'PROJECT_MANAGER'), controller.list.bind(controller));
router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), projectValidation, validateRequest, controller.create.bind(controller));
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER'), projectValidation, validateRequest, controller.update.bind(controller));
router.delete('/:id', authenticate, authorize('ADMIN', 'MANAGER'), controller.remove.bind(controller));

export default router;
