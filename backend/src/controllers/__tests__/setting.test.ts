import request from 'supertest';
import app from '../../app';
import { prismaMock } from '../../__mocks__/@prisma/client';
import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

describe('Settings & Feature Flags API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/settings/features', () => {
    it('should return all feature flags', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ sub: 'user123', role: 'EMPLOYEE' });
      (prismaMock.systemSetting.findMany as jest.Mock).mockResolvedValue([
        { id: '1', key: 'FEATURE_CHAT', value: true },
        { id: '2', key: 'FEATURE_REPORTS', value: false },
      ]);

      const res = await request(app)
        .get('/api/v1/settings/features')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual({
        FEATURE_CHAT: true,
        FEATURE_REPORTS: false,
        FEATURE_TASKS: true,
      });
    });
  });

  describe('PUT /api/v1/settings/features', () => {
    it('should allow Super Admin to update feature flags', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ sub: 'admin123', role: 'SUPER_ADMIN' });
      
      const mockUpdatedSetting = { id: '1', key: 'FEATURE_CHAT', value: false };
      (prismaMock.systemSetting.upsert as jest.Mock).mockResolvedValue(mockUpdatedSetting);

      const res = await request(app)
        .put('/api/v1/settings/features')
        .set('Authorization', 'Bearer valid-token')
        .send({ key: 'FEATURE_CHAT', value: false });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('updated successfully');
    });

    it('should deny standard employees access to update features', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ sub: 'user123', role: 'EMPLOYEE' });

      const res = await request(app)
        .put('/api/v1/settings/features')
        .set('Authorization', 'Bearer valid-token')
        .send({ key: 'FEATURE_CHAT', value: false });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Forbidden');
    });
  });
});
