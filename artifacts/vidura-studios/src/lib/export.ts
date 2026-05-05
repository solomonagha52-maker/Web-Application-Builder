import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle } from "docx";
import type { Scene } from "./database";

export interface ExportPayload {
  courseName: string;
  moduleName: string;
  scenes: Scene[];
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function buildFilename(moduleName: string, ext: "pdf" | "docx"): string {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const safe = moduleName
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .substring(0, 60);
  return `${safe}_${today}.${ext}`;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────
// PDF Export (jsPDF)
// ─────────────────────────────────────────────────────────────

export async function exportScriptAsPDF(payload: ExportPayload): Promise<void> {
  const { courseName, moduleName, scenes } = payload;
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  const PAGE_W = doc.internal.pageSize.getWidth();
  const PAGE_H = doc.internal.pageSize.getHeight();
  const MARGIN_L = 20;
  const MARGIN_R = 20;
  const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R;
  const MARGIN_TOP = 18;
  const FOOTER_H = 14;
  const USABLE_H = PAGE_H - FOOTER_H;

  let y = MARGIN_TOP;

  // ── Branded teal header bar ──────────────────────────────
  doc.setFillColor(0, 77, 64); // #004D40
  doc.rect(0, 0, PAGE_W, 14, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("VIDURA STUDIOS", MARGIN_L, 9);

  const headerDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(headerDate, PAGE_W - MARGIN_R, 9, { align: "right" });

  y = 22;

  // ── Course & Module info ─────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(26, 26, 26);
  const courseLines = doc.splitTextToSize(courseName, CONTENT_W);
  doc.text(courseLines, MARGIN_L, y);
  y += courseLines.length * 7 + 2;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  const modLines = doc.splitTextToSize(`Module: ${moduleName}`, CONTENT_W);
  doc.text(modLines, MARGIN_L, y);
  y += modLines.length * 5.5 + 2;

  // ── Teal divider ─────────────────────────────────────────
  doc.setDrawColor(0, 77, 64);
  doc.setLineWidth(0.5);
  doc.line(MARGIN_L, y, PAGE_W - MARGIN_R, y);
  y += 6;

  // ── Helper: add new page with header ─────────────────────
  const addPage = () => {
    addFooter();
    doc.addPage();

    doc.setFillColor(0, 77, 64);
    doc.rect(0, 0, PAGE_W, 14, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text("VIDURA STUDIOS", MARGIN_L, 9);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(headerDate, PAGE_W - MARGIN_R, 9, { align: "right" });

    y = 22;
  };

  // ── Helper: page footer ───────────────────────────────────
  const addFooter = () => {
    const pageNum = doc.getNumberOfPages();
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(160, 160, 160);
    doc.text(`Page ${pageNum}`, PAGE_W / 2, PAGE_H - 6, { align: "center" });
    doc.text("Vidura Studios — Script Export", MARGIN_L, PAGE_H - 6);
  };

  // ── Helper: check remaining space ────────────────────────
  const ensureSpace = (needed: number) => {
    if (y + needed > USABLE_H) addPage();
  };

  // ── Scenes ───────────────────────────────────────────────
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];

    // Scene separator after first
    if (i > 0) {
      ensureSpace(8);
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
      doc.line(MARGIN_L, y, PAGE_W - MARGIN_R, y);
      y += 6;
    }

    // Scene title
    ensureSpace(12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(0, 77, 64); // teal
    const titleLines = doc.splitTextToSize(scene.title || `Scene ${i + 1}`, CONTENT_W);
    ensureSpace(titleLines.length * 6 + 2);
    doc.text(titleLines, MARGIN_L, y);
    y += titleLines.length * 6 + 4;

    // Visual Cue label
    ensureSpace(10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.text("VISUAL CUE", MARGIN_L, y);
    y += 4;

    // Visual Cue text (italic)
    if (scene.visual_cue) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9.5);
      doc.setTextColor(80, 80, 80);
      const cueLines = doc.splitTextToSize(scene.visual_cue, CONTENT_W);
      ensureSpace(cueLines.length * 5 + 3);

      // Light grey background for visual cue
      doc.setFillColor(240, 244, 244);
      doc.roundedRect(MARGIN_L - 2, y - 3.5, CONTENT_W + 4, cueLines.length * 5 + 5, 1, 1, "F");
      doc.text(cueLines, MARGIN_L, y);
      y += cueLines.length * 5 + 6;
    }

    // Script label
    ensureSpace(10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(0, 77, 64);
    doc.text("VOICEOVER SCRIPT", MARGIN_L, y);
    y += 4;

    // Script text
    if (scene.script_text) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(26, 26, 26);
      const scriptLines = doc.splitTextToSize(scene.script_text, CONTENT_W);
      ensureSpace(scriptLines.length * 5.5 + 4);
      doc.text(scriptLines, MARGIN_L, y);
      y += scriptLines.length * 5.5 + 8;
    }
  }

  addFooter();

  const blob = doc.output("blob");
  triggerDownload(blob, buildFilename(moduleName, "pdf"));
}

// ─────────────────────────────────────────────────────────────
// Word Export (docx)
// ─────────────────────────────────────────────────────────────

export async function exportScriptAsDocx(payload: ExportPayload): Promise<void> {
  const { courseName, moduleName, scenes } = payload;

  const TEAL = "004D40";
  const GOLD = "CCAC00";
  const GREY = "F0F4F4";
  const DARK = "1A1A1A";
  const MID_GREY = "787878";

  const children: Paragraph[] = [];

  // ── Header: branding paragraph ───────────────────────────
  children.push(
    new Paragraph({
      shading: { type: "clear", fill: TEAL, color: TEAL },
      spacing: { before: 0, after: 120 },
      children: [
        new TextRun({
          text: "VIDURA STUDIOS",
          bold: true,
          size: 24,
          color: "FFFFFF",
          font: "Calibri",
        }),
        new TextRun({
          text: `   Script Export — ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
          size: 18,
          color: "DDDDDD",
          font: "Calibri",
        }),
      ],
    })
  );

  // ── Course name ──────────────────────────────────────────
  children.push(
    new Paragraph({
      spacing: { before: 240, after: 80 },
      children: [
        new TextRun({
          text: courseName,
          bold: true,
          size: 32,
          color: DARK,
          font: "Calibri",
        }),
      ],
    })
  );

  // ── Module name ──────────────────────────────────────────
  children.push(
    new Paragraph({
      spacing: { before: 0, after: 60 },
      children: [
        new TextRun({
          text: "Module: ",
          bold: true,
          size: 22,
          color: MID_GREY,
          font: "Calibri",
        }),
        new TextRun({
          text: moduleName,
          size: 22,
          color: MID_GREY,
          font: "Calibri",
        }),
      ],
    })
  );

  // ── Horizontal rule via thick bottom border ───────────────
  children.push(
    new Paragraph({
      spacing: { before: 80, after: 240 },
      border: {
        bottom: {
          color: TEAL,
          style: BorderStyle.SINGLE,
          size: 6,
        },
      },
      children: [],
    })
  );

  // ── Scenes ───────────────────────────────────────────────
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];

    // Scene divider (after first)
    if (i > 0) {
      children.push(
        new Paragraph({
          spacing: { before: 240, after: 240 },
          border: {
            bottom: {
              color: "DDDDDD",
              style: BorderStyle.SINGLE,
              size: 3,
            },
          },
          children: [],
        })
      );
    }

    // Scene title
    children.push(
      new Paragraph({
        spacing: { before: 160, after: 80 },
        children: [
          new TextRun({
            text: scene.title || `Scene ${i + 1}`,
            bold: true,
            size: 26,
            color: TEAL,
            font: "Calibri",
          }),
        ],
      })
    );

    // Visual Cue label
    children.push(
      new Paragraph({
        spacing: { before: 80, after: 40 },
        children: [
          new TextRun({
            text: "VISUAL CUE",
            bold: true,
            size: 16,
            color: MID_GREY,
            font: "Calibri",
            allCaps: true,
          }),
        ],
      })
    );

    // Visual Cue text (shaded box, italic)
    if (scene.visual_cue) {
      children.push(
        new Paragraph({
          shading: { type: "clear", fill: GREY, color: GREY },
          spacing: { before: 40, after: 120 },
          indent: { left: 120 },
          children: [
            new TextRun({
              text: scene.visual_cue,
              italics: true,
              size: 20,
              color: "505050",
              font: "Calibri",
            }),
          ],
        })
      );
    }

    // Script label
    children.push(
      new Paragraph({
        spacing: { before: 80, after: 40 },
        children: [
          new TextRun({
            text: "VOICEOVER SCRIPT",
            bold: true,
            size: 16,
            color: TEAL,
            font: "Calibri",
            allCaps: true,
          }),
        ],
      })
    );

    // Script text
    if (scene.script_text) {
      children.push(
        new Paragraph({
          spacing: { before: 40, after: 160 },
          children: [
            new TextRun({
              text: scene.script_text,
              size: 22,
              color: DARK,
              font: "Calibri",
            }),
          ],
        })
      );
    }
  }

  // ── Footer paragraph ─────────────────────────────────────
  children.push(
    new Paragraph({
      spacing: { before: 480, after: 0 },
      alignment: AlignmentType.CENTER,
      border: {
        top: {
          color: "DDDDDD",
          style: BorderStyle.SINGLE,
          size: 3,
        },
      },
      children: [
        new TextRun({
          text: `Generated by Vidura Studios · ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
          size: 16,
          color: MID_GREY,
          font: "Calibri",
          italics: true,
        }),
      ],
    })
  );

  const docFile = new Document({
    creator: "Vidura Studios",
    title: `${courseName} — ${moduleName}`,
    description: "Script export from Vidura Studios",
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 1080, right: 1080 },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(docFile);
  triggerDownload(blob, buildFilename(moduleName, "docx"));
}
