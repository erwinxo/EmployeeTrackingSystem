import { body } from 'express-validator';

export const projectValidation = [
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('description').optional({ nullable: true }).isString().withMessage('Description must be a string'),
  body('status').optional().isIn(['Planning', 'In Progress', 'Completed', 'On Hold']).withMessage('Invalid status'),
];
