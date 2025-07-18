import { Server } from "socket.io";
import { verifyToken  } from '@clerk/backend';
import 'dotenv/config'
process.loadEnvFile("./.env.local")

const PORT = Number(process.env.PORT) || 8080;

const io = new Server(PORT, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.use(async (socket, next) => {
  const auth = socket.handshake.auth.token;
  const token = auth.token

  if (!auth || !token) {
    io.close()
    return next(new Error("Authentication error: No token provided"));
  }

  try {    

    const verified = await verifyToken(token, {
      jwtKey: process.env.CLERK_JWT_KEY
     });

    socket.data.user = {
      userId: verified.sub,
      sessionId: verified.sid,
    };

    return next();
  } catch (err) {
    io.close()
    console.error("JWT verification failed:");
    return next(new Error("Authentication error: Invalid token"));
  }
});

    // FIX : BETTER STRUCTURE, USE REDUX OR SINGELTON / BETTER STRUCTURE
console.log(`WebSocket server running on port ${PORT}`);

io.on("connection", (socket) => {
  
  console.log(`Client connected: ${socket.id}`);

  socket.on("join-room", (data) => {
    if (!data || !data.roomId) {
      socket.emit("error", "Room ID is required");
      return;
    }

    socket.join(data.roomId);
    console.log(`Socket ${socket.id} joined room ${data.roomId}`);
    socket.emit("room-joined", "Room joined successfully.");
    io.to(data.roomId).emit(`${data.username} has joined the room.`)
  });

  socket.on("chat", (data) => {
    if (!data || !data.roomId || !data.message) {
      socket.emit("error", "RoomId and message required.");
      return;
    }
    console.log(`Message from ${socket.id}:`, data);
    // FIX: NEED TO STORE CHATS IN A DATABSE HERE, BETTER APPORACH IS TO USE ASYNCHRONOURS ARCHITECTURE HERE (QUEUE, a Aknowledged queue, ETL pipeline)
    socket.to(data.roomId).emit("chat",data.message)
  });

  socket.on("leave-room",(data)=>{
    if (!data || !data.roomId || !data.message) {
      socket.emit("error", "RoomId required.");
      return;
    }

    socket.leave(data.roomId)

    io.to(data.roomId).emit(`${data.username} has left the room.`)

  })

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });

  socket.on("error", (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
  });
});
