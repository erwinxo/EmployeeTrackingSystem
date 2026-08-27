import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { UserKeyController } from '../controllers/userKey.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
const controller = new UserController();
const keyController = new UserKeyController();

// Profile routes for authenticated users
router.get('/profile', authenticate, controller.getProfile.bind(controller));
router.put('/profile', authenticate, controller.updateProfile.bind(controller));
router.put('/change-password', authenticate, controller.changePassword.bind(controller));
router.post('/public-key', authenticate, controller.savePublicKey.bind(controller));
router.get('/:id/public-key', authenticate, controller.getPublicKey.bind(controller));

// E2EE Private Key Backup & Recovery routes
router.post('/private-key-backup', authenticate, keyController.savePrivateKeyBackup.bind(keyController));
router.get('/private-key-backup', authenticate, keyController.getPrivateKeyBackup.bind(keyController));

// Only Admins can manage users/employees
router.get('/', authenticate, authorize('ADMIN', 'MANAGER', 'PROJECT_MANAGER'), controller.list.bind(controller));
router.post('/', authenticate, authorize('ADMIN'), controller.create.bind(controller));
router.put('/:id', authenticate, authorize('ADMIN'), controller.update.bind(controller));
router.delete('/:id', authenticate, authorize('ADMIN'), controller.remove.bind(controller));

export default router;
