import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import prisma from '../lib/prisma';
import { successResponse } from '../utils/response';
import logger from '../config/logger';
import { env } from '../config/env';

// Configure Cloudinary
cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
});

export class ChatController {
  // 1. Get encrypted group keys for the logged-in user
  async getGroupKeys(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized', data: null, errors: ['User not authenticated'] });
        return;
      }

      const keys = await prisma.groupKey.findMany({
        where: { userId },
      });

      res.status(200).json(successResponse('Group keys retrieved successfully', keys));
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to retrieve group keys', data: null, errors: [(error as Error).message] });
    }
  }

  // 2. Save group keys for users in a group
  async saveGroupKeys(req: Request, res: Response): Promise<void> {
    try {
      const { groupId, keys } = req.body; // keys: Array of { userId, encryptedKey, iv }
      if (!groupId || !Array.isArray(keys)) {
        res.status(400).json({ success: false, message: 'Invalid payload', data: null, errors: ['groupId and keys list are required'] });
        return;
      }

      const upsertOperations = keys.map((keyData: { userId: string; encryptedKey: string; iv: string }) =>
        prisma.groupKey.upsert({
          where: {
            groupId_userId: {
              groupId,
              userId: keyData.userId,
            },
          },
          update: {
            encryptedKey: keyData.encryptedKey,
            iv: keyData.iv,
          },
          create: {
            groupId,
            userId: keyData.userId,
            encryptedKey: keyData.encryptedKey,
            iv: keyData.iv,
          },
        })
      );

      await Promise.all(upsertOperations);
      res.status(200).json(successResponse('Group keys saved successfully', null));
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to save group keys', data: null, errors: [(error as Error).message] });
    }
  }

  // 3. Get message groups the user is authorized to join
  async getGroups(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      const userRole = req.user?.role;
      if (!userId || !userRole) {
        res.status(401).json({ success: false, message: 'Unauthorized', data: null, errors: ['User not authenticated'] });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found', data: null, errors: ['User does not exist'] });
        return;
      }

      // Fetch groups that are either public to the user's role, their project, or have a direct key mapped to them
      const userGroupKeys = await prisma.groupKey.findMany({
        where: { userId },
        select: { groupId: true },
      });
      const customGroupIds = userGroupKeys.map(k => k.groupId);

      const orClause: any[] = [
        { role: userRole },
        { id: { in: customGroupIds } },
      ];

      if (user.projectId) {
        orClause.push({ projectId: user.projectId });
      }

      const groups = await prisma.messageGroup.findMany({
        where: {
          OR: orClause,
        },
      });

      res.status(200).json(successResponse('Authorized groups retrieved successfully', groups));
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to retrieve groups', data: null, errors: [(error as Error).message] });
    }
  }

  // 4. Create a new message group
  async createGroup(req: Request, res: Response): Promise<void> {
    try {
      const { name, role, projectId } = req.body;
      if (!name) {
        res.status(400).json({ success: false, message: 'Group name is required', data: null, errors: ['Name parameter is missing'] });
        return;
      }

      const group = await prisma.messageGroup.create({
        data: {
          name,
          role: role || null,
          projectId: projectId || null,
        },
      });

      res.status(201).json(successResponse('Group created successfully', group));
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to create group', data: null, errors: [(error as Error).message] });
    }
  }

  // 5. Retrieve chat history between two users or from a group
  async getChatHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      const userRole = req.user?.role;
      if (!userId || !userRole) {
        res.status(401).json({ success: false, message: 'Unauthorized', data: null, errors: ['User not authenticated'] });
        return;
      }

      const { recipientId, groupId } = req.query;

      let whereClause: any = {};
      if (recipientId) {
        whereClause = {
          OR: [
            { senderId: userId, recipientId: recipientId as string },
            { senderId: recipientId as string, recipientId: userId },
          ],
        };
      } else if (groupId) {
        // Validate user authorization to this group
        const userGroupKeys = await prisma.groupKey.findMany({
          where: { userId },
          select: { groupId: true },
        });
        const customGroupIds = userGroupKeys.map(k => k.groupId);

        const userObj = await prisma.user.findUnique({ where: { id: userId } });
        const userProjectId = userObj?.projectId;

        const orClause: any[] = [
          { role: userRole },
          { id: { in: customGroupIds } },
        ];
        if (userProjectId) {
          orClause.push({ projectId: userProjectId });
        }

        const hasAccess = await prisma.messageGroup.findFirst({
          where: {
            id: groupId as string,
            OR: orClause,
          },
        });

        if (!hasAccess) {
          res.status(403).json({ success: false, message: 'Access denied', data: null, errors: ['Unauthorized to access this group history'] });
          return;
        }

        whereClause = { groupId: groupId as string };
      } else {
        res.status(400).json({ success: false, message: 'Invalid query params', data: null, errors: ['Missing recipientId or groupId'] });
        return;
      }

      const messages = await prisma.chatMessage.findMany({
        where: whereClause,
        orderBy: { createdAt: 'asc' },
      });

      res.status(200).json(successResponse('Chat history retrieved successfully', messages));
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to retrieve chat history', data: null, errors: [(error as Error).message] });
    }
  }

  // 6. Upload encrypted file to Cloudinary
  async uploadAttachment(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'No file uploaded', data: null, errors: ['Multipart file payload is missing'] });
        return;
      }

      // Upload binary buffer directly to Cloudinary
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: 'thinkcove_e2ee_attachments',
        },
        (error, result) => {
          if (error || !result) {
            logger.error('Cloudinary media upload failed:', error);
            res.status(500).json({ success: false, message: 'Failed to upload attachment to Cloudinary', data: null, errors: [error?.message || 'Upload error'] });
            return;
          }
          res.status(200).json(successResponse('File uploaded successfully', {
            url: result.secure_url,
            publicId: result.public_id,
          }));
        }
      );

      uploadStream.write(req.file.buffer);
      uploadStream.end();
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to handle file upload', data: null, errors: [(error as Error).message] });
    }
  }
}
