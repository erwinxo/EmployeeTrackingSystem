import { Request, Response } from 'express';
import { successResponse } from '../utils/response';
import prisma from '../lib/prisma';

export class UserKeyController {
  async savePrivateKeyBackup(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized', data: null });
        return;
      }

      const { encryptedPrivateKey, iv, salt } = req.body;
      if (!encryptedPrivateKey || !iv || !salt) {
        res.status(400).json({ success: false, message: 'Missing backup payload fields', data: null });
        return;
      }

      const backup = await prisma.userPrivateKeyBackup.upsert({
        where: { userId },
        update: {
          encryptedPrivateKey,
          iv,
          salt,
        },
        create: {
          userId,
          encryptedPrivateKey,
          iv,
          salt,
        },
      });

      res.status(200).json(successResponse('Private key backup saved successfully', backup));
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to save private key backup', data: null, errors: [(error as Error).message] });
    }
  }

  async getPrivateKeyBackup(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized', data: null });
        return;
      }

      const backup = await prisma.userPrivateKeyBackup.findUnique({
        where: { userId },
      });

      if (!backup) {
        res.status(404).json({ success: false, message: 'No private key backup found for this user', data: null });
        return;
      }

      res.status(200).json(successResponse('Private key backup retrieved successfully', backup));
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to retrieve private key backup', data: null, errors: [(error as Error).message] });
    }
  }
}
