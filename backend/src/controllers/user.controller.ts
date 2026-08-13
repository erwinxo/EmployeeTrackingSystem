import { Request, Response } from 'express';
import { UserRepository } from '../repositories/user.repository';
import { successResponse } from '../utils/response';
import bcrypt from 'bcryptjs';

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
      const { fullName, email, password, role } = req.body;
      const hashedPassword = await bcrypt.hash(password || 'Default123!', 10);
      const user = await userRepository.createUser({
        fullName,
        email,
        password: hashedPassword,
        role: role || 'EMPLOYEE',
      });
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
      const { fullName, email, role, isActive } = req.body;
      const updated = await userRepository.updateUser(id, {
        fullName,
        email,
        role,
        isActive,
      });
      res.status(200).json(successResponse('User updated successfully', updated));
    } catch (error) {
      res.status(400).json({ success: false, message: 'Failed to update user', data: null, errors: [(error as Error).message] });
    }
  }

  async remove(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      await userRepository.deleteUser(id);
      res.status(200).json(successResponse('User deleted successfully', { id }));
    } catch (error) {
      res.status(400).json({ success: false, message: 'Failed to delete user', data: null, errors: [(error as Error).message] });
    }
  }
}
