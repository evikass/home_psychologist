import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 10;

// GET /api/clients — список всех клиентов
export async function GET() {
  try {
    const clients = await db.client.findMany({
      include: {
        sessions: {
          select: {
            id: true,
            date: true,
            mode: true,
            summary: true,
          },
          orderBy: { date: "desc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(clients);
  } catch (err) {
    console.error("[clients] GET error:", err);
    return NextResponse.json({ error: "Не удалось получить список клиентов." }, { status: 500 });
  }
}

// POST /api/clients — создать клиента
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { name, phone, email, notes, tags } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json({ error: "Имя обязательно (минимум 2 символа)." }, { status: 400 });
    }

    const client = await db.client.create({
      data: {
        name: name.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        notes: notes?.trim() || null,
        tags: tags?.trim() || null,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (err) {
    console.error("[clients] POST error:", err);
    return NextResponse.json({ error: "Не удалось создать клиента." }, { status: 500 });
  }
}
