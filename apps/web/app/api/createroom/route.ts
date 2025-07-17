
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from '@clerk/nextjs/server'
import {CreateRoomSchema} from "@workspace/common/types"
import {prisma} from "@workspace/db/prisma"

export async function POST(req: NextRequest){
    try{    
        const user = await currentUser()
        
        if(!user){
            return NextResponse.json({
                error: "Unauthroized"
            }, { status: 401 })
        }
        
        const {roomName} = await req.json()
        const check = CreateRoomSchema.safeParse(roomName)

        if(!check.success){
            return NextResponse.json({
                error: check.error.message
            }, { status: 422 })
        }

        const success = await prisma.room.create({
            data:{
                slug : roomName,
                adminId: user.id
            }
        })

        if(!success){
            return NextResponse.json({
                error: "Error"
            }, { status: 500 })
        }

        return NextResponse.json({
            msg: "Room created Successfully."
        })
        
    }catch(e:any){
        return NextResponse.json({
            error: "Error."
        }, { status: 500 })
    }
}