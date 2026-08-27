import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { checkFeature } from '../middleware/setting.middleware';

const router = Router();
const controller = new ReportController();

router.get('/summary', authenticate, authorize('ADMIN', 'MANAGER', 'PROJECT_MANAGER'), checkFeature('FEATURE_REPORTS'), controller.generate.bind(controller));
router.get('/export', authenticate, authorize('ADMIN', 'MANAGER', 'PROJECT_MANAGER'), checkFeature('FEATURE_REPORTS'), controller.exportReport.bind(controller));

export default router;
