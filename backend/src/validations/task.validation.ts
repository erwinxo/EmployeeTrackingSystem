import { body } from 'express-validator';

export const taskValidation = [
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('description').optional({ nullable: true }).isString().withMessage('Description must be a string'),
  body('status').optional().isIn(['Pending', 'In Progress', 'Completed']).withMessage('Invalid status'),
  body('projectId').trim().notEmpty().withMessage('Project ID is required'),
];
