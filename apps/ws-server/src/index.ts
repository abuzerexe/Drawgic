import { Server } from "socket.io";

const io = new Server(3000, { /* options */ });

io.on("connection", (socket) => {
  console.log("rooms: "+ socket.rooms)
//   socket.join("room1")
  socket.send("connection established successfully")
});