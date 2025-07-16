
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from '@clerk/nextjs/server'
import {CreateRoomSchema} from "@workspace/common/types"


export async function GET(req: NextRequest){
    const user = await currentUser()
      
    if(!user){
        return NextResponse.json({
            error: "Unauthroized"
        }, { status: 401 })
    }

    new WebSocket("ws://localhost:3002")
    console.log("connected to ws")


    return NextResponse.json({
        error: "Reached"
    })

}