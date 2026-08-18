import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { successResponse } from '../utils/response';

export class ProjectController {
  async list(req: Request, res: Response): Promise<void> {
    const userRole = req.user?.role;
    const userId = req.user?.sub;

    const whereClause = userRole === 'PROJECT_MANAGER' && userId
      ? { projectManagerId: userId }
      : {};

    const projects = await prisma.project.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: { tasks: true, requirements: true },
    });
    res.status(200).json(successResponse('Projects fetched successfully', projects));
  }

  async create(req: Request, res: Response): Promise<void> {
    const project = await prisma.project.create({ data: req.body });
    res.status(201).json(successResponse('Project created successfully', project));
  }

  async update(req: Request, res: Response): Promise<void> {
    const id = req.params.id?.toString();
    const project = await prisma.project.update({
      where: { id },
      data: req.body,
    });
    res.status(200).json(successResponse('Project updated successfully', project));
  }

  async remove(req: Request, res: Response): Promise<void> {
    const id = req.params.id?.toString();
    await prisma.project.delete({ where: { id } });
    res.status(200).json(successResponse('Project deleted successfully', null));
  }
}
