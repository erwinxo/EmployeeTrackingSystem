import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { successResponse } from '../utils/response';
import PDFDocument from 'pdfkit';

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

  async exportReport(req: Request, res: Response): Promise<void> {
    try {
      const format = req.query.format?.toString() || 'csv';

      // Fetch active data
      const [projects, tasks, requirements] = await Promise.all([
        prisma.project.findMany({
          include: { tasks: true, requirements: true },
        }),
        prisma.task.findMany({
          include: { project: true },
        }),
        prisma.clientRequirement.findMany({
          include: { project: true },
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

        res.status(200).send(csvContent);
      }
    } catch (error) {
      console.error('Export report error:', error);
      res.status(500).json({ success: false, message: 'Failed to export report', data: null, errors: [(error as Error).message] });
    }
  }
}
