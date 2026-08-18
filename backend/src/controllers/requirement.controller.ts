import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { successResponse } from '../utils/response';

export class RequirementController {
  async list(req: Request, res: Response): Promise<void> {
    const userRole = req.user?.role;
    const userId = req.user?.sub;

    const whereClause = userRole === 'PROJECT_MANAGER' && userId
      ? { project: { projectManagerId: userId } }
      : {};

    const requirements = await prisma.clientRequirement.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: { project: true, tasks: true },
    });
    res.status(200).json(successResponse('Requirements fetched successfully', requirements));
  }

  async create(req: Request, res: Response): Promise<void> {
    const requirement = await prisma.clientRequirement.create({ data: req.body });
    res.status(201).json(successResponse('Requirement created successfully', requirement));
  }

  async update(req: Request, res: Response): Promise<void> {
    const id = req.params.id?.toString();
    const requirement = await prisma.clientRequirement.update({
      where: { id },
      data: req.body,
    });
    res.status(200).json(successResponse('Requirement updated successfully', requirement));
  }

  async remove(req: Request, res: Response): Promise<void> {
    const id = req.params.id?.toString();
    await prisma.clientRequirement.delete({ where: { id } });
    res.status(200).json(successResponse('Requirement deleted successfully', null));
  }
}
