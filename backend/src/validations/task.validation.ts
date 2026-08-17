import { body } from 'express-validator';

export const taskValidation = [
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('description').optional({ nullable: true }).isString().withMessage('Description must be a string'),
  body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'REVIEW', 'FINISHED', 'Pending', 'In Progress', 'Completed', 'To Do', 'In Review', 'Finished']).withMessage('Invalid status'),
  body('projectId').trim().notEmpty().withMessage('Project ID is required'),
  body('requirementId').optional({ nullable: true }).isString().withMessage('Requirement ID must be a string'),
];
