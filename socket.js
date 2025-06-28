const { Server } = require('socket.io');
const Notification = require('./models/Notification'); // ⬅️ import it
const connectedUsers = new Map(); // userId -> socket
let io;

function setupSocket(server) {
  // io = new Server(server, {
  //   cors: {
  //     origin: 'http://localhost:3000',
  //     methods: ['GET', 'POST'],
  //     credentials: true,
  //   },
  // });

    io = new Server(server, {
    cors: {
      origin: 'https://leavetracker.cloud',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });


  io.on('connection', (socket) => {
    console.log(`🔌 New client connected with socket ID: ${socket.id}`);

    socket.on('register', (userId) => {
      if (!userId) {
        console.log(`⚠️ Received invalid registration from socket ${socket.id}`);
        return;
      }
      connectedUsers.set(userId, socket);
      console.log(`✅ User registered for notifications: userId=${userId}, socketId=${socket.id}`);
    });

    socket.on('disconnect', () => {
      for (const [userId, sock] of connectedUsers.entries()) {
        if (sock.id === socket.id) {
          connectedUsers.delete(userId);
          console.log(`❌ User disconnected: userId=${userId}, socketId=${socket.id}`);
          break;
        }
      }
    });
  });

  console.log('🟢 Socket.io server initialized and ready');
}


async function sendNotification(userId, notification) {
  const socket = connectedUsers.get(userId);
  if (socket) {
    console.log(`📩 Sending notification to userId=${userId}:`, notification);
    socket.emit('notification', notification);
  } else {
    console.log(`⚠️ No active socket found for userId=${userId}, notification dropped.`);
  }

  // 🧠 Save to DB
  try {
    await Notification.create({
      user: userId,
      title: notification.title,
      message: notification.message,
      createdAt: notification.createdAt || new Date(),
    });
  } catch (err) {
    console.error('❌ Failed to save notification to DB:', err.message);
  }
}
module.exports = {
  setupSocket,
  sendNotification,
};
