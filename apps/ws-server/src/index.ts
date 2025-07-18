import { Server } from "socket.io";
import { createClient } from "redis";
import { createShardedAdapter } from "@socket.io/redis-adapter";
import { verifyToken  } from '@clerk/backend';
import 'dotenv/config'
process.loadEnvFile("./.env.local")

const PORT = Number(process.env.PORT) || 8080;

const redisConfig = {
  socket: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  },
  password: process.env.REDIS_PASSWORD
};

const pubClient = createClient(redisConfig);

const subClient = pubClient.duplicate();

async function clientConnect(){
  await Promise.all([
    pubClient.connect(),
    subClient.connect()
  ]);
}

clientConnect()

  console.log('Redis clients connected successfully');

const io = new Server({
  adapter : createShardedAdapter(pubClient,subClient),
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.use(async (socket, next) => {
  try {    
  const auth = socket.handshake.auth.token;
  const token = auth.token

  if (!auth || !token) {
    return next(new Error("Authentication error: No token provided"));
  }

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

    const user = socket.data.user;
    console.log(`Client connected: ${socket.id}`);

    socket.on("join-room", async (data) => {
      if (!data || !data.roomId) {
        socket.emit("error", "Room ID is required");
        return;
      }
    try {
      const roomId = data.roomId.toString();
      await socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);

        socket.emit("room-joined", {
          success: true,
          message: "Room joined successfully",
          roomId: roomId
        });

        socket.to(roomId).emit("user-event", {
          type: "user-joined",
          message: `${data.username || 'A user'} has joined the room`,
          userId: user.userId,
          username: data.username,
          timestamp: new Date().toISOString()
        });
      }catch(e){
        console.error("Join room error:", e);
        socket.emit("error", { message: "Failed to join room" });
      }
  });

  socket.on("chat", (data) => {
    if (!data || !data.roomId || !data.message) {
      socket.emit("error", "RoomId and message required.");
      return;
    }
    // FIX: NEED TO STORE CHATS IN A DATABSE HERE, BETTER APPORACH IS TO USE ASYNCHRONOURS ARCHITECTURE HERE (QUEUE, a Aknowledged queue, ETL pipeline)
    try{
      const roomId = data.roomId.toString();
      const messageData = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        message: data.message,
        userId: user.userId,
        username: data.username || 'Anonymous',
        timestamp: new Date().toISOString(),
        roomId: roomId
      };
      
      console.log(`Message from ${socket.id} in room ${roomId}:`, messageData);
      
      io.to(roomId).emit("chat", messageData);

      socket.emit("message-sent", {
        success: true,
        messageId: messageData.id,
        timestamp: messageData.timestamp
      });
    }catch(e){
      console.error("Chat error:", e);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  socket.on("leave-room",async(data)=>{
    if (!data || !data.roomId || !data.message) {
      socket.emit("error", "RoomId required.");
      return;
    }
    try{
      const roomId = data.roomId.toString();

      await socket.leave(data.roomId)

      socket.to(roomId).emit("user-event", {
        type: "user-left", 
        message: `${data.username || 'A user'} has left the room`,
        userId: user.userId,
        username: data.username,
        timestamp: new Date().toISOString()
      });

      socket.emit("room-left", {
        success: true,
        message: "Left room successfully",
        roomId: roomId
      });

    }catch(e){
      console.error("Leave room error:", e);
      socket.emit("error", { message: "Error occured." });
    }


  })

  socket.on("disconnect", (reason) => {
    console.log(`Client disconnected: ${socket.id} (${reason})`);
  });

  socket.on("error", (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
  });
});

io.listen(PORT);

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown() {
  console.log('Shutting down WebSocket server...');
  
  try {
    io.close(() => {
      console.log('Socket.IO server closed');
    });
    
    await pubClient.quit();
    await subClient.quit();
    
    console.log('WebSocket server shutdown complete');
    process.exit(0);
    
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

pubClient.on('connect', () => {
  console.log('Redis pub client connected');
});

subClient.on('connect', () => {
  console.log('Redis sub client connected');
});

pubClient.on('error', (err) => {
  console.error('Redis pub client error:', err);
});

subClient.on('error', (err) => {
  console.error('Redis sub client error:', err);
});