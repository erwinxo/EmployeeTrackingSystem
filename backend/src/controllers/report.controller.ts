import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { successResponse } from '../utils/response';

export class ReportController {
  async generate(req: Request, res: Response): Promise<void> {
    const projects = await prisma.project.count();
    const tasks = await prisma.task.count();
    const requirements = await prisma.clientRequirement.count();

    res.status(200).json(
      successResponse('Report generated successfully', {
        summary: { projects, tasks, requirements },
      })
    );
  }
}
