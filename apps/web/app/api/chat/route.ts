import { NextRequest, NextResponse } from "next/server";
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from "@workspace/db/prisma";


export async function GET(req: NextRequest){
    try{
        const user = await currentUser();

        if(!user){
            return NextResponse.json({
                error: "Unauthroized"
            }, { status: 401 })
        }
        
        const roomId = req.nextUrl.searchParams.get('room');

        if (!roomId) {
            return NextResponse.json({
                error: "Missing room id"
            }, { status: 400 });
        }

        const chats = await prisma.chat.findMany({
            where: {
                roomId: parseInt(roomId)
            }
        });

        return NextResponse.json({
            chats 
        })
        
    }catch(e:any){
        return NextResponse.json({
            error : "Error."
        },{status: 500})
    }
}