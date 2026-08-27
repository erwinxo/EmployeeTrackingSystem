import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

export function checkFeature(key: 'FEATURE_CHAT' | 'FEATURE_REPORTS' | 'FEATURE_TASKS') {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { key },
      });

      // Default to true if not found in database
      const isEnabled = setting ? setting.value : true;

      if (!isEnabled) {
        res.status(503).json({
          success: false,
          message: `This module has been temporarily disabled by an administrator`,
          data: null,
        });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
