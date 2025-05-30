// import jwt from 'jsonwebtoken';
// import messageModel from '../models/messageModel.js';

// function generateRoomId(userA, userB) {
//   return [userA, userB].sort().join('_');
// }

// export const socketHandler = (io) => {
//   io.use((socket, next) => {
//     const authHeader = socket.handshake.headers['authorization'];
//     if (!authHeader) return next(new Error('No token provided'));
    
//     const token = authHeader.split(' ')[1]; // Assuming 'Bearer <token>'
//     jwt.verify(token, process.env.JWT_SECRET_ACCESS_TOKEN, (err, user) => {
//       if (err) return next(new Error('Invalid token'));
//       socket.user = user;
//       console.log(user)
//       next();
//     });
//   });
  

//   io.on('connection', (socket) => {
//     const userId = socket.user._id;

//     socket.on('join_chat', ({ otherUserId }) => {
//       const roomId = generateRoomId(userId, otherUserId);
//       console.log("joined room", roomId)
//       socket.join(roomId);
//     });

//     socket.on('send_message', async ({ to, content }) => {
//       const message = await messageModel.create({
//         sender: userId,
//         receiver: to,
//         content
//       });

//       const roomId = generateRoomId(userId, to);
//       io.to(roomId).emit('receive_message', message);
//     });

//     socket.on('disconnect', () => {
//       console.log(`User ${userId} disconnected`);
//     });
//   });
// };
