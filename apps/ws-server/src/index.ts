import { Server } from "socket.io";
import 'dotenv/config'
process.loadEnvFile("./.env.local")

const PORT = Number(process.env.PORT) || 8080;
const io = new Server(PORT, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

console.log(`WebSocket server running on port ${PORT}`);

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on("create-room", (data) => {
    if (!data || !data.roomId) {
      socket.emit("error", "Room ID is required");
      return;
    }

    socket.join(data.roomId);
    console.log(`Socket ${socket.id} joined room ${data.roomId}`);
    socket.emit("room-created", "Room created successfully.");
  });

  socket.on("message", (data) => {
    if (!data || !data.roomId || !data.message) {
      socket.emit("error", "RoomId and message required.");
      return;
    }
    console.log(`Message from ${socket.id}:`, data);

    socket.to(data.roomId).emit("message",data.message)
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });

  socket.on("error", (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
  });
});
