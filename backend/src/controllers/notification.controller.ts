import { Request, Response } from 'express';
import webpush from 'web-push';
import prisma from '../lib/prisma';
import { successResponse } from '../utils/response';
import logger from '../config/logger';

// VAPID keys setup (loads from environment, auto-generates in-memory fallback)
let vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || '',
  privateKey: process.env.VAPID_PRIVATE_KEY || '',
};

if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
  try {
    const generated = webpush.generateVAPIDKeys();
    vapidKeys = {
      publicKey: generated.publicKey,
      privateKey: generated.privateKey,
    };
    logger.info('Auto-generated temporary VAPID keys for Web Push');
    logger.info(`VAPID Public Key: ${vapidKeys.publicKey}`);
  } catch (err) {
    logger.error('Failed to generate VAPID keys:', err);
  }
}

// Set Web Push configuration
if (vapidKeys.publicKey && vapidKeys.privateKey) {
  webpush.setVapidDetails(
    'mailto:admin@thinkcove.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
}

export class NotificationController {
  // 1. Get current public VAPID key
  async getVapidPublicKey(req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json(successResponse('VAPID public key retrieved', {
        publicKey: vapidKeys.publicKey,
      }));
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to retrieve VAPID key', data: null, errors: [(error as Error).message] });
    }
  }

  // 2. Subscribe to Web Push notifications
  async subscribe(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized', data: null, errors: ['User not authenticated'] });
        return;
      }

      const { subscription } = req.body;
      if (!subscription || !subscription.endpoint || !subscription.keys) {
        res.status(400).json({ success: false, message: 'Invalid subscription payload', data: null, errors: ['Subscription details are required'] });
        return;
      }

      const sub = await prisma.pushSubscription.upsert({
        where: { userId },
        update: {
          endpoint: subscription.endpoint,
          auth: subscription.keys.auth,
          p256dh: subscription.keys.p256dh,
        },
        create: {
          userId,
          endpoint: subscription.endpoint,
          auth: subscription.keys.auth,
          p256dh: subscription.keys.p256dh,
        },
      });

      res.status(200).json(successResponse('Web Push subscription registered successfully', sub));
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to register subscription', data: null, errors: [(error as Error).message] });
    }
  }

  // 3. Toggle user notification preference
  async togglePushPreferences(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized', data: null, errors: ['User not authenticated'] });
        return;
      }

      const { pushEnabled } = req.body;
      if (typeof pushEnabled !== 'boolean') {
        res.status(400).json({ success: false, message: 'pushEnabled boolean parameter is required', data: null, errors: ['Invalid parameter type'] });
        return;
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { pushEnabled },
      });

      res.status(200).json(successResponse('Notification preferences updated successfully', {
        pushEnabled: updatedUser.pushEnabled,
      }));
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update preferences', data: null, errors: [(error as Error).message] });
    }
  }
}

// Dispatch notification utility (called by socket broadcast server)
export async function sendPushNotification(recipientId: string, payload: { title: string; body: string; data?: any }) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { pushEnabled: true },
    });

    if (!user || !user.pushEnabled) {
      return; // Recipient turned off notifications or does not exist
    }

    const sub = await prisma.pushSubscription.findUnique({
      where: { userId: recipientId },
    });

    if (!sub) {
      return; // Recipient not subscribed to push
    }

    // Call webpush client
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: {
          auth: sub.auth,
          p256dh: sub.p256dh,
        },
      },
      JSON.stringify(payload)
    );
    logger.info(`Web Push notification dispatched successfully to user ID: ${recipientId}`);
  } catch (err) {
    logger.error(`Failed to dispatch web push to user ID ${recipientId}:`, err);
  }
}
