import { Router } from 'express';
import { RequirementController } from '../controllers/requirement.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { requirementValidation } from '../validations/requirement.validation';
import { validateRequest } from '../validations/auth.validation';

const router = Router();
const controller = new RequirementController();

router.get('/', authenticate, authorize('ADMIN', 'MANAGER'), controller.list.bind(controller));
router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), requirementValidation, validateRequest, controller.create.bind(controller));
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER'), requirementValidation, validateRequest, controller.update.bind(controller));
router.delete('/:id', authenticate, authorize('ADMIN', 'MANAGER'), controller.remove.bind(controller));

export default router;
