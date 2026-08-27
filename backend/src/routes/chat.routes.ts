import { Router } from 'express';
import multer from 'multer';
import { ChatController } from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth.middleware';

import { checkFeature } from '../middleware/setting.middleware';

const router = Router();
const controller = new ChatController();

// Multer memory storage configuration for receiving encrypted files
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB limit
  },
});

router.use(authenticate);
router.use(checkFeature('FEATURE_CHAT'));

router.get('/keys', controller.getGroupKeys.bind(controller));
router.post('/keys', controller.saveGroupKeys.bind(controller));
router.get('/groups', controller.getGroups.bind(controller));
router.post('/groups', controller.createGroup.bind(controller));
router.get('/history', controller.getChatHistory.bind(controller));
router.post('/upload', upload.single('file'), controller.uploadAttachment.bind(controller));

export default router;
