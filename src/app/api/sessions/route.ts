import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 10;

// POST /api/sessions — добавить сессию клиенту
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      clientId,
      mode,
      summary,
      situation,
      levelId,
      beingnessId,
      emotionIds,
      pitId,
      nextStep,
      duration,
      notes,
    } = body;

    if (!clientId) {
      return NextResponse.json({ error: "clientId обязателен." }, { status: 400 });
    }

    const session = await db.session.create({
      data: {
        clientId,
        mode: mode || "standard",
        summary: summary || null,
        situation: situation || null,
        levelId: levelId ?? null,
        beingnessId: beingnessId || null,
        emotionIds: emotionIds || null,
        pitId: pitId || null,
        nextStep: nextStep || null,
        duration: duration ?? null,
        notes: notes || null,
      },
    });

    return NextResponse.json(session, { status: 201 });
  } catch (err) {
    console.error("[sessions] POST error:", err);
    return NextResponse.json({ error: "Не удалось добавить сессию." }, { status: 500 });
  }
}
