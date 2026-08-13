import { body } from 'express-validator';

export const requirementValidation = [
  body('title').trim().notEmpty().withMessage('Requirement title is required'),
  body('description').optional({ nullable: true }).isString().withMessage('Description must be a string'),
  body('priority').optional().isIn(['Low', 'Medium', 'High']).withMessage('Invalid priority'),
  body('projectId').trim().notEmpty().withMessage('Project ID is required'),
];
