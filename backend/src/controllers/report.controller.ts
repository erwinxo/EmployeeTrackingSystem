import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { successResponse } from '../utils/response';
import PDFDocument from 'pdfkit';

export class ReportController {
  async generate(req: Request, res: Response): Promise<void> {
    const userRole = req.user?.role;
    const userId = req.user?.sub;

    const projectWhere = userRole === 'PROJECT_MANAGER' && userId ? { projectManagerId: userId } : {};
    const taskWhere = userRole === 'PROJECT_MANAGER' && userId ? { project: { projectManagerId: userId } } : {};
    const requirementWhere = userRole === 'PROJECT_MANAGER' && userId ? { project: { projectManagerId: userId } } : {};

    const projects = await prisma.project.count({ where: projectWhere });
    const tasks = await prisma.task.count({ where: taskWhere });
    const requirements = await prisma.clientRequirement.count({ where: requirementWhere });

    res.status(200).json(
      successResponse('Report generated successfully', {
        summary: { projects, tasks, requirements },
      })
    );
  }

  async exportReport(req: Request, res: Response): Promise<void> {
    try {
      const format = req.query.format?.toString() || 'csv';
      const userRole = req.user?.role;
      const userId = req.user?.sub;

      const projectWhere = userRole === 'PROJECT_MANAGER' && userId ? { projectManagerId: userId } : {};
      const taskWhere = userRole === 'PROJECT_MANAGER' && userId ? { project: { projectManagerId: userId } } : {};
      const requirementWhere = userRole === 'PROJECT_MANAGER' && userId ? { project: { projectManagerId: userId } } : {};

      // Determine time log scoping boundaries
      let timeLogWhere: any = {};
      if (userRole === 'PROJECT_MANAGER' && userId) {
        const myProjects = await prisma.project.findMany({
          where: { projectManagerId: userId },
          select: { id: true }
        });
        const projectIds = myProjects.map(p => p.id);
        const myTasks = await prisma.task.findMany({
          where: { projectId: { in: projectIds } },
          select: { assignee: true }
        });
        const assignees = Array.from(new Set(myTasks.map(t => t.assignee).filter(Boolean)));
        
        timeLogWhere = {
          user: {
            OR: [
              { projectId: { in: projectIds } },
              { fullName: { in: assignees as string[] } },
              { id: userId }
            ]
          }
        };
      } else if (userRole === 'MANAGER') {
        timeLogWhere = {
          user: {
            role: { in: ['PROJECT_MANAGER', 'EMPLOYEE'] }
          }
        };
      }

      // Fetch active data concurrently
      const [projects, tasks, requirements, timeLogs] = await Promise.all([
        prisma.project.findMany({
          where: projectWhere,
          include: { tasks: true, requirements: true },
        }),
        prisma.task.findMany({
          where: taskWhere,
          include: { project: true },
        }),
        prisma.clientRequirement.findMany({
          where: requirementWhere,
          include: { project: true },
        }),
        prisma.timeLog.findMany({
          where: timeLogWhere,
          include: { user: true },
          orderBy: { timestamp: 'desc' },
        }),
      ]);

      if (format === 'pdf') {
        // Generate PDF report using pdfkit
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=workspace_analytics_report.pdf');

        const doc = new PDFDocument({ margin: 50 });
        doc.pipe(res);

        // Header Title
        doc.fillColor('#0f172a').fontSize(24).text('Employee Tracking System', { align: 'center' });
        doc.fillColor('#334155').fontSize(14).text('System Status & Deliverables Summary', { align: 'center' });
        doc.fontSize(8).fillColor('#64748b').text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown(2);

        // Core Summary Metrics
        doc.fillColor('#0f172a').fontSize(14).text('1. Workspace Metrics Summary', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11).fillColor('#334155');
        doc.text(`Total Active Projects: ${projects.length}`);
        doc.text(`Total Client Requirements: ${requirements.length}`);
        doc.text(`Total Workflow Tasks: ${tasks.length}`);
        doc.text(`Total Registered Shift Logs: ${timeLogs.length}`);
        doc.moveDown(2);

        // Active Projects Details
        doc.fontSize(14).fillColor('#0f172a').text('2. Project Tracking Details', { underline: true });
        doc.moveDown(0.5);

        for (const proj of projects) {
          const totalTasks = proj.tasks.length;
          const completedTasks = proj.tasks.filter((t) => t.status === 'Completed' || t.status === 'FINISHED').length;
          const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

          doc.fontSize(12).fillColor('#0f172a').text(`Project: ${proj.name}`);
          doc.fontSize(10).fillColor('#475569');
          doc.text(`  Status: ${proj.status}`);
          doc.text(`  Milestone Progress: ${pct}% (${completedTasks}/${totalTasks} tasks completed)`);
          doc.text(`  Functional Requirements Traced: ${proj.requirements.length}`);
          if (proj.description) {
            doc.text(`  Description: ${proj.description}`);
          }
          doc.moveDown(1);
        }

        // Attendance & Shift Time Logs
        doc.addPage();
        doc.fontSize(14).fillColor('#0f172a').text('3. Employee Shift Logging & Activity Logs', { underline: true });
        doc.moveDown(0.5);

        for (const log of timeLogs) {
          const userName = log.user?.fullName || 'Unknown User';
          const timestamp = new Date(log.timestamp).toLocaleString();
          const type = log.type.replace('_', ' ');
          const notesStr = log.notes ? ` (Notes: ${log.notes})` : '';
          doc.fontSize(10).fillColor('#334155').text(`• [${timestamp}] ${userName} - ${type}${notesStr}`);
        }

        doc.end();
      } else {
        // Export Spreadsheet as CSV
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=workspace_spreadsheet_report.csv');

        let csvContent = '\uFEFF'; // UTF-8 BOM
        csvContent += 'TYPE,NAME/TITLE,PROJECT/DESCRIPTION,STATUS/PRIORITY,ASSIGNEE/TASKS COUNT,CREATED AT\n';

        // 1. Projects rows
        for (const p of projects) {
          const name = p.name.replace(/"/g, '""');
          const desc = (p.description || '').replace(/"/g, '""');
          const status = p.status;
          const count = p.tasks.length;
          const createdAt = p.createdAt.toISOString();
          csvContent += `"PROJECT","${name}","${desc}","${status}","${count} tasks","${createdAt}"\n`;
        }

        // 2. Tasks rows
        for (const t of tasks) {
          const title = t.title.replace(/"/g, '""');
          const desc = (t.description || '').replace(/"/g, '""');
          const status = t.status;
          const assignee = (t.assignee || 'Unassigned').replace(/"/g, '""');
          const createdAt = t.createdAt.toISOString();
          csvContent += `"TASK","${title}","${desc}","${status}","${assignee}","${createdAt}"\n`;
        }

        // 3. Requirements rows
        for (const r of requirements) {
          const title = r.title.replace(/"/g, '""');
          const desc = (r.description || '').replace(/"/g, '""');
          const priority = r.priority;
          const projectName = (r.project?.name || 'Unknown Project').replace(/"/g, '""');
          const createdAt = r.createdAt.toISOString();
          csvContent += `"REQUIREMENT","${title}","${desc}","${priority}","${projectName}","${createdAt}"\n`;
        }

        // 4. Time Logs rows
        for (const log of timeLogs) {
          const userName = (log.user?.fullName || 'Unknown User').replace(/"/g, '""');
          const type = log.type;
          const notes = (log.notes || '').replace(/"/g, '""');
          const timestamp = log.timestamp.toISOString();
          csvContent += `"TIME_LOG","${userName}","${notes}","${type}","","${timestamp}"\n`;
        }

        res.status(200).send(csvContent);
      }
    } catch (error) {
      console.error('Export report error:', error);
      res.status(500).json({ success: false, message: 'Failed to export report', data: null, errors: [(error as Error).message] });
    }
  }
}
