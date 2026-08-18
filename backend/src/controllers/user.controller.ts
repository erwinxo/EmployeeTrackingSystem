import { Request, Response } from 'express';
import { UserRepository } from '../repositories/user.repository';
import { successResponse } from '../utils/response';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';

const userRepository = new UserRepository();

export class UserController {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const userRole = req.user?.role;
      const userId = req.user?.sub;

      if (userRole === 'PROJECT_MANAGER' && userId) {
        // Get all projects assigned to this PM
        const myProjects = await prisma.project.findMany({
          where: { projectManagerId: userId },
          select: { id: true }
        });
        const projectIds = myProjects.map(p => p.id);

        // Get all tasks in these projects to find assignees (team members)
        const myTasks = await prisma.task.findMany({
          where: { projectId: { in: projectIds } },
          select: { assignee: true }
        });
        const assignees = Array.from(new Set(myTasks.map(t => t.assignee).filter(Boolean)));

        // Find users matching those assignees or the PM themselves
        const users = await prisma.user.findMany({
          where: {
            OR: [
              { fullName: { in: assignees as string[] } },
              { role: 'EMPLOYEE' },
              { id: userId }
            ]
          },
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            department: true,
            isActive: true,
            projectId: true,
            createdAt: true,
            updatedAt: true
          }
        });
        res.status(200).json(successResponse('Users retrieved successfully', users));
      } else {
        const users = await userRepository.findAll();
        res.status(200).json(successResponse('Users retrieved successfully', users));
      }
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to retrieve users', data: null, errors: [(error as Error).message] });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { fullName, email, password, role, department, taskIds, projectId } = req.body;
      const hashedPassword = await bcrypt.hash(password || 'Default123!', 10);
      const user = await userRepository.createUser({
        fullName,
        email,
        password: hashedPassword,
        role: role || 'EMPLOYEE',
        department,
        projectId: (role === 'EMPLOYEE' || role === 'PROJECT_MANAGER') ? projectId || null : null,
      });

      // Update task assignees (only if role is EMPLOYEE)
      if (role === 'EMPLOYEE' && taskIds && Array.isArray(taskIds) && taskIds.length > 0) {
        await prisma.task.updateMany({
          where: { id: { in: taskIds } },
          data: { assignee: fullName },
        });
      }

      // Assign project manager to selected project
      if (role === 'PROJECT_MANAGER' && projectId) {
        await prisma.project.update({
          where: { id: projectId },
          data: { projectManagerId: user.id },
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
      const { fullName, email, role, isActive, department, taskIds, projectId } = req.body;

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
        projectId: (role === 'EMPLOYEE' || role === 'PROJECT_MANAGER') ? projectId || null : null,
      });

      // Assign new tasks (only if role is EMPLOYEE)
      if (role === 'EMPLOYEE' && taskIds && Array.isArray(taskIds) && taskIds.length > 0) {
        await prisma.task.updateMany({
          where: { id: { in: taskIds } },
          data: { assignee: fullName },
        });
      }

      // Manage project manager assignments
      if (role === 'PROJECT_MANAGER') {
        // Clear project manager from other projects
        await prisma.project.updateMany({
          where: { projectManagerId: id },
          data: { projectManagerId: null },
        });
        // Assign to new project if provided
        if (projectId) {
          await prisma.project.update({
            where: { id: projectId },
            data: { projectManagerId: id },
          });
        }
      } else {
        // If role is no longer PROJECT_MANAGER, clear projectManagerId
        await prisma.project.updateMany({
          where: { projectManagerId: id },
          data: { projectManagerId: null },
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
