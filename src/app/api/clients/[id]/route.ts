import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 10;

// GET /api/clients/[id] — карточка клиента с сессиями
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = await db.client.findUnique({
      where: { id },
      include: {
        sessions: {
          orderBy: { date: "desc" },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Клиент не найден." }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (err) {
    console.error("[clients] GET by id error:", err);
    return NextResponse.json({ error: "Ошибка." }, { status: 500 });
  }
}

// PUT /api/clients/[id] — обновить клиента
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { name, phone, email, notes, tags, status } = body;

    const client = await db.client.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(email !== undefined && { email: email?.trim() || null }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
        ...(tags !== undefined && { tags: tags?.trim() || null }),
        ...(status !== undefined && { status }),
      },
    });

    return NextResponse.json(client);
  } catch (err) {
    console.error("[clients] PUT error:", err);
    return NextResponse.json({ error: "Не удалось обновить." }, { status: 500 });
  }
}

// DELETE /api/clients/[id] — удалить клиента
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.client.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[clients] DELETE error:", err);
    return NextResponse.json({ error: "Не удалось удалить." }, { status: 500 });
  }
}
