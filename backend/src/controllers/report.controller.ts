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
      let userWhere: any = { role: { not: 'SUPER_ADMIN' } };

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
            role: { not: 'SUPER_ADMIN' },
            OR: [
              { projectId: { in: projectIds } },
              { fullName: { in: assignees as string[] } },
              { id: userId }
            ]
          }
        };

        userWhere = {
          role: { not: 'SUPER_ADMIN' },
          OR: [
            { projectId: { in: projectIds } },
            { fullName: { in: assignees as string[] } },
            { id: userId }
          ]
        };
      } else if (userRole === 'MANAGER') {
        timeLogWhere = {
          user: {
            role: { in: ['PROJECT_MANAGER', 'EMPLOYEE'] }
          }
        };
        userWhere = {
          role: { in: ['PROJECT_MANAGER', 'EMPLOYEE'] }
        };
      }

      // Fetch active data concurrently
      const [users, projects, tasks, requirements, timeLogs] = await Promise.all([
        prisma.user.findMany({
          where: userWhere,
          orderBy: { fullName: 'asc' }
        }),
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
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=workspace_analytics_report.pdf');

        const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
        doc.pipe(res);

        const downloadedTime = new Date().toLocaleString();
        let currentY = 70;

        const drawHeader = () => {
          doc.save();
          // Draw Thinkcove Technologies purple logo
          doc.strokeColor('#4f46e5').lineWidth(2);
          doc.circle(32, 34, 7).stroke();
          doc.moveTo(29, 43).lineTo(35, 43).stroke();
          doc.moveTo(30, 46).lineTo(34, 46).stroke();
          // Rays
          doc.moveTo(32, 24).lineTo(32, 21).stroke();
          doc.moveTo(23, 29).lineTo(20, 26).stroke();
          doc.moveTo(41, 29).lineTo(44, 26).stroke();
          doc.restore();

          // Header branding text
          doc.font('Helvetica-Bold').fontSize(14).fillColor('#000000').text('Thinkcove Technologies', 52, 33);
          
          // Right-aligned download date & time
          doc.font('Helvetica').fontSize(8.5).fillColor('#475569').text(`Downloaded: ${downloadedTime}`, 350, 37, { width: 242, align: 'right' });
          
          // Dividers line
          doc.moveTo(20, 50).lineTo(592, 50).strokeColor('#000000').lineWidth(1).stroke();
        };

        // Draw header on the first page
        drawHeader();

        // Loop through all users to render their cards
        for (const user of users) {
          const userTasks = tasks.filter((t) => t.assignee === user.fullName);
          const userLogs = timeLogs.filter((log) => log.userId === user.id);
          const assignedProj = projects.find((p) => p.id === user.projectId);

          // Calculate height needed for this user's card
          const headerHeight = 30;
          const projHeight = 15;
          const tasksHeight = 15 + Math.max(1, userTasks.length) * 13;
          const logsHeight = 15 + Math.max(1, userLogs.length) * 13;
          const cardHeight = headerHeight + projHeight + tasksHeight + logsHeight + 15;

          // Check if we need a new page before drawing this card
          if (currentY + cardHeight > 730) {
            doc.addPage();
            drawHeader();
            currentY = 70;
          }

          // Draw Rounded Card Background and Border
          doc.save();
          doc.fillColor('#f8fafc').roundedRect(50, currentY, 512, cardHeight, 8).fill();
          doc.strokeColor('#e2e8f0').lineWidth(1).roundedRect(50, currentY, 512, cardHeight, 8).stroke();
          doc.restore();

          // User Name & Role Info
          doc.font('Helvetica-Bold').fontSize(11).fillColor('#0f172a').text(user.fullName, 65, currentY + 12);
          const roleLabel = `${user.role} • ${user.department || 'No Department'}`;
          doc.font('Helvetica').fontSize(8.5).fillColor('#64748b').text(roleLabel, 300, currentY + 14, { width: 247, align: 'right' });

          // Project Details
          const projName = assignedProj ? assignedProj.name : 'Unassigned';
          doc.font('Helvetica-Bold').fontSize(9).fillColor('#334155').text('Project: ', 65, currentY + 32);
          doc.font('Helvetica').fontSize(9).fillColor('#475569').text(projName, 110, currentY + 32);

          // Tasks Section
          let subY = currentY + 48;
          doc.font('Helvetica-Bold').fontSize(9).fillColor('#334155').text('Assigned Tasks:', 65, subY);
          subY += 14;

          if (userTasks.length === 0) {
            doc.font('Helvetica-Oblique').fontSize(8.5).fillColor('#94a3b8').text('No active tasks assigned.', 75, subY);
            subY += 13;
          } else {
            for (const task of userTasks) {
              const statusSymbol = task.status === 'Completed' || task.status === 'FINISHED' ? '✓' : '○';
              const statusColor = task.status === 'Completed' || task.status === 'FINISHED' ? '#10b981' : '#f59e0b';
              
              doc.save();
              doc.fillColor(statusColor).font('Helvetica-Bold').fontSize(8.5).text(statusSymbol, 75, subY);
              doc.fillColor('#334155').font('Helvetica').fontSize(8.5).text(`[${task.status}] ${task.title}`, 90, subY);
              doc.restore();
              subY += 13;
            }
          }

          // Logs Section
          subY += 5;
          doc.font('Helvetica-Bold').fontSize(9).fillColor('#334155').text('Shift Activity Logs (Today):', 65, subY);
          subY += 14;

          if (userLogs.length === 0) {
            doc.font('Helvetica-Oblique').fontSize(8.5).fillColor('#94a3b8').text('No shift activity registered today.', 75, subY);
            subY += 13;
          } else {
            for (const log of userLogs) {
              const logTime = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const logType = log.type.replace('_', ' ');
              const notesStr = log.notes ? ` (Notes: ${log.notes})` : '';
              
              doc.font('Helvetica').fontSize(8.5).fillColor('#64748b').text(`• [${logTime}] ${logType}${notesStr}`, 75, subY);
              subY += 13;
            }
          }

          // Advance currentY for the next card
          currentY += cardHeight + 15;
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
