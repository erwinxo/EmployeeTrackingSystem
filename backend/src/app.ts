import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import projectRoutes from './routes/project.routes';
import requirementRoutes from './routes/requirement.routes';
import taskRoutes from './routes/task.routes';
import reportRoutes from './routes/report.routes';
import timeLogRoutes from './routes/timeLog.routes';
import chatRoutes from './routes/chat.routes';
import notificationRoutes from './routes/notification.routes';
import settingRoutes from './routes/setting.routes';
import { swaggerSpec } from './docs/swagger';
import { AppError } from './utils/errors';
import logger from './config/logger';

const app: Application = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'Server is healthy', data: { uptime: process.uptime() }, errors: [] });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/requirements', requirementRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/time-logs', timeLogRoutes);
app.use('/api/v1/chats', chatRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/settings', settingRoutes);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found', data: null, errors: ['Invalid endpoint'] });
});

app.use((err: Error | AppError, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    logger.error(err.message);
    res.status(err.statusCode).json({ success: false, message: err.message, data: null, errors: [err.message] });
    return;
  }

  logger.error(err.message);
  res.status(500).json({ success: false, message: 'Internal server error', data: null, errors: [err.message] });
});

export default app;
