import { body } from 'express-validator';

export const timeLogValidation = [
  body('type')
    .trim()
    .notEmpty()
    .withMessage('Log type is required')
    .isIn(['CHECK_IN', 'CHECK_OUT', 'BREAK_START', 'BREAK_END', 'LUNCH_START', 'LUNCH_END'])
    .withMessage('Invalid log type'),
  body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be a string'),
];
