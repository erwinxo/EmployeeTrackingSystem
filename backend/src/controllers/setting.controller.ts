import { Request, Response } from 'express';
import { successResponse } from '../utils/response';
import prisma from '../lib/prisma';

export class SettingController {
  async getFeatures(req: Request, res: Response): Promise<void> {
    try {
      const dbSettings = await prisma.systemSetting.findMany();
      
      // Default all features to true if not explicitly configured in DB
      const features = {
        FEATURE_CHAT: true,
        FEATURE_REPORTS: true,
        FEATURE_TASKS: true,
      };

      dbSettings.forEach((setting) => {
        if (setting.key in features) {
          features[setting.key as keyof typeof features] = setting.value;
        }
      });

      res.status(200).json(successResponse('Feature settings retrieved successfully', features));
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to retrieve feature settings', data: null, errors: [(error as Error).message] });
    }
  }

  async updateFeature(req: Request, res: Response): Promise<void> {
    try {
      const { key, value } = req.body;
      if (!key || typeof value !== 'boolean') {
        res.status(400).json({ success: false, message: 'Invalid key or value parameter', data: null });
        return;
      }

      // Ensure key is one of the valid modules
      const validKeys = ['FEATURE_CHAT', 'FEATURE_REPORTS', 'FEATURE_TASKS'];
      if (!validKeys.includes(key)) {
        res.status(400).json({ success: false, message: 'Invalid feature flag key', data: null });
        return;
      }

      const updated = await prisma.systemSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });

      // Broadcast update to all connected WebSocket clients in real-time
      try {
        const { socketIO } = require('../socket');
        if (socketIO) {
          socketIO.emit('feature_flag_update', { key, value });
        }
      } catch (err) {
        console.error('Failed to broadcast setting update via WebSocket:', err);
      }

      res.status(200).json(successResponse(`Feature ${key} updated successfully`, updated));
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update feature setting', data: null, errors: [(error as Error).message] });
    }
  }
}
