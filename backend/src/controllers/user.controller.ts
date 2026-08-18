import { Request, Response } from 'express';
import { UserRepository } from '../repositories/user.repository';
import { successResponse } from '../utils/response';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';

const userRepository = new UserRepository();

export class UserController {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const users = await userRepository.findAll();
      res.status(200).json(successResponse('Users retrieved successfully', users));
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to retrieve users', data: null, errors: [(error as Error).message] });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { fullName, email, password, role, department, taskIds } = req.body;
      const hashedPassword = await bcrypt.hash(password || 'Default123!', 10);
      const user = await userRepository.createUser({
        fullName,
        email,
        password: hashedPassword,
        role: role || 'EMPLOYEE',
        department,
      });

      // Update task assignees
      if (taskIds && Array.isArray(taskIds) && taskIds.length > 0) {
        await prisma.task.updateMany({
          where: { id: { in: taskIds } },
          data: { assignee: fullName },
        });
      }

      // Omit password from response
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(successResponse('User created successfully', userWithoutPassword));
    } catch (error) {
      res.status(400).json({ success: false, message: 'Failed to create user', data: null, errors: [(error as Error).message] });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { fullName, email, role, isActive, department, taskIds } = req.body;

      // Get old user details to unassign previous tasks
      const oldUser = await prisma.user.findUnique({ where: { id } });
      if (oldUser) {
        await prisma.task.updateMany({
          where: { assignee: oldUser.fullName },
          data: { assignee: null },
        });
      }

      const updated = await userRepository.updateUser(id, {
        fullName,
        email,
        role,
        isActive,
        department,
      });

      // Assign new tasks
      if (taskIds && Array.isArray(taskIds) && taskIds.length > 0) {
        await prisma.task.updateMany({
          where: { id: { in: taskIds } },
          data: { assignee: fullName },
        });
      }

      res.status(200).json(successResponse('User updated successfully', updated));
    } catch (error) {
      res.status(400).json({ success: false, message: 'Failed to update user', data: null, errors: [(error as Error).message] });
    }
  }

  async remove(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const user = await prisma.user.findUnique({ where: { id } });
      if (user) {
        await prisma.task.updateMany({
          where: { assignee: user.fullName },
          data: { assignee: null },
        });
      }
      await userRepository.deleteUser(id);
      res.status(200).json(successResponse('User deleted successfully', { id }));
    } catch (error) {
      res.status(400).json({ success: false, message: 'Failed to delete user', data: null, errors: [(error as Error).message] });
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized', data: null, errors: ['User not authenticated'] });
        return;
      }
      const user = await userRepository.findById(userId);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found', data: null, errors: ['User does not exist'] });
        return;
      }
      res.status(200).json(successResponse('Profile retrieved successfully', user));
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to retrieve profile', data: null, errors: [(error as Error).message] });
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized', data: null, errors: ['User not authenticated'] });
        return;
      }
      const { fullName, email, department } = req.body;
      const updated = await userRepository.updateUser(userId, {
        fullName,
        email,
        department,
      });
      res.status(200).json(successResponse('Profile updated successfully', updated));
    } catch (error) {
      res.status(400).json({ success: false, message: 'Failed to update profile', data: null, errors: [(error as Error).message] });
    }
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized', data: null, errors: ['User not authenticated'] });
        return;
      }
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        res.status(400).json({ success: false, message: 'Missing current or new password', data: null, errors: ['Both current and new passwords are required'] });
        return;
      }

      // Fetch user with password
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found', data: null, errors: ['User does not exist'] });
        return;
      }

      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        res.status(400).json({ success: false, message: 'Invalid current password', data: null, errors: ['Current password does not match'] });
        return;
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      res.status(200).json(successResponse('Password changed successfully', null));
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to change password', data: null, errors: [(error as Error).message] });
    }
  }
}
