"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Download, Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { BEINGNESS_BY_ID, LEVELS, EMOTIONS } from "@/lib/masterkit-data";
import type { DiagnoseResponse } from "@/lib/masterkit-prompt";
import { useI18n } from "@/components/language-provider";

/**
 * PDF-экспорт через window.print().
 * Открывает print-friendly view с полной структурой диагноза,
 * затем вызывает печать — пользователь может выбрать «Сохранить как PDF».
 */
export function PdfExport({
  open,
  onOpenChange,
  diagnosis,
  originalText,
  date,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  diagnosis: DiagnoseResponse;
  originalText?: string;
  date?: number;
}) {
  const { lang } = useI18n();
  const isEn = lang === "en";

  const handlePrint = () => {
    // Открываем print-friendly view в новом окне
    const printWindow = window.open("", "_blank", "width=800,height=900");
    if (!printWindow) {
      alert(isEn ? "Allow popups to export PDF" : "Разрешите всплывающие окна для экспорта PDF");
      return;
    }

    const html = generatePrintHtml(diagnosis, originalText, date, isEn);
    printWindow.document.write(html);
    printWindow.document.close();
    // Ждём загрузки и вызываем печать
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 300);
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <div className="text-center py-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-3">
            <Download className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-display text-lg font-semibold mb-1">
            {isEn ? "Export to PDF" : "Экспорт в PDF"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            {isEn
              ? "Save the full diagnosis as a PDF for printing or sharing with your mentor."
              : "Сохраните полный диагноз как PDF для печати или работы с наставником."}
          </p>

          {/* Превью того, что войдёт в PDF */}
          <div className="text-left rounded-lg border bg-card p-3 mb-4 text-xs space-y-1.5">
            <div className="font-semibold text-foreground">
              {isEn ? "The PDF will include:" : "В PDF войдёт:"}
            </div>
            <ul className="space-y-1 text-muted-foreground">
              <li>✓ {isEn ? "Date and original situation text" : "Дата и исходный текст ситуации"}</li>
              <li>✓ {isEn ? "Summary — what's happening" : "Сводка — что происходит"}</li>
              <li>✓ {isEn ? "Development level with description" : "Уровень развития с описанием"}</li>
              <li>✓ {isEn ? "Stuck emotions with evidence" : "Застрявшие эмоции с доказательствами"}</li>
              <li>✓ {isEn ? "Emotional pit (if any)" : "Эмоциональная яма (если есть)"}</li>
              <li>✓ {isEn ? "Leading beingness" : "Ведущая бытийность"}</li>
              <li>✓ {isEn ? "All practices with steps" : "Все проработки с шагами"}</li>
              <li>✓ {isEn ? "Next step for today" : "Следующий шаг на сегодня"}</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
              {isEn ? "Cancel" : "Отмена"}
            </Button>
            <Button className="flex-1" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
              {isEn ? "Print / Save PDF" : "Печать / Сохранить PDF"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Генерирует HTML для печати — отдельный документ с print-friendly CSS.
 */
function generatePrintHtml(
  diagnosis: DiagnoseResponse,
  originalText: string | undefined,
  date: number | undefined,
  isEn: boolean
): string {
  const formattedDate = date
    ? new Date(date).toLocaleString(isEn ? "en-US" : "ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const beingness = diagnosis.beingness
    ? BEINGNESS_BY_ID[diagnosis.beingness.id]
    : null;
  const level = LEVELS.find((l) => l.id === diagnosis.level.id);
  const emotionsData = diagnosis.emotions.map((e) => {
    const data = EMOTIONS.find((x) => x.id === e.id);
    return { ...e, data };
  });

  return `<!DOCTYPE html>
<html lang="${isEn ? "en" : "ru"}">
<head>
  <meta charset="UTF-8">
  <title>${isEn ? "Diagnosis" : "Диагноз"} — Мастер Кит</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      color: #1a1a1a;
      line-height: 1.6;
      padding: 40px;
      max-width: 720px;
      margin: 0 auto;
      background: white;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #c2624a;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      font-size: 24px;
      color: #c2624a;
      margin-bottom: 4px;
    }
    .header .subtitle {
      font-size: 13px;
      color: #666;
      font-style: italic;
    }
    .header .date {
      font-size: 12px;
      color: #888;
      margin-top: 8px;
    }
    .section {
      margin-bottom: 24px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #c2624a;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #e8d5c8;
    }
    .section-content {
      font-size: 14px;
      color: #333;
    }
    .quote {
      font-style: italic;
      color: #555;
      padding: 8px 12px;
      border-left: 3px solid #c2624a;
      background: #fdf6f0;
      margin: 8px 0;
      font-size: 13px;
    }
    .emotion {
      display: inline-block;
      padding: 4px 10px;
      margin: 2px 4px 2px 0;
      border-radius: 12px;
      font-size: 12px;
      background: #fce7f3;
      color: #831843;
    }
    .pit-box {
      background: #fef2f2;
      border: 1px solid #fca5a5;
      border-radius: 8px;
      padding: 12px;
      margin-top: 8px;
    }
    .pit-box .pit-name {
      font-weight: 700;
      color: #b91c1c;
      margin-bottom: 4px;
    }
    .beingness-box {
      background: ${beingness ? beingness.color.panel : "#f5f5f5"};
      border: 1px solid ${beingness ? beingness.color.border : "#ccc"};
      border-radius: 8px;
      padding: 12px;
      margin-top: 8px;
    }
    .beingness-box .b-name {
      font-weight: 700;
      color: ${beingness ? beingness.color.border : "#333"};
      margin-bottom: 4px;
      font-size: 15px;
    }
    .beingness-box .b-element {
      font-size: 12px;
      color: ${beingness ? beingness.color.text : "#666"};
      font-style: italic;
      margin-bottom: 6px;
    }
    .processing {
      border: 1px solid #e8d5c8;
      border-radius: 8px;
      padding: 12px;
      margin-top: 10px;
      page-break-inside: avoid;
    }
    .processing-title {
      font-weight: 700;
      color: #c2624a;
      margin-bottom: 4px;
      font-size: 14px;
    }
    .processing-why {
      font-size: 12px;
      color: #666;
      font-style: italic;
      margin-bottom: 8px;
    }
    .steps {
      counter-reset: step;
      margin-left: 0;
      list-style: none;
    }
    .steps li {
      counter-increment: step;
      padding-left: 28px;
      position: relative;
      margin-bottom: 6px;
      font-size: 13px;
    }
    .steps li::before {
      content: counter(step);
      position: absolute;
      left: 0;
      top: 0;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #c2624a;
      color: white;
      font-size: 11px;
      font-weight: 700;
      text-align: center;
      line-height: 20px;
    }
    .meta {
      font-size: 11px;
      color: #888;
      margin-top: 6px;
    }
    .next-step {
      background: linear-gradient(135deg, #fdf6f0, #fce7d4);
      border: 1px solid #c2624a;
      border-radius: 8px;
      padding: 14px;
      text-align: center;
      font-size: 14px;
      font-weight: 500;
    }
    .footer {
      margin-top: 30px;
      padding-top: 16px;
      border-top: 1px solid #e8d5c8;
      text-align: center;
      font-size: 11px;
      color: #888;
      font-style: italic;
    }
    @media print {
      body { padding: 20px; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Мастер Кит · ${isEn ? "Diagnosis" : "Диагноз"}</h1>
    <div class="subtitle">${isEn ? "AI diagnosis by Darya Trutneva's method" : "ИИ-диагностика по методике Дарьи Трутневой"}</div>
    ${formattedDate ? `<div class="date">${formattedDate}</div>` : ""}
  </div>

  ${originalText ? `
  <div class="section">
    <div class="section-title">${isEn ? "Your Situation" : "Ваша ситуация"}</div>
    <div class="section-content">
      <div class="quote">${escapeHtml(originalText)}</div>
    </div>
  </div>
  ` : ""}

  <div class="section">
    <div class="section-title">${isEn ? "What's Happening" : "Что происходит"}</div>
    <div class="section-content">${escapeHtml(diagnosis.diagnosis_summary)}</div>
  </div>

  <div class="section">
    <div class="section-title">${isEn ? "Development Level" : "Уровень развития"}</div>
    <div class="section-content">
      <strong>${escapeHtml(diagnosis.level.name)}</strong> (${diagnosis.level.id}/7)
      ${level ? ` — <span style="color:#666">${escapeHtml(level.short)}</span>` : ""}
      <div class="meta">${escapeHtml(diagnosis.level.summary)}</div>
    </div>
  </div>

  ${diagnosis.emotions.length > 0 ? `
  <div class="section">
    <div class="section-title">${isEn ? "Stuck Emotions" : "Застрявшие эмоции"}</div>
    <div class="section-content">
      ${emotionsData
        .map(
          (e) =>
            `<div style="margin-bottom:8px"><span class="emotion">${escapeHtml(e.name)}</span> <span style="font-size:12px;color:#666">(${escapeHtml(e.intensity)})</span><div class="meta">«${escapeHtml(e.evidence)}»</div></div>`
        )
        .join("")}
    </div>
  </div>
  ` : ""}

  ${diagnosis.pit ? `
  <div class="section">
    <div class="section-title">${isEn ? "Emotional Pit" : "Эмоциональная яма"}</div>
    <div class="pit-box">
      <div class="pit-name">${escapeHtml(diagnosis.pit.name)}</div>
      <div>${escapeHtml(diagnosis.pit.explanation)}</div>
      ${
        diagnosis.pit.signs_matched.length > 0
          ? `<div class="meta" style="margin-top:6px"><em>${isEn ? "Signs: " : "Признаки: "}${diagnosis.pit.signs_matched.map((s) => escapeHtml(s)).join(", ")}</em></div>`
          : ""
      }
    </div>
  </div>
  ` : ""}

  ${diagnosis.beingness ? `
  <div class="section">
    <div class="section-title">${isEn ? "Leading Beingness" : "Ведущая бытийность"}</div>
    <div class="beingness-box">
      <div class="b-name">${escapeHtml(diagnosis.beingness.name)}</div>
      ${beingness ? `<div class="b-element">${isEn ? "Element: " : "Стихия: "}${escapeHtml(beingness.element)} · ${escapeHtml(beingness.symbol)}</div>` : ""}
      <div>${escapeHtml(diagnosis.beingness.explanation)}</div>
      <div class="meta" style="margin-top:6px">«${escapeHtml(diagnosis.beingness.evidence)}»</div>
      ${beingness ? `<div class="meta" style="margin-top:6px"><strong>${isEn ? "Resource: " : "Ресурс: "}</strong>${escapeHtml(beingness.resource)}</div>` : ""}
    </div>
  </div>
  ` : ""}

  ${diagnosis.processings.length > 0 ? `
  <div class="section">
    <div class="section-title">${isEn ? "Practices" : "Проработки"}</div>
    ${diagnosis.processings
      .map(
        (p, i) => `
      <div class="processing">
        <div class="processing-title">${i + 1}. ${escapeHtml(p.title)}</div>
        <div class="processing-why">${escapeHtml(p.why_now)}</div>
        <ol class="steps">
          ${p.steps.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}
        </ol>
        <div class="meta"><strong>${isEn ? "Result: " : "Результат: "}</strong>${escapeHtml(p.expected)}</div>
        <div class="meta"><strong>${isEn ? "Duration: " : "Длительность: "}</strong>${escapeHtml(p.duration)}</div>
      </div>
    `
      )
      .join("")}
  </div>
  ` : ""}

  <div class="section">
    <div class="section-title">${isEn ? "Next Step Today" : "Следующий шаг сегодня"}</div>
    <div class="next-step">${escapeHtml(diagnosis.next_step)}</div>
  </div>

  <div class="footer">
    ${isEn
      ? "Generated by Master Kit — AI diagnosis tool based on Darya Trutneva's method. Does not replace work with a certified mentor."
      : "Сгенерировано приложением «Мастер Кит» — ИИ-диагностика по методике Дарьи Трутневой. Не заменяет работу с сертифицированным наставником."}
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
