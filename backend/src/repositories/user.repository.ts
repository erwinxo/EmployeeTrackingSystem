import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class UserRepository {
  async createUser(data: { fullName: string; email: string; password: string; role: string; department?: string; projectId?: string | null }) {
    return prisma.user.create({ data });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        department: true,
        isActive: true,
        projectId: true,
        currentStatus: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  async findAll() {
    return prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        department: true,
        isActive: true,
        projectId: true,
        currentStatus: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  async updateUser(id: string, data: any) {
    return prisma.user.update({
      where: { id },
      data,
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
  }

  async deleteUser(id: string) {
    return prisma.user.delete({
      where: { id },
      select: {
        id: true
      }
    });
  }
}
