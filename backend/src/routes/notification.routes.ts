import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const controller = new NotificationController();

router.use(authenticate);

router.get('/vapid-public-key', controller.getVapidPublicKey.bind(controller));
router.post('/subscribe', controller.subscribe.bind(controller));
router.put('/preferences', controller.togglePushPreferences.bind(controller));

export default router;
