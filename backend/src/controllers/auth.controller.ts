import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { UserRepository } from '../repositories/user.repository';
import { successResponse } from '../utils/response';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';

const authService = new AuthService(new UserRepository());

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { fullName, email, password } = req.body;
      const result = await authService.register(fullName, email, password);
      res.status(201).json(successResponse('User registered successfully', result));
    } catch (error) {
      res.status(400).json({ success: false, message: 'Registration failed', data: null, errors: [(error as Error).message] });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.status(200).json(successResponse('Login successful', result));
    } catch (error) {
      res.status(401).json({ success: false, message: 'Login failed', data: null, errors: [(error as Error).message] });
    }
  }

  refreshToken(req: Request, res: Response): void {
    res.status(200).json(successResponse('Refresh token placeholder', { token: 'refresh-token-placeholder' }));
  }

  async seed(req: Request, res: Response): Promise<void> {
    try {
      const password = await bcrypt.hash('Admin123!', 10);
      const admin = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {
          password,
          role: 'ADMIN',
          isActive: true,
        },
        create: {
          fullName: 'System Admin',
          email: 'admin@example.com',
          password,
          role: 'ADMIN',
          isActive: true,
        },
      });

      const pmPassword = await bcrypt.hash('Pm123!', 10);
      const pm = await prisma.user.upsert({
        where: { email: 'pm@example.com' },
        update: {
          password: pmPassword,
          role: 'PROJECT_MANAGER',
          isActive: true,
        },
        create: {
          fullName: 'Project Manager',
          email: 'pm@example.com',
          password: pmPassword,
          role: 'PROJECT_MANAGER',
          isActive: true,
        },
      });

      const superPassword = await bcrypt.hash('superadmin@123', 10);
      const superAdmin = await prisma.user.upsert({
        where: { email: 'superadmin@thinkcove.com' },
        update: {
          password: superPassword,
          role: 'SUPER_ADMIN',
          isActive: true,
        },
        create: {
          fullName: 'Super Admin',
          email: 'superadmin@thinkcove.com',
          password: superPassword,
          role: 'SUPER_ADMIN',
          isActive: true,
        },
      });

      res.status(200).json(successResponse('Database seeded successfully via API', {
        admin: admin.email,
        pm: pm.email,
        superadmin: superAdmin.email,
      }));
    } catch (error) {
      res.status(500).json({ success: false, message: 'API Seeding failed', data: null, errors: [(error as Error).message] });
    }
  }
}
