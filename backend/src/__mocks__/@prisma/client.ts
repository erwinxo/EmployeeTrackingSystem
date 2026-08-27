import { PrismaClient as ActualPrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

export const prismaMock = mockDeep<ActualPrismaClient>() as unknown as DeepMockProxy<ActualPrismaClient>;

// Override the PrismaClient constructor to return our deep mock
export const PrismaClient = jest.fn(() => prismaMock);
