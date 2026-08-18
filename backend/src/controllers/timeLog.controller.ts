import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../utils/errors';

export class TimeLogController {
  async logStatusChange(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const { type } = req.body;

      // Determine new user status
      let newStatus = 'OFF_WORK';
      switch (type) {
        case 'CHECK_IN':
        case 'BREAK_END':
        case 'LUNCH_END':
          newStatus = 'ACTIVE';
          break;
        case 'CHECK_OUT':
          newStatus = 'OFF_WORK';
          break;
        case 'BREAK_START':
          newStatus = 'BREAK';
          break;
        case 'LUNCH_START':
          newStatus = 'LUNCH';
          break;
        default:
          throw new AppError('Invalid log type', 400);
      }

      // Check if user exists
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Create log and update user status in a transaction
      const [updatedUser, log] = await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { currentStatus: newStatus },
        }),
        prisma.timeLog.create({
          data: {
            userId,
            type,
          },
        }),
      ]);

      res.status(200).json(successResponse('Status updated successfully', {
        status: updatedUser.currentStatus,
        log,
      }));
    } catch (error) {
      res.status((error as any).statusCode || 500).json({
        success: false,
        message: (error as Error).message || 'Failed to log status',
        data: null,
        errors: [(error as Error).message],
      });
    }
  }

  async getTodayLogs(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        throw new AppError('Unauthorized', 401);
      }

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      const logs = await prisma.timeLog.findMany({
        where: {
          userId,
          timestamp: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
        orderBy: {
          timestamp: 'asc',
        },
      });

      res.status(200).json(successResponse('Logs fetched successfully', logs));
    } catch (error) {
      res.status((error as any).statusCode || 500).json({
        success: false,
        message: (error as Error).message || 'Failed to fetch logs',
        data: null,
        errors: [(error as Error).message],
      });
    }
  }

  async getAllUsersStatus(req: Request, res: Response): Promise<void> {
    try {
      const userRole = req.user?.role;
      if (userRole !== 'ADMIN' && userRole !== 'MANAGER' && userRole !== 'PROJECT_MANAGER') {
        throw new AppError('Access denied', 403);
      }

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      const users = await prisma.user.findMany({
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          department: true,
          currentStatus: true,
          timeLogs: {
            where: {
              timestamp: {
                gte: startOfToday,
                lte: endOfToday,
              },
            },
            orderBy: {
              timestamp: 'desc',
            },
            take: 1,
          },
        },
      });

      res.status(200).json(successResponse('User statuses fetched successfully', users));
    } catch (error) {
      res.status((error as any).statusCode || 500).json({
        success: false,
        message: (error as Error).message || 'Failed to fetch user statuses',
        data: null,
        errors: [(error as Error).message],
      });
    }
  }

  async getTodayActivityFeed(req: Request, res: Response): Promise<void> {
    try {
      const userRole = req.user?.role;
      if (userRole !== 'ADMIN' && userRole !== 'MANAGER' && userRole !== 'PROJECT_MANAGER') {
        throw new AppError('Access denied', 403);
      }

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      const logs = await prisma.timeLog.findMany({
        where: {
          timestamp: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
              role: true,
              department: true,
            },
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
      });

      res.status(200).json(successResponse("Today's activity feed fetched", logs));
    } catch (error) {
      res.status((error as any).statusCode || 500).json({
        success: false,
        message: (error as Error).message || 'Failed to fetch activity feed',
        data: null,
        errors: [(error as Error).message],
      });
    }
  }
}
