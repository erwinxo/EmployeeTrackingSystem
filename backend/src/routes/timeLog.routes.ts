import { Router } from 'express';
import { TimeLogController } from '../controllers/timeLog.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { timeLogValidation } from '../validations/timeLog.validation';
import { validateRequest } from '../validations/auth.validation';

const router = Router();
const controller = new TimeLogController();

router.post('/', authenticate, timeLogValidation, validateRequest, controller.logStatusChange.bind(controller));
router.get('/today', authenticate, controller.getTodayLogs.bind(controller));
router.get('/users', authenticate, authorize('ADMIN', 'MANAGER', 'PROJECT_MANAGER'), controller.getAllUsersStatus.bind(controller));
router.get('/feed', authenticate, authorize('ADMIN', 'MANAGER', 'PROJECT_MANAGER'), controller.getTodayActivityFeed.bind(controller));
router.get('/stats', authenticate, controller.getUserStats.bind(controller));

export default router;
