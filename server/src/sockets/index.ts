import { Server as HttpServer } from 'http';
import { Server as IOServer, Socket } from 'socket.io';

let io: IOServer;

export const initSocket = (httpServer: HttpServer): IOServer => {
  io = new IOServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`📡 Client connected: ${socket.id}`);

    // Client subscribes to a queue room
    socket.on('join_queue_room', (queueId: string) => {
      socket.join(`queue:${queueId}`);
      console.log(`🔗 ${socket.id} joined room queue:${queueId}`);
    });

    // Client leaves a queue room (e.g. navigates away)
    socket.on('leave_queue_room', (queueId: string) => {
      socket.leave(`queue:${queueId}`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Singleton getter — used by route handlers to emit events
export const getIO = (): IOServer => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};
