import { Router } from 'express';
import { SettingController } from '../controllers/setting.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
const controller = new SettingController();

router.get('/features', authenticate, controller.getFeatures.bind(controller));
router.put('/features', authenticate, authorize('SUPER_ADMIN'), controller.updateFeature.bind(controller));

export default router;
