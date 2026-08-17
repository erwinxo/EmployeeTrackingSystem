import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { successResponse } from '../utils/response';

export class TaskController {
  async list(req: Request, res: Response): Promise<void> {
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: 'desc' },
      include: { project: true, requirement: true },
    });
    res.status(200).json(successResponse('Tasks fetched successfully', tasks));
  }

  async create(req: Request, res: Response): Promise<void> {
    const task = await prisma.task.create({ data: req.body });
    res.status(201).json(successResponse('Task created successfully', task));
  }

  async update(req: Request, res: Response): Promise<void> {
    const id = req.params.id?.toString();
    const task = await prisma.task.update({
      where: { id },
      data: req.body,
    });
    res.status(200).json(successResponse('Task updated successfully', task));
  }

  async remove(req: Request, res: Response): Promise<void> {
    const id = req.params.id?.toString();
    await prisma.task.delete({ where: { id } });
    res.status(200).json(successResponse('Task deleted successfully', null));
  }
}
