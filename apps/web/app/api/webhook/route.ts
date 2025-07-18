import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import { prisma } from '@workspace/db/prisma';

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, svix-id, svix-timestamp, svix-signature',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const payloadString = await req.text();
    
    const svixHeaders = {
      'svix-id': req.headers.get('svix-id') ?? '',
      'svix-timestamp': req.headers.get('svix-timestamp') ?? '',
      'svix-signature': req.headers.get('svix-signature') ?? '',
    };

    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET_KEY!);
    const evt = wh.verify(payloadString, svixHeaders) as WebhookEvent;

    const userData = evt.data;
    const eventType = evt.type;

    switch (eventType) {
      case 'user.created':
        console.log(`User ${userData.id} was ${eventType}`);
        console.log(userData);
        
        await prisma.user.create({
          data: {
            id: userData.id as string,
            email: (userData as any).email_addresses?.[0]?.email_address || '',
            fristName: (userData as any).first_name || '',
            lastName: (userData as any).last_name || '',
            photo: (userData as any).image_url || null,
          }
        });
        
        console.log(`User ${userData.id} saved to database`);
        break;

      case 'user.updated':
        console.log(`User ${userData.id} was ${eventType}`);
        
        await prisma.user.update({
          where: { id: userData.id as string },
          data: {
            email: (userData as any).email_addresses?.[0]?.email_address || '',
            fristName: (userData as any).first_name || '',
            lastName: (userData as any).last_name || '',
            photo: (userData as any).image_url || null,
          }
        });
        
        console.log(`User ${userData.id} updated in database`);
        break;

      case 'user.deleted':
        console.log(`User ${userData.id} was ${eventType}`);
        
        await prisma.user.delete({
          where: { id: userData.id as string }
        });
        
        console.log(`User ${userData.id} deleted from database`);
        break;

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook received',
    });

  } catch (err: any) {
    console.error('Webhook error:', err);
    
    return NextResponse.json({
      success: false,
      message: err.message,
    }, { status: 400 });
  }
}