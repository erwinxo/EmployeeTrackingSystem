import { Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../auth.middleware';
import * as jwtUtils from '../../utils/jwt';

jest.mock('../../utils/jwt');

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction = jest.fn();

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should proceed to next if valid token is provided', () => {
      mockRequest.headers!.authorization = 'Bearer validtoken';
      const mockPayload = { sub: 'user123', role: 'EMPLOYEE' };
      (jwtUtils.verifyToken as jest.Mock).mockReturnValue(mockPayload);

      authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.user).toEqual(mockPayload);
    });

    it('should return 401 if authorization header is missing', () => {
      authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Unauthorized',
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if header does not start with Bearer', () => {
      mockRequest.headers!.authorization = 'Basic credentials';

      authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if token validation throws an error', () => {
      mockRequest.headers!.authorization = 'Bearer invalidtoken';
      (jwtUtils.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('authorize', () => {
    it('should proceed to next if user role is in the allowed roles list', () => {
      mockRequest.user = { sub: 'user123', role: 'ADMIN' };
      const middleware = authorize('ADMIN', 'MANAGER');

      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should return 403 if user role is not in the allowed roles list', () => {
      mockRequest.user = { sub: 'user123', role: 'EMPLOYEE' };
      const middleware = authorize('ADMIN', 'MANAGER');

      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Forbidden',
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if user context is missing from request', () => {
      const middleware = authorize('ADMIN');

      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Unauthorized',
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
});
