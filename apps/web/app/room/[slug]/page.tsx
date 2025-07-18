"use client"

import { io } from "socket.io-client";
import { useAuth } from "@clerk/nextjs";

export default function Page() {
        const auth = useAuth()
        
  test(auth)
}

async function test(auth: any){
      const token = await auth.getToken();
    console.log("token: "+token)
  const socket = io("http://localhost:8080", {
    auth: { token },
  });

  socket.on("connect_error", err => console.error("Auth failed", err.message));
}