import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { env } from './config/env';
import prisma from './lib/prisma';
import logger from './config/logger';
import { sendPushNotification } from './controllers/notification.controller';

interface DecodedToken {
  sub: string;
  role: string;
}

// Store online users: userId -> Set of socketIds
export const onlineUsers = new Map<string, Set<string>>();

export function initSocket(server: HTTPServer) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*', // Allow all origins for simplicity, adjust for production
      methods: ['GET', 'POST'],
    },
  });

  // Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      const decoded = jwt.verify(token as string, env.jwtSecret) as DecodedToken;
      const user = await prisma.user.findUnique({
        where: { id: decoded.sub },
        select: { id: true, fullName: true, role: true, projectId: true },
      });

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.data.user = user;
      next();
    } catch (err) {
      logger.error('Socket authentication failed:', err);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const user = socket.data.user;
    logger.info(`User connected to WebSocket: ${user.fullName} (${user.id})`);

    // Track online state
    if (!onlineUsers.has(user.id)) {
      onlineUsers.set(user.id, new Set());
    }
    onlineUsers.get(user.id)!.add(socket.id);

    // Notify all clients of presence update
    io.emit('presence_change', {
      userId: user.id,
      status: 'online',
    });

    // Send the newly connected user the list of currently online users
    socket.emit('online_users_list', Array.from(onlineUsers.keys()));

    // Join personal private room
    socket.join(`user_${user.id}`);

    // Join role room
    socket.join(`role_${user.role}`);

    // Join project room if user is assigned to one
    if (user.projectId) {
      socket.join(`project_${user.projectId}`);
    }

    // Handlers for sending messages
    socket.on('send_message', async (payload: {
      recipientId?: string;
      groupId?: string;
      encryptedContent: string;
      iv: string;
      mediaUrl?: string;
      mediaIv?: string;
      mediaName?: string;
      mediaType?: string;
    }) => {
      try {
        const { recipientId, groupId, encryptedContent, iv, mediaUrl, mediaIv, mediaName, mediaType } = payload;

        if (!encryptedContent || !iv) {
          socket.emit('error', { message: 'Encrypted content and IV are required' });
          return;
        }

        // Save encrypted message to database
        const message = await prisma.chatMessage.create({
          data: {
            senderId: user.id,
            recipientId: recipientId || null,
            groupId: groupId || null,
            encryptedContent,
            iv,
            mediaUrl: mediaUrl || null,
            mediaIv: mediaIv || null,
            mediaName: mediaName || null,
            mediaType: mediaType || null,
          },
        });

        // Broadcast payload formatting
        const broadcastPayload = {
          id: message.id,
          senderId: user.id,
          senderName: user.fullName,
          recipientId: message.recipientId,
          groupId: message.groupId,
          encryptedContent: message.encryptedContent,
          iv: message.iv,
          mediaUrl: message.mediaUrl,
          mediaIv: message.mediaIv,
          mediaName: message.mediaName,
          mediaType: message.mediaType,
          createdAt: message.createdAt,
        };

        if (recipientId) {
          // 1:1 Direct Message: Emit to both recipient and sender private rooms
          io.to(`user_${recipientId}`).emit('new_message', broadcastPayload);
          io.to(`user_${user.id}`).emit('new_message', broadcastPayload);

          // Dispatch web push notification asynchronously
          try {
            await sendPushNotification(recipientId, {
              title: `New Message from ${user.fullName}`,
              body: 'Encrypted Message Received',
              data: {
                senderId: user.id,
                chatType: 'direct',
              },
            });
          } catch (pushErr) {
            logger.error('Failed to dispatch push notification:', pushErr);
          }

        } else if (groupId) {
          // Group Message
          const group = await prisma.messageGroup.findUnique({
            where: { id: groupId },
          });

          if (group) {
            let targetRoom = '';
            let recipients: string[] = [];

            if (group.projectId) {
              targetRoom = `project_${group.projectId}`;
              // Find all users in the project
              const projectUsers = await prisma.user.findMany({
                where: { projectId: group.projectId },
                select: { id: true },
              });
              recipients = projectUsers.map(u => u.id);
            } else if (group.role) {
              targetRoom = `role_${group.role}`;
              // Find all users with this role
              const roleUsers = await prisma.user.findMany({
                where: { role: group.role },
                select: { id: true },
              });
              recipients = roleUsers.map(u => u.id);
            }

            if (targetRoom) {
              // Broadcast to target room
              io.to(targetRoom).emit('new_message', broadcastPayload);

              // Notify users who are not active on WebSocket
              const offlineRecipients = recipients.filter(
                id => id !== user.id && (!onlineUsers.has(id) || onlineUsers.get(id)!.size === 0)
              );

              for (const offlineId of offlineRecipients) {
                try {
                  await sendPushNotification(offlineId, {
                    title: `New Group Message: ${group.name}`,
                    body: `New encrypted update in ${group.name}`,
                    data: {
                      groupId: group.id,
                      chatType: 'group',
                    },
                  });
                } catch (pushErr) {
                  logger.error(`Failed to dispatch group push to ${offlineId}:`, pushErr);
                }
              }
            }
          }
        }
      } catch (err) {
        logger.error('Error handling send_message event:', err);
        socket.emit('error', { message: 'Failed to process message transmission' });
      }
    });

    // Handle typing status
    socket.on('typing', (payload: { recipientId?: string; groupId?: string; isTyping: boolean }) => {
      const { recipientId, groupId, isTyping } = payload;
      const broadcastPayload = {
        userId: user.id,
        userName: user.fullName,
        isTyping,
      };

      if (recipientId) {
        io.to(`user_${recipientId}`).emit('typing_status', { ...broadcastPayload, recipientId });
      } else if (groupId) {
        // Emit typing event to group target room
        prisma.messageGroup.findUnique({ where: { id: groupId } }).then((group) => {
          if (group) {
            const targetRoom = group.projectId ? `project_${group.projectId}` : `role_${group.role}`;
            if (targetRoom) {
              socket.to(targetRoom).emit('typing_status', { ...broadcastPayload, groupId });
            }
          }
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${user.fullName} (${user.id})`);
      const userSockets = onlineUsers.get(user.id);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(user.id);
          // Broadcast presence update
          io.emit('presence_change', {
            userId: user.id,
            status: 'offline',
          });
        }
      }
    });
  });
}
