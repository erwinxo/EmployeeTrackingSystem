import http from 'http';
import app from './app';
import { env } from './config/env';
import logger from './config/logger';
import { initSocket } from './socket';

const server = http.createServer(app);
initSocket(server);

server.listen(env.port, () => {
  logger.info(`Server listening on port ${env.port}`);
});
