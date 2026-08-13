import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
const controller = new ReportController();

router.get('/summary', authenticate, authorize('ADMIN', 'MANAGER'), controller.generate.bind(controller));

export default router;
