import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Mark as read
  const message = await prisma.message.update({
    where: { id },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ data: message });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { body } = await req.json();

  const reply = await prisma.messageReply.create({
    data: {
      body,
      messageId: id,
      senderId: session.user.id,
    },
  });

  return NextResponse.json({ data: reply }, { status: 201 });
}
