import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { projectValidation } from '../validations/project.validation';
import { validateRequest } from '../validations/auth.validation';

const router = Router();
const controller = new ProjectController();

router.get('/', authenticate, authorize('Super Admin', 'Admin', 'Manager'), controller.list.bind(controller));
router.post('/', authenticate, authorize('Super Admin', 'Admin', 'Manager'), projectValidation, validateRequest, controller.create.bind(controller));
router.put('/:id', authenticate, authorize('Super Admin', 'Admin', 'Manager'), projectValidation, validateRequest, controller.update.bind(controller));
router.delete('/:id', authenticate, authorize('Super Admin', 'Admin', 'Manager'), controller.remove.bind(controller));

export default router;
