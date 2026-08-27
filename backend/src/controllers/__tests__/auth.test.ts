import request from 'supertest';
import app from '../../app';
import { prismaMock } from '../../__mocks__/@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

describe('Auth API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should authenticate a user and return a token', async () => {
      const mockUser = {
        id: 'user123',
        fullName: 'Test Developer',
        email: 'test@thinkcove.com',
        password: 'hashedpassword',
        role: 'EMPLOYEE',
        department: 'Engineering',
        isActive: true,
        currentStatus: 'OFF_WORK',
        projectId: null,
        pushEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mockedtoken');

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@thinkcove.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBe('mockedtoken');
      expect(res.body.data.user.email).toBe('test@thinkcove.com');
    });

    it('should fail with invalid credentials', async () => {
      (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'unknown@thinkcove.com', password: 'password123' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Login failed');
    });

    it('should fail if account is deactivated', async () => {
      const mockUser = {
        id: 'user123',
        fullName: 'Deactivated User',
        email: 'deactivated@thinkcove.com',
        password: 'hashedpassword',
        role: 'EMPLOYEE',
        department: 'Engineering',
        isActive: false,
        currentStatus: 'OFF_WORK',
        projectId: null,
        pushEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'deactivated@thinkcove.com', password: 'password123' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toContain('Your account has been deactivated');
    });
  });
});
