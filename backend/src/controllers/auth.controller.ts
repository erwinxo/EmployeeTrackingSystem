import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { UserRepository } from '../repositories/user.repository';
import { successResponse } from '../utils/response';

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
}
