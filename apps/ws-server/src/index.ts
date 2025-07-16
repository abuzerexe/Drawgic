import { Server } from "socket.io";

const io = new Server(3002, { /* options */ });

io.on("connection", (socket) => {
  const url = socket.request.url

  if(!url){
    return
  }

  const queryParams = new URLSearchParams(url.split('?')[1])

  // const 
});