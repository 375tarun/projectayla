import jwt from 'jsonwebtoken';
import messageModel from '../models/messageModel.js';

function generateRoomId(userA, userB) {
  return [userA, userB].sort().join('_');
}

export const socketHandler = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('No token provided'));

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return next(new Error('Invalid token'));
      socket.user = user;
      next();
    });
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;

    socket.on('join_chat', ({ otherUserId }) => {
      const roomId = generateRoomId(userId, otherUserId);
      socket.join(roomId);
    });

    socket.on('send_message', async ({ to, content }) => {
      const message = await messageModel.create({
        sender: userId,
        receiver: to,
        content
      });

      const roomId = generateRoomId(userId, to);
      io.to(roomId).emit('receive_message', message);
    });

    socket.on('disconnect', () => {
      console.log(`User ${userId} disconnected`);
    });
  });
};
