import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export interface CardData {
  ownerFirstName: string;
  emergencyUrl: string;
  pinHint?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  bloodType?: string | null;
  criticalAllergy?: string | null;
  trustedContactName?: string | null;
  variant: 'wallet' | 'fridge';
}

// Avery 8371 — 10 cards per US Letter sheet, 3.5" x 2"
const PAGE_W = 8.5 * 72; // pt
const PAGE_H = 11 * 72;
const CARD_W = 3.5 * 72;
const CARD_H = 2.0 * 72;
const COL_GAP = 0.125 * 72;
const ROW_GAP = 0;
const MARGIN_X = (PAGE_W - 2 * CARD_W - COL_GAP) / 2;
const MARGIN_Y = 0.5 * 72;

async function qrDataUrl(text: string): Promise<string> {
  return await QRCode.toDataURL(text, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 220,
    color: { dark: '#000000', light: '#FFFFFF' },
  });
}

function drawCardFront(pdf: jsPDF, x: number, y: number, qr: string, data: CardData) {
  // Border
  pdf.setDrawColor(180);
  pdf.setLineWidth(0.5);
  pdf.rect(x, y, CARD_W, CARD_H);

  // Title bar
  pdf.setFillColor(20, 33, 61);
  pdf.rect(x, y, CARD_W, 14, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.text('THE SURVIVOR PACKET', x + 6, y + 9);
  pdf.setFontSize(6);
  pdf.text('EMERGENCY INFO', x + CARD_W - 6, y + 9, { align: 'right' });

  // Owner name
  pdf.setTextColor(20, 33, 61);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text(data.ownerFirstName.toUpperCase(), x + 8, y + 28);
  if (data.trustedContactName) {
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(120);
    pdf.text(`Card for: ${data.trustedContactName}`, x + 8, y + 36);
  }

  // QR
  const qrSize = 78;
  pdf.addImage(qr, 'PNG', x + CARD_W - qrSize - 8, y + 18, qrSize, qrSize);

  // Footer text
  pdf.setTextColor(60);
  pdf.setFontSize(6);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Scan QR for emergency', x + 8, y + CARD_H - 14);
  pdf.text('medical information', x + 8, y + CARD_H - 7);
}

function drawCardBack(pdf: jsPDF, x: number, y: number, data: CardData) {
  pdf.setDrawColor(180);
  pdf.setLineWidth(0.5);
  pdf.rect(x, y, CARD_W, CARD_H);

  pdf.setTextColor(20, 33, 61);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.text('IF FOUND, PLEASE RETURN TO:', x + 8, y + 12);
  pdf.setFontSize(9);
  pdf.text(data.ownerFirstName, x + 8, y + 22);

  let cy = y + 34;
  pdf.setFontSize(6);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(120);

  if (data.emergencyContactName) {
    pdf.text('EMERGENCY CONTACT', x + 8, cy);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(20, 33, 61);
    pdf.setFontSize(8);
    pdf.text(data.emergencyContactName, x + 8, cy + 8);
    if (data.emergencyContactPhone) pdf.text(data.emergencyContactPhone, x + 8, cy + 16);
    cy += 24;
  }

  if (data.bloodType) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6);
    pdf.setTextColor(120);
    pdf.text('BLOOD TYPE', x + 8, cy);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(180, 30, 30);
    pdf.text(data.bloodType, x + 8, cy + 10);
  }

  if (data.criticalAllergy) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6);
    pdf.setTextColor(120);
    pdf.text('CRITICAL ALLERGY', x + 80, cy);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(180, 30, 30);
    pdf.text(data.criticalAllergy.substring(0, 24), x + 80, cy + 9);
  }

  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(5);
  pdf.setTextColor(120);
  pdf.text('Full info available via QR code on front', x + 8, y + CARD_H - 12);
  if (data.pinHint) {
    pdf.text(`PIN hint: ${data.pinHint.substring(0, 36)}`, x + 8, y + CARD_H - 5);
  }
}

export async function generateEmergencyCardsPdf(opts: {
  ownerFirstName: string;
  emergencyUrl: string;
  pinHint?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  bloodType?: string | null;
  criticalAllergy?: string | null;
  trustedContactNames?: string[];
}): Promise<Blob> {
  const pdf = new jsPDF({ unit: 'pt', format: 'letter' });
  const qr = await qrDataUrl(opts.emergencyUrl);

  const cards: CardData[] = [];
  // 2x personal
  cards.push({ ...opts, variant: 'wallet' });
  cards.push({ ...opts, variant: 'wallet' });
  // trusted contact cards
  for (const tc of opts.trustedContactNames || []) {
    cards.push({ ...opts, variant: 'wallet', trustedContactName: tc });
  }

  // Pad to multiple of 10
  const slotsPerSheet = 10;
  const totalSlots = Math.ceil(cards.length / slotsPerSheet) * slotsPerSheet;

  let firstSheet = true;
  for (let sheet = 0; sheet < totalSlots / slotsPerSheet; sheet++) {
    if (!firstSheet) pdf.addPage();
    firstSheet = false;
    // Front sheet
    for (let i = 0; i < slotsPerSheet; i++) {
      const idx = sheet * slotsPerSheet + i;
      const card = cards[idx];
      if (!card) break;
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = MARGIN_X + col * (CARD_W + COL_GAP);
      const y = MARGIN_Y + row * (CARD_H + ROW_GAP);
      drawCardFront(pdf, x, y, qr, card);
    }
    // Back sheet
    pdf.addPage();
    for (let i = 0; i < slotsPerSheet; i++) {
      const idx = sheet * slotsPerSheet + i;
      const card = cards[idx];
      if (!card) break;
      // Flip horizontally for duplex printing — mirror columns
      const col = 1 - (i % 2);
      const row = Math.floor(i / 2);
      const x = MARGIN_X + col * (CARD_W + COL_GAP);
      const y = MARGIN_Y + row * (CARD_H + ROW_GAP);
      drawCardBack(pdf, x, y, card);
    }
  }

  return pdf.output('blob');
}

export async function generateQrPng(emergencyUrl: string, sizePx = 320): Promise<string> {
  return await QRCode.toDataURL(emergencyUrl, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: sizePx,
    color: { dark: '#000000', light: '#FFFFFF' },
  });
}
