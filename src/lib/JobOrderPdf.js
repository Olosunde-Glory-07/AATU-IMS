// src/lib/jobOrderPdf.js
//
// Generates the official AATU Job Order PDF in the browser using pdf-lib.
// No backend/server function needed — this runs entirely client-side.
//
// Install:
//   npm install pdf-lib
//
// Usage (see bottom of file for the two exported functions):
//   import { generateJobOrderPdf, uploadJobOrderPdf } from "../lib/jobOrderPdf";
//
//   const pdfBytes = await generateJobOrderPdf(jobOrderData);
//   const publicUrl = await uploadJobOrderPdf(supabase, jobOrderData.id, pdfBytes);

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// ─── Brand colours (matching the AATU design tokens) ──────────────────────────
const COLORS = {
  primary:      rgb(0x21 / 255, 0x00 / 255, 0x00 / 255), // #210000
  primaryLight: rgb(0xd2 / 255, 0x6a / 255, 0x5f / 255), // #d26a5f
  text:         rgb(0x15 / 255, 0x1c / 255, 0x27 / 255), // #151c27
  textMuted:    rgb(0x55 / 255, 0x42 / 255, 0x40 / 255), // #554240
  border:       rgb(0xdc / 255, 0xc0 / 255, 0xbd / 255), // #dcc0bd
  surfaceLow:   rgb(0xf0 / 255, 0xf3 / 255, 0xff / 255), // #f0f3ff
  white:        rgb(1, 1, 1),
  error:        rgb(0xba / 255, 0x1a / 255, 0x1a / 255), // #ba1a1a
  emergency:    rgb(0x99 / 255, 0x1b / 255, 0x1b / 255),
  high:         rgb(0x92 / 255, 0x40 / 255, 0x0e / 255),
  secondary:    rgb(0x39 / 255, 0x68 / 255, 0x44 / 255), // #396844
};

const PAGE = { width: 595.28, height: 841.89 }; // A4 in points
const MARGIN = 48;

/**
 * Build the Job Order PDF and return it as a Uint8Array.
 *
 * @param {Object} order
 * @param {string} order.id              - Job order ID, e.g. "JO-88421" (no leading #)
 * @param {string} order.requestId       - Linked request ID, e.g. "REQ-0942"
 * @param {string} order.title           - Task description / issue title
 * @param {string} order.location        - Physical location
 * @param {string} order.department      - Department name
 * @param {string} order.priority        - "Emergency" | "High" | "Medium" | "Low"
 * @param {string} order.category        - Category, e.g. "Electrical"
 * @param {string} order.description     - Full description from the original request
 * @param {string} order.reporterName    - Who originally filed the request
 * @param {string} order.reporterRole    - "Student" | "Staff"
 * @param {string} order.technicianName  - Assigned technician's name
 * @param {string} order.technicianSpecialty - Technician's specialty/trade
 * @param {string} order.adminName       - Admin who approved/assigned (auto-signed)
 * @param {string} order.adminSignedAt   - ISO date string of admin approval
 * @param {string} order.notes           - Optional note left for the technician
 * @param {string} [order.createdAt]     - ISO date string of when the job order was created
 * @returns {Promise<Uint8Array>}
 */
export async function generateJobOrderPdf(order) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([PAGE.width, PAGE.height]);

  const font     = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontMono = await pdfDoc.embedFont(StandardFonts.Courier);

  let y = PAGE.height - MARGIN;
  const contentWidth = PAGE.width - MARGIN * 2;

  // ── Header band ──────────────────────────────────────────────────────────
  const headerHeight = 64;
  page.drawRectangle({
    x: 0, y: PAGE.height - headerHeight,
    width: PAGE.width, height: headerHeight,
    color: COLORS.primary,
  });

  page.drawText("AATU", {
    x: MARGIN, y: PAGE.height - 32,
    size: 22, font: fontBold, color: COLORS.white,
  });
  page.drawText("INFRASTRUCTURE MANAGEMENT SYSTEM", {
    x: MARGIN, y: PAGE.height - 48,
    size: 8, font, color: COLORS.primaryLight,
  });

  page.drawText("JOB ORDER", {
    x: PAGE.width - MARGIN - fontBold.widthOfTextAtSize("JOB ORDER", 18),
    y: PAGE.height - 30,
    size: 18, font: fontBold, color: COLORS.white,
  });
  page.drawText(`#${order.id}`, {
    x: PAGE.width - MARGIN - fontMono.widthOfTextAtSize(`#${order.id}`, 10),
    y: PAGE.height - 46,
    size: 10, font: fontMono, color: COLORS.primaryLight,
  });

  y = PAGE.height - headerHeight - 28;

  // ── Priority badge + dates row ───────────────────────────────────────────
  const priorityColor = order.priority === "Emergency" ? COLORS.emergency
    : order.priority === "High" ? COLORS.high
    : COLORS.textMuted;
  const priorityLabel = (order.priority || "MEDIUM").toUpperCase();
  const badgeWidth = fontBold.widthOfTextAtSize(priorityLabel, 9) + 16;

  page.drawRectangle({
    x: MARGIN, y: y - 4, width: badgeWidth, height: 16,
    color: rgb(priorityColor.red, priorityColor.green, priorityColor.blue),
    opacity: 0.12,
  });
  page.drawText(priorityLabel, {
    x: MARGIN + 8, y: y, size: 9, font: fontBold, color: priorityColor,
  });

  const createdLabel = `Issued: ${formatDate(order.createdAt)}`;
  page.drawText(createdLabel, {
    x: PAGE.width - MARGIN - font.widthOfTextAtSize(createdLabel, 9),
    y, size: 9, font, color: COLORS.textMuted,
  });

  y -= 30;

  // ── Title ─────────────────────────────────────────────────────────────────
  const titleLines = wrapText(order.title || "Untitled Task", fontBold, 16, contentWidth);
  titleLines.forEach((line) => {
    page.drawText(line, { x: MARGIN, y, size: 16, font: fontBold, color: COLORS.text });
    y -= 20;
  });
  y -= 6;

  // ── Divider ───────────────────────────────────────────────────────────────
  page.drawLine({
    start: { x: MARGIN, y }, end: { x: PAGE.width - MARGIN, y },
    thickness: 1, color: COLORS.border,
  });
  y -= 24;

  // ── Info grid (2 columns) ────────────────────────────────────────────────
  const colWidth = contentWidth / 2;
  const fields = [
    ["LINKED REQUEST",   `#${order.requestId || "—"}`],
    ["CATEGORY",         order.category || "—"],
    ["LOCATION",         order.location || "—"],
    ["DEPARTMENT",       order.department || "—"],
    ["REPORTED BY",      `${order.reporterName || "—"}${order.reporterRole ? ` (${order.reporterRole})` : ""}`],
    ["ASSIGNED TECHNICIAN", order.technicianName || "—"],
  ];

  let rowY = y;
  fields.forEach(([label, value], i) => {
    const col = i % 2;
    const rowStart = Math.floor(i / 2);
    const x = MARGIN + col * colWidth;
    const fy = y - rowStart * 42;

    page.drawText(label, { x, y: fy, size: 8, font: fontBold, color: COLORS.textMuted });
    page.drawText(String(value), { x, y: fy - 14, size: 11, font, color: COLORS.text, maxWidth: colWidth - 20 });
  });

  y -= Math.ceil(fields.length / 2) * 42 + 12;

  // ── Description box ──────────────────────────────────────────────────────
  if (order.description) {
    page.drawText("DESCRIPTION", { x: MARGIN, y, size: 8, font: fontBold, color: COLORS.textMuted });
    y -= 14;

    const descLines = wrapText(order.description, font, 10, contentWidth - 24);
    const boxHeight = Math.max(40, descLines.length * 13 + 16);

    page.drawRectangle({
      x: MARGIN, y: y - boxHeight + 12, width: contentWidth, height: boxHeight,
      color: COLORS.surfaceLow, borderColor: COLORS.border, borderWidth: 1,
    });

    let dy = y - 4;
    descLines.forEach((line) => {
      page.drawText(line, { x: MARGIN + 12, y: dy, size: 10, font, color: COLORS.text });
      dy -= 13;
    });
    y -= boxHeight + 16;
  }

  // ── Note for technician ──────────────────────────────────────────────────
  if (order.notes) {
    page.drawText("NOTE FOR TECHNICIAN", { x: MARGIN, y, size: 8, font: fontBold, color: COLORS.textMuted });
    y -= 14;
    const noteLines = wrapText(order.notes, font, 10, contentWidth - 24);
    const boxHeight = Math.max(32, noteLines.length * 13 + 16);
    page.drawRectangle({
      x: MARGIN, y: y - boxHeight + 12, width: contentWidth, height: boxHeight,
      color: COLORS.white, borderColor: COLORS.border, borderWidth: 1,
    });
    let ny = y - 4;
    noteLines.forEach((line) => {
      page.drawText(line, { x: MARGIN + 12, y: ny, size: 10, font, color: COLORS.text });
      ny -= 13;
    });
    y -= boxHeight + 20;
  }

  // ── Approval / Signature section ─────────────────────────────────────────
  // Always pin signature blocks near the bottom of the page for consistency.
  const sigSectionTop = 230;
  y = Math.min(y, sigSectionTop);

  page.drawText("APPROVAL & AUTHORIZATION", {
    x: MARGIN, y, size: 10, font: fontBold, color: COLORS.text,
  });
  y -= 8;
  page.drawLine({
    start: { x: MARGIN, y }, end: { x: PAGE.width - MARGIN, y },
    thickness: 1, color: COLORS.border,
  });
  y -= 28;

  const sigColWidth = (contentWidth - 24) / 2;
  drawSignatureBlock(page, {
    x: MARGIN, y, width: sigColWidth,
    label: "ADMINISTRATOR APPROVAL",
    name: order.adminName,
    date: order.adminSignedAt ? formatDate(order.adminSignedAt) : null,
    statusText: order.adminSignedAt ? "Digitally approved in system" : "Pending",
    font, fontBold, signed: !!order.adminSignedAt,
  });

  drawSignatureBlock(page, {
    x: MARGIN + sigColWidth + 24, y, width: sigColWidth,
    label: "HEAD OF DEPARTMENT APPROVAL",
    name: order.hodName || null,
    date: order.hodSignedAt ? formatDate(order.hodSignedAt) : null,
    statusText: order.hodSignedAt ? "Physically signed — see uploaded proof" : "Pending physical signature",
    font, fontBold, signed: !!order.hodSignedAt,
    isPhysical: true,
  });

  y -= 100;

  // ── Footer ────────────────────────────────────────────────────────────────
  page.drawLine({
    start: { x: MARGIN, y: 50 }, end: { x: PAGE.width - MARGIN, y: 50 },
    thickness: 0.5, color: COLORS.border,
  });
  page.drawText("AATU Infrastructure Management System — Generated Document", {
    x: MARGIN, y: 36, size: 7, font, color: COLORS.textMuted,
  });
  page.drawText(`Printed: ${formatDate(new Date().toISOString())}`, {
    x: PAGE.width - MARGIN - font.widthOfTextAtSize(`Printed: ${formatDate(new Date().toISOString())}`, 7),
    y: 36, size: 7, font, color: COLORS.textMuted,
  });

  return pdfDoc.save();
}

// ─── Signature block drawer ────────────────────────────────────────────────
function drawSignatureBlock(page, { x, y, width, label, name, date, statusText, font, fontBold, signed, isPhysical }) {
  page.drawText(label, { x, y, size: 8, font: fontBold, color: COLORS.textMuted });

  // Signature line
  const lineY = y - 38;
  page.drawLine({
    start: { x, y: lineY }, end: { x: x + width, y: lineY },
    thickness: 1, color: COLORS.text,
  });

  if (signed && name) {
    page.drawText(name, { x, y: lineY + 6, size: 13, font: fontBold, color: COLORS.text });
  } else if (isPhysical) {
    page.drawText("(Sign here)", { x, y: lineY + 6, size: 10, font, color: COLORS.textMuted });
  }

  page.drawText("Name & Signature", { x, y: lineY - 12, size: 7, font, color: COLORS.textMuted });

  if (date) {
    page.drawText(`Date: ${date}`, { x, y: lineY - 24, size: 8, font, color: COLORS.textMuted });
  } else {
    page.drawText("Date: _______________", { x, y: lineY - 24, size: 8, font, color: COLORS.textMuted });
  }

  const statusColor = signed ? COLORS.secondary : COLORS.high;
  page.drawText(statusText, { x, y: lineY - 38, size: 7.5, font, color: statusColor });
}

// ─── Text wrapping helper ───────────────────────────────────────────────────
function wrapText(text, font, size, maxWidth) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let current = "";

  words.forEach((word) => {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  });
  if (current) lines.push(current);
  return lines;
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) +
    ", " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

// ─── Supabase Storage upload helper ────────────────────────────────────────
/**
 * Upload generated PDF bytes to a private Supabase Storage bucket and
 * return a signed URL the technician/admin can use to view/download it.
 *
 * Requires a bucket named 'job-orders' to exist (private, not public).
 * Create it once in Supabase Dashboard → Storage → New bucket → "job-orders" (private).
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} jobOrderId
 * @param {Uint8Array} pdfBytes
 * @param {number} [expiresInSeconds=60*60*24*7] - signed URL validity (default 7 days)
 * @returns {Promise<string>} signed URL
 */
export async function uploadJobOrderPdf(supabase, jobOrderId, pdfBytes, expiresInSeconds = 60 * 60 * 24 * 7) {
  const filePath = `job-orders/${jobOrderId}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from("job-orders")
    .upload(filePath, pdfBytes, {
      contentType: "application/pdf",
      upsert: true, // overwrite if regenerated (e.g. on reassignment)
    });

  if (uploadError) throw uploadError;

  const { data: signedUrlData, error: signError } = await supabase.storage
    .from("job-orders")
    .createSignedUrl(filePath, expiresInSeconds);

  if (signError) throw signError;

  return signedUrlData.signedUrl;
}

/**
 * Upload a technician-submitted photo of the physically signed job order
 * (the "proof of HOD signature" image) to a separate path in the same bucket.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} jobOrderId
 * @param {File} imageFile - from an <input type="file" accept="image/*"> element
 * @returns {Promise<string>} signed URL of the uploaded proof image
 */
export async function uploadHodApprovalProof(supabase, jobOrderId, imageFile) {
  const ext = imageFile.name.split(".").pop() || "jpg";
  const filePath = `job-orders/${jobOrderId}-hod-proof.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("job-orders")
    .upload(filePath, imageFile, {
      contentType: imageFile.type || "image/jpeg",
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data: signedUrlData, error: signError } = await supabase.storage
    .from("job-orders")
    .createSignedUrl(filePath, 60 * 60 * 24 * 30); // 30 days

  if (signError) throw signError;

  return signedUrlData.signedUrl;
}

/**
 * Convenience: trigger a browser download of generated PDF bytes without
 * needing Supabase at all (useful for an instant "Preview/Download" button
 * before or without persisting to Storage).
 *
 * @param {Uint8Array} pdfBytes
 * @param {string} filename
 */
export function downloadPdfBytes(pdfBytes, filename = "job-order.pdf") {
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}