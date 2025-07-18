import { NextRequest, NextResponse } from "next/server";
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from "@workspace/db/prisma";


// FIX : rate limiting, room permissions (for now anyone can query the room id can get chat information,which should not happen)
export async function GET(req:NextRequest,{ params }: { params: { roomId: string } }
) {
    try {
        const user = await currentUser();

        if (!user) {
            return NextResponse.json({
                error: "Unauthorized"
            }, { status: 401 });
        }
        
        if (!params.roomId) {
            return NextResponse.json({
                error: "Missing room id"
            }, { status: 400 });
        }
        const roomId = params.roomId;


        const roomIdNumber = parseInt(roomId);
        if (isNaN(roomIdNumber)) {
            return NextResponse.json({
                error: "Invalid room id format"
            }, { status: 400 });
        }

        const chats = await prisma.chat.findMany({
            where: {
                roomId: roomIdNumber
            },
            orderBy: {
                id: 'desc' 
            },
            take : 50,
            include: {
                user: {
                    select: {
                        id: true,
                        fristName: true,
                        lastName: true,
                        photo: true
                    }
                }
            }
        });

        return NextResponse.json({
            chats 
        });
        
    } catch (e: any) {
        console.error('Error fetching chats:', e);
        return NextResponse.json({
            error: "Internal server error"
        }, { status: 500 });
    }
}
