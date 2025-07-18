import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@workspace/db/prisma";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req:NextRequest,{params}:{params:{slug : string}}){
    try{
        const user = currentUser()

        if (!user) {
            return NextResponse.json({
                error: "Unauthorized"
            }, { status: 401 });
        }

        if (!params.slug) {
            return NextResponse.json({
                error: "Missing slug"
            }, { status: 400 });
        }

        const slug = params.slug
        

        const data = await prisma.room.findFirst({
            where : {
                slug 
            },
            select : {
                id: true
            }
        })
        
        if (!data) {
            return NextResponse.json({
                error: "No room found with this slug."
            }, { status: 404 });
        }


        return NextResponse.json({
            id : data?.id
        })

    }catch(e:any){
        console.error('Error fetching slug:', e);
        return NextResponse.json({
            error: "Internal server error"
        }, { status: 500 });
    }
}