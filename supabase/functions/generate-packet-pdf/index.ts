// Server-side Survivor Packet PDF generator using pdf-lib.
// - Validates JWT in code (config sets verify_jwt = false).
// - Fetches data using the caller's JWT so RLS scopes results correctly
//   (owners see everything, trusted contacts see only permitted sections).
// - Redacts sensitive fields server-side when requested.
// - Logs to packet_download_history with the service role.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { PDFDocument, StandardFonts, rgb, degrees, PDFPage, PDFFont } from 'https://esm.sh/pdf-lib@1.17.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// ── Brand palette (matches in-app aesthetic) ────────────────────────────────
const NAVY = rgb(0.10, 0.15, 0.27);          // #1a2744
const NAVY_LIGHT = rgb(0.20, 0.27, 0.40);
const GOLD = rgb(0.79, 0.66, 0.30);            // #c9a84c
const BODY = rgb(0.18, 0.18, 0.18);
const MUTED = rgb(0.45, 0.43, 0.40);
const PALE = rgb(0.92, 0.92, 0.94);
const WHITE = rgb(1, 1, 1);
const REDACTED_GRAY = rgb(0.55, 0.55, 0.55);

// ── Page geometry (Letter, 1" margins) ──────────────────────────────────────
const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 72;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_Y = 36;
const HEADER_TOP = PAGE_H - 48;

// ── Sensitive field map (server-side redaction) ─────────────────────────────
const SENSITIVE_FIELDS = new Set([
  'account_number_encrypted', 'account_number_masked',
  'routing_number_encrypted', 'routing_number_masked',
  'ssn_encrypted', 'ssn_masked',
  'username_encrypted', 'password_encrypted', 'password_masked',
  'crypto_seed_phrase_location', 'crypto_hardware_wallet_location',
]);

const REDACTED_DISPLAY = '••••••••';

// ── Section configuration ───────────────────────────────────────────────────
type FieldDef = { key: string; label: string; sensitive?: boolean };
type SectionDef = {
  id: string;
  label: string;
  table?: string;
  titleField?: string;
  fields: FieldDef[];
  emptyText?: string;
};

const SECTION_DEFS: SectionDef[] = [
  { id: 'info', label: 'Personal Information', table: 'info_records', titleField: 'title', fields: [
    { key: 'category', label: 'Category' },
    { key: 'expiry_date', label: 'Expires' },
    { key: 'notes', label: 'Notes' },
  ]},
  { id: 'family', label: 'Family & Contacts', table: 'family_members', titleField: 'name', fields: [
    { key: 'relationship', label: 'Relationship' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'address', label: 'Address' },
    { key: 'birthday', label: 'Birthday' },
    { key: 'ssn_masked', label: 'SSN', sensitive: true },
    { key: 'reminder_notes', label: 'Notes' },
  ]},
  { id: 'medical', label: 'Medical', table: 'medical_records', titleField: 'provider_name', fields: [
    { key: 'specialty', label: 'Specialty' },
    { key: 'phone', label: 'Phone' },
    { key: 'address', label: 'Address' },
    { key: 'insurance_provider', label: 'Insurance' },
    { key: 'member_id', label: 'Member ID' },
    { key: 'group_number', label: 'Group #' },
    { key: 'insurance_renewal_date', label: 'Renewal' },
    { key: 'notes', label: 'Notes' },
  ]},
  { id: 'real-estate', label: 'Real Estate', table: 'real_estate_records', titleField: 'property_label', fields: [
    { key: 'address', label: 'Address' },
    { key: 'mortgage_lender', label: 'Mortgage Lender' },
    { key: 'insurance_company', label: 'Insurance' },
    { key: 'notes', label: 'Notes' },
  ]},
  { id: 'banking', label: 'Banking', table: 'banking_records', titleField: 'institution', fields: [
    { key: 'account_type', label: 'Account Type' },
    { key: 'account_number_masked', label: 'Account #', sensitive: true },
    { key: 'routing_number_masked', label: 'Routing #', sensitive: true },
    { key: 'joint_account_holder', label: 'Joint Holder' },
    { key: 'beneficiary_notes', label: 'Beneficiary' },
    { key: 'contact_info', label: 'Contact' },
    { key: 'notes', label: 'Notes' },
  ]},
  { id: 'investments', label: 'Investments', table: 'investment_records', titleField: 'institution', fields: [
    { key: 'account_type', label: 'Account Type' },
    { key: 'account_nickname', label: 'Nickname' },
    { key: 'account_number_masked', label: 'Account #', sensitive: true },
    { key: 'approximate_value', label: 'Est. Value' },
    { key: 'primary_beneficiary', label: 'Beneficiary' },
    { key: 'advisor_name', label: 'Advisor' },
    { key: 'advisor_phone', label: 'Advisor Phone' },
    { key: 'notes', label: 'Notes' },
  ]},
  { id: 'retirement', label: 'Retirement', table: 'retirement_records', titleField: 'institution', fields: [
    { key: 'account_type', label: 'Account Type' },
    { key: 'account_number_masked', label: 'Account #', sensitive: true },
    { key: 'beneficiary_notes', label: 'Beneficiary' },
    { key: 'notes', label: 'Notes' },
  ]},
  { id: 'vehicles', label: 'Vehicles', table: 'vehicle_records', titleField: 'model', fields: [
    { key: 'year', label: 'Year' },
    { key: 'make', label: 'Make' },
    { key: 'vin', label: 'VIN' },
    { key: 'license_plate', label: 'Plate' },
    { key: 'insurance_company', label: 'Insurance' },
    { key: 'notes', label: 'Notes' },
  ]},
  { id: 'advisors', label: 'Advisors & Professionals', table: 'advisor_records', titleField: 'name', fields: [
    { key: 'advisor_type', label: 'Type' },
    { key: 'firm', label: 'Firm' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'address', label: 'Address' },
    { key: 'notes', label: 'Notes' },
  ]},
  { id: 'passwords', label: 'Passwords & Digital Access', table: 'password_records', titleField: 'service_name', fields: [
    { key: 'username', label: 'Username' },
    { key: 'password_masked', label: 'Password', sensitive: true },
    { key: 'access_instructions', label: 'Access Instructions' },
    { key: 'two_fa_notes', label: '2FA' },
  ]},
  { id: 'property', label: 'Personal Property', table: 'personal_property_records', titleField: 'item_name', fields: [
    { key: 'description', label: 'Description' },
    { key: 'location', label: 'Location' },
    { key: 'estimated_value', label: 'Est. Value' },
    { key: 'beneficiary', label: 'Beneficiary' },
    { key: 'notes', label: 'Notes' },
  ]},
  { id: 'pets', label: 'Pets', table: 'pet_records', titleField: 'pet_name', fields: [
    { key: 'species_breed', label: 'Species/Breed' },
    { key: 'age', label: 'Age' },
    { key: 'veterinarian_contact', label: 'Vet' },
    { key: 'medications', label: 'Medications' },
    { key: 'care_instructions', label: 'Care' },
  ]},
  { id: 'legal', label: 'Legal Documents', table: 'legal_documents', titleField: 'document_type', fields: [
    { key: 'attorney_name', label: 'Attorney' },
    { key: 'attorney_firm', label: 'Firm' },
    { key: 'attorney_phone', label: 'Attorney Phone' },
    { key: 'document_date', label: 'Date Signed' },
    { key: 'last_reviewed_date', label: 'Last Reviewed' },
    { key: 'original_location', label: 'Original Location' },
    { key: 'notes', label: 'Notes' },
  ]},
  { id: 'funeral', label: 'Funeral & End-of-Life', table: 'funeral_records', titleField: 'funeral_home', fields: [
    { key: 'funeral_director', label: 'Director' },
    { key: 'funeral_home_phone', label: 'Phone' },
    { key: 'burial_or_cremation', label: 'Burial/Cremation' },
    { key: 'service_preferences', label: 'Service' },
    { key: 'religious_cultural_preferences', label: 'Religious/Cultural' },
    { key: 'cemetery_plot_details', label: 'Cemetery/Plot' },
    { key: 'prepaid_arrangements', label: 'Prepaid' },
    { key: 'flowers_preferences', label: 'Flowers' },
    { key: 'reception_wishes', label: 'Reception' },
    { key: 'personal_messages', label: 'Personal Messages' },
    { key: 'additional_instructions', label: 'Additional Instructions' },
  ]},
  { id: 'memories', label: 'Memories', table: 'memories', titleField: 'title', fields: [
    { key: 'entry_type', label: 'Type' },
    { key: 'recipient', label: 'For' },
    { key: 'content', label: 'Content' },
    { key: 'delivery_instructions', label: 'Delivery' },
  ]},
];

// ── HTML stripper for rich-text fields ──────────────────────────────────────
function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return String(html)
    .replace(/<\/(p|div|h[1-6]|li|br)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, ' • ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Sanitize a string for WinAnsi (pdf-lib standard fonts can't encode emoji/non-WinAnsi).
function sanitizeForPdf(s: string): string {
  return s.replace(/[^\x20-\x7E\n]/g, '?');
}

// ── PDF helpers ─────────────────────────────────────────────────────────────
type Ctx = {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  pageNum: number;
  serif: PDFFont;
  serifBold: PDFFont;
  sans: PDFFont;
  sansBold: PDFFont;
  options: GenOpts;
  ownerName: string;
  watermark: boolean;
};

type GenOpts = {
  includeCover: boolean;
  includeWatermark: boolean;
  redactSensitive: boolean;
  format: 'full' | 'summary';
  sections: string[];
  adminCopyEmail?: string | null;
};

function applyWatermark(ctx: Ctx) {
  if (!ctx.watermark) return;
  ctx.page.drawText('CONFIDENTIAL', {
    x: 90,
    y: PAGE_H / 2,
    size: 70,
    font: ctx.serifBold,
    color: rgb(0.85, 0.85, 0.88),
    rotate: degrees(45),
    opacity: 0.4,
  });
}

function drawFooter(ctx: Ctx) {
  // Gold rule
  ctx.page.drawLine({
    start: { x: MARGIN, y: FOOTER_Y + 14 },
    end: { x: PAGE_W - MARGIN, y: FOOTER_Y + 14 },
    thickness: 0.5,
    color: GOLD,
  });
  ctx.page.drawText(`Survivor Packet · ${ctx.ownerName}`, {
    x: MARGIN,
    y: FOOTER_Y,
    size: 8,
    font: ctx.sans,
    color: MUTED,
  });
  const pn = `Page ${ctx.pageNum}`;
  const w = ctx.sans.widthOfTextAtSize(pn, 8);
  ctx.page.drawText(pn, {
    x: PAGE_W - MARGIN - w,
    y: FOOTER_Y,
    size: 8,
    font: ctx.sans,
    color: MUTED,
  });
  if (ctx.options.adminCopyEmail) {
    const stamp = `ADMIN COPY · generated by ${ctx.options.adminCopyEmail}`;
    ctx.page.drawText(stamp, {
      x: MARGIN,
      y: FOOTER_Y - 10,
      size: 7,
      font: ctx.sansBold,
      color: rgb(0.6, 0.2, 0.2),
    });
  }
}

function newPage(ctx: Ctx) {
  ctx.page = ctx.doc.addPage([PAGE_W, PAGE_H]);
  ctx.pageNum += 1;
  ctx.y = HEADER_TOP;
  applyWatermark(ctx);
  drawFooter(ctx);
}

function ensure(ctx: Ctx, needed: number) {
  if (ctx.y - needed < FOOTER_Y + 24) {
    newPage(ctx);
  }
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const out: string[] = [];
  const paragraphs = text.split('\n');
  for (const para of paragraphs) {
    if (!para) { out.push(''); continue; }
    const words = para.split(/\s+/);
    let line = '';
    for (const w of words) {
      const candidate = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        line = candidate;
      } else {
        if (line) out.push(line);
        // word longer than line: hard split
        if (font.widthOfTextAtSize(w, size) > maxWidth) {
          let chunk = '';
          for (const ch of w) {
            if (font.widthOfTextAtSize(chunk + ch, size) > maxWidth) {
              out.push(chunk);
              chunk = ch;
            } else {
              chunk += ch;
            }
          }
          line = chunk;
        } else {
          line = w;
        }
      }
    }
    if (line) out.push(line);
  }
  return out;
}

function drawText(ctx: Ctx, text: string, opts: { font: PDFFont; size: number; color?: any; x?: number; lineHeight?: number; }) {
  const safe = sanitizeForPdf(text);
  const lines = wrapText(safe, opts.font, opts.size, CONTENT_W - ((opts.x ?? MARGIN) - MARGIN));
  const lh = opts.lineHeight ?? opts.size + 4;
  for (const line of lines) {
    ensure(ctx, lh);
    ctx.page.drawText(line, {
      x: opts.x ?? MARGIN,
      y: ctx.y - opts.size,
      size: opts.size,
      font: opts.font,
      color: opts.color ?? BODY,
    });
    ctx.y -= lh;
  }
}

function drawCoverPage(ctx: Ctx, ownerName: string, dateLong: string) {
  // Already on page 1. Apply watermark + footer (for cover too).
  applyWatermark(ctx);
  drawFooter(ctx);

  // Top navy band
  ctx.page.drawRectangle({ x: 0, y: PAGE_H - 200, width: PAGE_W, height: 200, color: NAVY });
  ctx.page.drawRectangle({ x: 0, y: PAGE_H - 208, width: PAGE_W, height: 4, color: GOLD });

  ctx.page.drawText('THE SURVIVOR PACKET', {
    x: MARGIN,
    y: PAGE_H - 100,
    size: 11,
    font: ctx.sansBold,
    color: GOLD,
  });
  ctx.page.drawText('Personal & Estate Documentation', {
    x: MARGIN,
    y: PAGE_H - 145,
    size: 22,
    font: ctx.serifBold,
    color: WHITE,
  });
  ctx.page.drawText('Prepared with care', {
    x: MARGIN,
    y: PAGE_H - 170,
    size: 11,
    font: ctx.serif,
    color: rgb(0.85, 0.85, 0.88),
  });

  // Big name
  const safeName = sanitizeForPdf(ownerName);
  ctx.page.drawText(safeName, {
    x: MARGIN,
    y: PAGE_H - 320,
    size: 36,
    font: ctx.serifBold,
    color: NAVY,
  });

  // Gold rule
  ctx.page.drawLine({
    start: { x: MARGIN, y: PAGE_H - 340 },
    end: { x: MARGIN + 120, y: PAGE_H - 340 },
    thickness: 2,
    color: GOLD,
  });

  ctx.page.drawText('Document compiled on', {
    x: MARGIN,
    y: PAGE_H - 380,
    size: 10,
    font: ctx.sans,
    color: MUTED,
  });
  ctx.page.drawText(dateLong, {
    x: MARGIN,
    y: PAGE_H - 400,
    size: 14,
    font: ctx.serif,
    color: BODY,
  });

  // Confidential notice block
  const noticeY = 200;
  ctx.page.drawRectangle({
    x: MARGIN,
    y: noticeY,
    width: CONTENT_W,
    height: 70,
    color: PALE,
  });
  ctx.page.drawText('CONFIDENTIAL — HANDLE WITH CARE', {
    x: MARGIN + 16,
    y: noticeY + 48,
    size: 10,
    font: ctx.sansBold,
    color: NAVY,
  });
  const noticeLines = wrapText(
    'This document contains sensitive personal information compiled by the named individual. Please treat it with the privacy and respect it deserves.',
    ctx.sans, 9, CONTENT_W - 32,
  );
  let ny = noticeY + 32;
  for (const ln of noticeLines) {
    ctx.page.drawText(ln, { x: MARGIN + 16, y: ny, size: 9, font: ctx.sans, color: BODY });
    ny -= 12;
  }

  if (ctx.options.adminCopyEmail) {
    ctx.page.drawText(`ADMIN COPY · ${ctx.options.adminCopyEmail}`, {
      x: MARGIN,
      y: 130,
      size: 9,
      font: ctx.sansBold,
      color: rgb(0.6, 0.2, 0.2),
    });
  }
}

function drawSectionHeader(ctx: Ctx, label: string, count: number) {
  ensure(ctx, 80);
  // Always start sections on a fresh page for clean layout
  newPage(ctx);

  // Navy header bar
  const bandH = 40;
  ctx.page.drawRectangle({
    x: MARGIN,
    y: ctx.y - bandH,
    width: CONTENT_W,
    height: bandH,
    color: NAVY,
  });
  ctx.page.drawText(sanitizeForPdf(label.toUpperCase()), {
    x: MARGIN + 16,
    y: ctx.y - 26,
    size: 13,
    font: ctx.sansBold,
    color: WHITE,
  });
  const meta = `${count} ${count === 1 ? 'entry' : 'entries'}`;
  const w = ctx.sans.widthOfTextAtSize(meta, 9);
  ctx.page.drawText(meta, {
    x: PAGE_W - MARGIN - 16 - w,
    y: ctx.y - 26,
    size: 9,
    font: ctx.sans,
    color: rgb(0.85, 0.85, 0.88),
  });
  // Gold accent
  ctx.page.drawRectangle({
    x: MARGIN,
    y: ctx.y - bandH - 3,
    width: CONTENT_W,
    height: 2,
    color: GOLD,
  });
  ctx.y -= bandH + 24;
}

function drawRecord(ctx: Ctx, def: SectionDef, row: any, opts: GenOpts, idx: number) {
  ensure(ctx, 60);

  // Record title
  const title = (def.titleField && row[def.titleField]) ? String(row[def.titleField]) : `${def.label} entry ${idx + 1}`;
  ctx.page.drawText(sanitizeForPdf(title), {
    x: MARGIN,
    y: ctx.y - 13,
    size: 12,
    font: ctx.serifBold,
    color: NAVY,
  });
  ctx.y -= 22;

  // Fields
  const fieldSet = opts.format === 'summary' ? def.fields.slice(0, 4) : def.fields;
  const labelColW = 110;

  for (const f of fieldSet) {
    let val = row[f.key];
    if (val === null || val === undefined || val === '') continue;

    if (typeof val === 'string' && /<[a-z][\s\S]*>/i.test(val)) {
      val = stripHtml(val);
    }
    const isSensitive = f.sensitive || SENSITIVE_FIELDS.has(f.key);
    const display = isSensitive && opts.redactSensitive ? REDACTED_DISPLAY : String(val);

    // Label
    ensure(ctx, 16);
    ctx.page.drawText(sanitizeForPdf(f.label), {
      x: MARGIN,
      y: ctx.y - 10,
      size: 9,
      font: ctx.sansBold,
      color: NAVY_LIGHT,
    });
    // Value (wrap)
    const lines = wrapText(sanitizeForPdf(display), ctx.serif, 10, CONTENT_W - labelColW);
    let lineY = ctx.y - 10;
    for (const ln of lines) {
      ensure(ctx, 14);
      ctx.page.drawText(ln, {
        x: MARGIN + labelColW,
        y: lineY,
        size: 10,
        font: ctx.serif,
        color: isSensitive && opts.redactSensitive ? REDACTED_GRAY : BODY,
      });
      lineY -= 13;
      ctx.y -= 13;
    }
    ctx.y -= 4;
  }

  // Soft divider
  ensure(ctx, 16);
  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.y },
    end: { x: PAGE_W - MARGIN, y: ctx.y },
    thickness: 0.4,
    color: rgb(0.85, 0.85, 0.88),
  });
  ctx.y -= 14;
}

function drawTOC(ctx: Ctx, entries: { label: string; count: number; page: number }[]) {
  newPage(ctx);
  ctx.page.drawText('TABLE OF CONTENTS', {
    x: MARGIN,
    y: ctx.y - 18,
    size: 16,
    font: ctx.serifBold,
    color: NAVY,
  });
  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.y - 24 },
    end: { x: MARGIN + 80, y: ctx.y - 24 },
    thickness: 1.5,
    color: GOLD,
  });
  ctx.y -= 50;

  for (const e of entries) {
    ensure(ctx, 22);
    ctx.page.drawText(sanitizeForPdf(e.label), {
      x: MARGIN,
      y: ctx.y - 11,
      size: 11,
      font: ctx.serif,
      color: BODY,
    });
    const meta = `${e.count} entr${e.count === 1 ? 'y' : 'ies'}  ·  p. ${e.page}`;
    const w = ctx.sans.widthOfTextAtSize(meta, 9);
    ctx.page.drawText(meta, {
      x: PAGE_W - MARGIN - w,
      y: ctx.y - 11,
      size: 9,
      font: ctx.sans,
      color: MUTED,
    });
    // Dot leader
    ctx.page.drawLine({
      start: { x: MARGIN + 200, y: ctx.y - 13 },
      end: { x: PAGE_W - MARGIN - w - 6, y: ctx.y - 13 },
      thickness: 0.3,
      color: rgb(0.78, 0.78, 0.82),
    });
    ctx.y -= 22;
  }
}

function drawClosingPage(ctx: Ctx, dateLong: string) {
  newPage(ctx);
  const cy = PAGE_H / 2;
  ctx.page.drawLine({
    start: { x: PAGE_W / 2 - 40, y: cy + 50 },
    end: { x: PAGE_W / 2 + 40, y: cy + 50 },
    thickness: 1.5,
    color: GOLD,
  });
  const title = 'End of Survivor Packet';
  const tw = ctx.serifBold.widthOfTextAtSize(title, 18);
  ctx.page.drawText(title, {
    x: (PAGE_W - tw) / 2,
    y: cy + 10,
    size: 18,
    font: ctx.serifBold,
    color: NAVY,
  });
  const sub1 = `Generated ${dateLong}`;
  const sw1 = ctx.sans.widthOfTextAtSize(sub1, 10);
  ctx.page.drawText(sub1, {
    x: (PAGE_W - sw1) / 2,
    y: cy - 12,
    size: 10,
    font: ctx.sans,
    color: MUTED,
  });
  const sub2 = 'Prepared using The Survivor Packet  ·  survivorpacket.com';
  const sw2 = ctx.sans.widthOfTextAtSize(sub2, 10);
  ctx.page.drawText(sub2, {
    x: (PAGE_W - sw2) / 2,
    y: cy - 30,
    size: 10,
    font: ctx.sans,
    color: BODY,
  });
}

// ── Main handler ────────────────────────────────────────────────────────────

interface RequestBody {
  packet_id?: string;
  sections?: string[];           // null/undefined = all
  redact_sensitive?: boolean;    // default true
  format?: 'full' | 'summary';   // default 'full'
  include_cover?: boolean;       // default true
  include_watermark?: boolean;   // default true
  download_type?: 'full_packet' | 'section' | 'admin' | 'funeral_instructions' | 'emergency_medical';
  admin_target_packet_id?: string;
}

// ── Specialty PDFs ──────────────────────────────────────────────────────────

async function buildFuneralInstructionsPdf(
  callerClient: any,
  ctx: Ctx,
  packetId: string,
  ownerName: string,
  dateLong: string,
) {
  // Header letter-style
  ctx.page.drawRectangle({ x: 0, y: PAGE_H - 110, width: PAGE_W, height: 110, color: NAVY });
  ctx.page.drawRectangle({ x: 0, y: PAGE_H - 114, width: PAGE_W, height: 4, color: GOLD });
  ctx.page.drawText('FUNERAL INSTRUCTIONS', {
    x: MARGIN, y: PAGE_H - 60, size: 11, font: ctx.sansBold, color: GOLD,
  });
  ctx.page.drawText(sanitizeForPdf(`For ${ownerName}`), {
    x: MARGIN, y: PAGE_H - 92, size: 22, font: ctx.serifBold, color: WHITE,
  });
  ctx.y = PAGE_H - 150;

  drawText(ctx, `Prepared on ${dateLong}`, { font: ctx.sans, size: 10, color: MUTED });
  ctx.y -= 6;
  drawText(ctx,
    'To the funeral director or person receiving this document: the wishes recorded below have been documented in advance. Please follow them as closely as possible.',
    { font: ctx.serif, size: 11, lineHeight: 16 },
  );
  ctx.y -= 10;

  const { data: funeralRows } = await callerClient
    .from('funeral_records')
    .select('*')
    .eq('packet_id', packetId)
    .order('created_at', { ascending: true })
    .limit(1);
  const f = (funeralRows || [])[0];

  if (!f) {
    drawText(ctx, 'No funeral wishes have been recorded yet.', { font: ctx.serif, size: 11, color: MUTED });
    return;
  }

  // Funeral home contact prominently
  if (f.funeral_home || f.funeral_director || f.funeral_home_phone || f.funeral_home_email) {
    ensure(ctx, 90);
    ctx.page.drawRectangle({
      x: MARGIN, y: ctx.y - 80, width: CONTENT_W, height: 80, color: PALE,
    });
    ctx.page.drawText('FUNERAL HOME OF RECORD', {
      x: MARGIN + 14, y: ctx.y - 22, size: 9, font: ctx.sansBold, color: NAVY,
    });
    let yy = ctx.y - 40;
    const lines = [
      f.funeral_home && `Home: ${f.funeral_home}`,
      f.funeral_director && `Director: ${f.funeral_director}`,
      f.funeral_home_phone && `Phone: ${f.funeral_home_phone}`,
      f.funeral_home_email && `Email: ${f.funeral_home_email}`,
    ].filter(Boolean) as string[];
    for (const l of lines) {
      ctx.page.drawText(sanitizeForPdf(l), {
        x: MARGIN + 14, y: yy, size: 10, font: ctx.serif, color: BODY,
      });
      yy -= 13;
    }
    ctx.y -= 100;
  }

  const labelMap: [string, string][] = [
    ['burial_or_cremation', 'Burial or Cremation'],
    ['service_preferences', 'Service Preferences'],
    ['religious_cultural_preferences', 'Religious / Cultural Preferences'],
    ['cemetery_plot_details', 'Cemetery / Plot Details'],
    ['prepaid_arrangements', 'Prepaid Arrangements'],
    ['flowers_preferences', 'Flowers & Arrangements'],
    ['reception_wishes', 'Reception Wishes'],
    ['personal_messages', 'Personal Messages'],
    ['additional_instructions', 'Additional Instructions'],
  ];

  for (const [key, label] of labelMap) {
    const raw = f[key];
    if (!raw || !String(raw).trim()) continue;
    ensure(ctx, 30);
    ctx.page.drawText(sanitizeForPdf(label.toUpperCase()), {
      x: MARGIN, y: ctx.y - 11, size: 9, font: ctx.sansBold, color: NAVY,
    });
    ctx.page.drawLine({
      start: { x: MARGIN, y: ctx.y - 16 }, end: { x: MARGIN + 60, y: ctx.y - 16 },
      thickness: 1, color: GOLD,
    });
    ctx.y -= 24;
    drawText(ctx, stripHtml(String(raw)), { font: ctx.serif, size: 11, lineHeight: 15 });
    ctx.y -= 8;
  }

  // Obituary in full
  if (f.obituary_text && stripHtml(f.obituary_text).trim()) {
    ensure(ctx, 60);
    newPage(ctx);
    ctx.page.drawText('OBITUARY', {
      x: MARGIN, y: ctx.y - 14, size: 14, font: ctx.serifBold, color: NAVY,
    });
    ctx.page.drawLine({
      start: { x: MARGIN, y: ctx.y - 20 }, end: { x: MARGIN + 70, y: ctx.y - 20 },
      thickness: 1.5, color: GOLD,
    });
    ctx.y -= 32;
    drawText(ctx, stripHtml(f.obituary_text), { font: ctx.serif, size: 11, lineHeight: 16 });
  }

  // Eulogy
  if (f.eulogy_text && stripHtml(f.eulogy_text).trim()) {
    ensure(ctx, 60);
    newPage(ctx);
    ctx.page.drawText('EULOGY', {
      x: MARGIN, y: ctx.y - 14, size: 14, font: ctx.serifBold, color: NAVY,
    });
    ctx.page.drawLine({
      start: { x: MARGIN, y: ctx.y - 20 }, end: { x: MARGIN + 70, y: ctx.y - 20 },
      thickness: 1.5, color: GOLD,
    });
    ctx.y -= 32;
    if (f.eulogy_author) {
      drawText(ctx, `By ${f.eulogy_author}`, { font: ctx.serif, size: 11, color: MUTED });
      ctx.y -= 4;
    }
    drawText(ctx, stripHtml(f.eulogy_text), { font: ctx.serif, size: 11, lineHeight: 16 });
  }

  // Music list
  const { data: music } = await callerClient
    .from('funeral_music')
    .select('song_title, artist, when_to_play, notes')
    .eq('funeral_record_id', f.id)
    .order('display_order', { ascending: true });

  if (music && music.length > 0) {
    ensure(ctx, 60);
    newPage(ctx);
    ctx.page.drawText('MUSIC LIST', {
      x: MARGIN, y: ctx.y - 14, size: 14, font: ctx.serifBold, color: NAVY,
    });
    ctx.page.drawLine({
      start: { x: MARGIN, y: ctx.y - 20 }, end: { x: MARGIN + 70, y: ctx.y - 20 },
      thickness: 1.5, color: GOLD,
    });
    ctx.y -= 32;
    music.forEach((s: any, i: number) => {
      const head = `${i + 1}. ${s.song_title}${s.artist ? ` — ${s.artist}` : ''}`;
      drawText(ctx, head, { font: ctx.serifBold, size: 11 });
      if (s.when_to_play) {
        drawText(ctx, `   When: ${s.when_to_play}`, { font: ctx.serif, size: 10, color: MUTED });
      }
      if (s.notes) {
        drawText(ctx, `   ${s.notes}`, { font: ctx.serif, size: 10, color: BODY });
      }
      ctx.y -= 4;
    });
  }

  // Readings
  const { data: readings } = await callerClient
    .from('funeral_readings')
    .select('title, author, full_text, reader_name')
    .eq('funeral_record_id', f.id)
    .order('display_order', { ascending: true });

  if (readings && readings.length > 0) {
    ensure(ctx, 60);
    newPage(ctx);
    ctx.page.drawText('READINGS & POEMS', {
      x: MARGIN, y: ctx.y - 14, size: 14, font: ctx.serifBold, color: NAVY,
    });
    ctx.page.drawLine({
      start: { x: MARGIN, y: ctx.y - 20 }, end: { x: MARGIN + 70, y: ctx.y - 20 },
      thickness: 1.5, color: GOLD,
    });
    ctx.y -= 32;
    for (const r of readings as any[]) {
      drawText(ctx, r.title, { font: ctx.serifBold, size: 12 });
      if (r.author) drawText(ctx, `By ${r.author}`, { font: ctx.serif, size: 10, color: MUTED });
      if (r.reader_name) drawText(ctx, `Read by ${r.reader_name}`, { font: ctx.serif, size: 10, color: MUTED });
      ctx.y -= 4;
      if (r.full_text) drawText(ctx, r.full_text, { font: ctx.serif, size: 11, lineHeight: 15 });
      ctx.y -= 8;
    }
  }
}

async function buildEmergencyMedicalPdf(
  callerClient: any,
  ctx: Ctx,
  packetId: string,
  ownerName: string,
  dateLong: string,
) {
  // Single-page large-font emergency reference card
  ctx.page.drawRectangle({ x: 0, y: PAGE_H - 90, width: PAGE_W, height: 90, color: rgb(0.65, 0.10, 0.15) });
  ctx.page.drawText('EMERGENCY MEDICAL INFORMATION', {
    x: MARGIN, y: PAGE_H - 50, size: 14, font: ctx.sansBold, color: WHITE,
  });
  ctx.page.drawText(sanitizeForPdf(ownerName), {
    x: MARGIN, y: PAGE_H - 75, size: 18, font: ctx.serifBold, color: WHITE,
  });
  ctx.y = PAGE_H - 120;

  drawText(ctx, `Updated ${dateLong}`, { font: ctx.sans, size: 10, color: MUTED });
  ctx.y -= 8;

  // Pull info_records (for blood type / allergies if recorded), medical_records, medications, family (emergency contacts)
  const [info, medical, meds, family] = await Promise.all([
    callerClient.from('info_records').select('*').eq('packet_id', packetId),
    callerClient.from('medical_records').select('*').eq('packet_id', packetId),
    callerClient.from('medications').select('*').eq('packet_id', packetId),
    callerClient.from('family_members').select('*').eq('packet_id', packetId),
  ]);

  const infoRecords = (info.data || []) as any[];
  const findInfo = (needle: string) => infoRecords.find((r) =>
    `${r.title || ''} ${r.category || ''}`.toLowerCase().includes(needle));
  const bloodType = findInfo('blood');
  const allergies = findInfo('allerg');

  const block = (label: string, lines: string[], emphasize = false) => {
    ensure(ctx, 60 + lines.length * 16);
    ctx.page.drawRectangle({
      x: MARGIN, y: ctx.y - 28, width: CONTENT_W, height: 24,
      color: emphasize ? rgb(1, 0.92, 0.85) : PALE,
    });
    ctx.page.drawText(label.toUpperCase(), {
      x: MARGIN + 12, y: ctx.y - 22, size: 11, font: ctx.sansBold,
      color: emphasize ? rgb(0.65, 0.10, 0.15) : NAVY,
    });
    ctx.y -= 36;
    if (lines.length === 0) {
      drawText(ctx, 'Not recorded.', { font: ctx.serif, size: 12, color: MUTED });
    } else {
      for (const l of lines) {
        drawText(ctx, l, { font: ctx.serif, size: 13, lineHeight: 18 });
      }
    }
    ctx.y -= 8;
  };

  block('Blood Type', bloodType?.notes ? [stripHtml(bloodType.notes)] : [], true);
  block('Allergies', allergies?.notes ? [stripHtml(allergies.notes)] : [], true);

  const medsLines = ((meds.data || []) as any[])
    .filter((m) => !m.is_na)
    .map((m) => {
      const parts = [m.name, m.dose, m.frequency].filter(Boolean).join(' · ');
      return parts;
    });
  block('Current Medications', medsLines);

  const docLines = ((medical.data || []) as any[])
    .filter((m) => !m.is_na)
    .slice(0, 5)
    .map((m) => {
      const parts = [m.provider_name, m.specialty, m.phone].filter(Boolean).join(' · ');
      return parts;
    });
  block('Doctors', docLines);

  const insLine = ((medical.data || []) as any[])
    .filter((m) => m.insurance_provider)
    .slice(0, 2)
    .map((m) => {
      const parts = [m.insurance_provider, m.member_id && `Member: ${m.member_id}`, m.group_number && `Group: ${m.group_number}`]
        .filter(Boolean).join(' · ');
      return parts;
    });
  block('Insurance', insLine);

  const contactLines = ((family.data || []) as any[])
    .filter((f) => !f.is_deceased && (f.phone || f.email))
    .slice(0, 4)
    .map((f) => {
      const parts = [f.name, f.relationship, f.phone, f.email].filter(Boolean).join(' · ');
      return parts;
    });
  block('Emergency Contacts', contactLines);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Caller-scoped client (RLS applies)
    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimErr } = await callerClient.auth.getClaims(token);
    if (claimErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const callerId = claims.claims.sub as string;
    const callerEmail = (claims.claims.email as string) ?? null;

    // Service-role client (for owner profile lookup + history insert)
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body: RequestBody = await req.json().catch(() => ({} as RequestBody));

    // Resolve packet
    let packetId = body.packet_id;
    if (!packetId) {
      // Default to the caller's owned packet
      const { data: ownPacket } = await adminClient
        .from('packets')
        .select('id')
        .eq('owner_user_id', callerId)
        .maybeSingle();
      packetId = ownPacket?.id;
    }
    if (!packetId) {
      return new Response(JSON.stringify({ error: 'packet_not_found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Look up packet + owner
    const { data: packet, error: packetErr } = await adminClient
      .from('packets')
      .select('id, owner_user_id, person_a_name, household_mode')
      .eq('id', packetId)
      .maybeSingle();
    if (packetErr || !packet) {
      return new Response(JSON.stringify({ error: 'packet_not_found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determine downloader role + admin watermark
    let downloaderRole: 'owner' | 'admin' | 'trusted_contact' | 'member' = 'owner';
    let adminCopyEmail: string | null = null;

    const { data: callerProfile } = await adminClient
      .from('profiles')
      .select('role, full_name, email')
      .eq('id', callerId)
      .maybeSingle();

    if (packet.owner_user_id !== callerId) {
      if (callerProfile?.role === 'admin') {
        downloaderRole = 'admin';
        adminCopyEmail = callerProfile.email || callerEmail;
      } else {
        // Could be trusted contact or packet member; verify membership for sanity (RLS will do the same)
        const { data: tc } = await adminClient
          .from('trusted_contacts')
          .select('id')
          .eq('packet_id', packetId)
          .eq('user_id', callerId)
          .eq('access_released', true)
          .maybeSingle();
        downloaderRole = tc ? 'trusted_contact' : 'member';
      }
    }

    // Owner display name
    const { data: ownerProfile } = await adminClient
      .from('profiles')
      .select('full_name, email')
      .eq('id', packet.owner_user_id)
      .maybeSingle();
    const ownerName = ownerProfile?.full_name || packet.person_a_name || ownerProfile?.email || 'Survivor Packet Owner';

    const opts: GenOpts = {
      includeCover: body.include_cover !== false,
      includeWatermark: body.include_watermark !== false,
      redactSensitive: body.redact_sensitive !== false,
      format: body.format === 'summary' ? 'summary' : 'full',
      sections: Array.isArray(body.sections) && body.sections.length > 0
        ? body.sections
        : SECTION_DEFS.map((s) => s.id),
      adminCopyEmail,
    };

    // Build PDF
    const doc = await PDFDocument.create();
    doc.setTitle(`Survivor Packet — ${ownerName}`);
    doc.setAuthor('The Survivor Packet');
    doc.setCreator('survivorpacket.com');

    const serif = await doc.embedFont(StandardFonts.TimesRoman);
    const serifBold = await doc.embedFont(StandardFonts.TimesRomanBold);
    const sans = await doc.embedFont(StandardFonts.Helvetica);
    const sansBold = await doc.embedFont(StandardFonts.HelveticaBold);

    const ctx: Ctx = {
      doc,
      page: doc.addPage([PAGE_W, PAGE_H]),
      y: HEADER_TOP,
      pageNum: 1,
      serif, serifBold, sans, sansBold,
      options: opts,
      ownerName,
      watermark: opts.includeWatermark,
    };

    const dateLong = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const isFuneral = body.download_type === 'funeral_instructions';
    const isEmergency = body.download_type === 'emergency_medical';

    if (isFuneral || isEmergency) {
      // Specialty single-document PDFs — no cover, no TOC, no closing page.
      applyWatermark(ctx);
      drawFooter(ctx);
      if (isFuneral) {
        await buildFuneralInstructionsPdf(callerClient, ctx, packetId, ownerName, dateLong);
      } else {
        await buildEmergencyMedicalPdf(callerClient, ctx, packetId, ownerName, dateLong);
      }
    } else {
      if (opts.includeCover) {
        drawCoverPage(ctx, ownerName, dateLong);
      } else {
        applyWatermark(ctx);
        drawFooter(ctx);
      }

      // Pre-fetch all section data via caller client (RLS-scoped)
      const sectionData: { def: SectionDef; rows: any[] }[] = [];
      for (const id of opts.sections) {
        const def = SECTION_DEFS.find((d) => d.id === id);
        if (!def || !def.table) continue;
        try {
          const { data, error } = await callerClient
            .from(def.table as any)
            .select('*')
            .eq('packet_id', packetId);
          if (error) {
            console.warn(`[generate-packet-pdf] ${def.table}:`, error.message);
            sectionData.push({ def, rows: [] });
          } else {
            sectionData.push({ def, rows: (data || []) as any[] });
          }
        } catch (e: any) {
          console.warn(`[generate-packet-pdf] ${def.table} threw:`, e.message);
          sectionData.push({ def, rows: [] });
        }
      }

      const tocStartPage = ctx.pageNum + 1;
      let cursorPage = tocStartPage + 1;
      const tocEntries: { label: string; count: number; page: number }[] = [];
      for (const { def, rows } of sectionData) {
        tocEntries.push({ label: def.label, count: rows.length, page: cursorPage });
        const pages = Math.max(1, Math.ceil(rows.length / 6));
        cursorPage += pages;
      }
      if (sectionData.length > 1) {
        drawTOC(ctx, tocEntries);
      }

      for (const { def, rows } of sectionData) {
        drawSectionHeader(ctx, def.label, rows.length);

        if (def.id === 'passwords' && !opts.redactSensitive && rows.length > 0) {
          ensure(ctx, 60);
          ctx.page.drawRectangle({
            x: MARGIN, y: ctx.y - 50, width: CONTENT_W, height: 50,
            color: rgb(0.99, 0.93, 0.85),
          });
          ctx.page.drawText('HIGHLY SENSITIVE — SECURE THIS DOCUMENT', {
            x: MARGIN + 14, y: ctx.y - 22, size: 11, font: ctx.sansBold, color: rgb(0.55, 0.20, 0.10),
          });
          ctx.page.drawText('The pages below contain unredacted credentials. Store this PDF securely.', {
            x: MARGIN + 14, y: ctx.y - 38, size: 9, font: ctx.sans, color: rgb(0.40, 0.20, 0.10),
          });
          ctx.y -= 70;
        }

        if (rows.length === 0) {
          ensure(ctx, 24);
          ctx.page.drawText('No information recorded for this section.', {
            x: MARGIN, y: ctx.y - 10, size: 10, font: ctx.serif, color: MUTED,
          });
          ctx.y -= 24;
          continue;
        }

        rows.forEach((row, i) => drawRecord(ctx, def, row, opts, i));
      }

      drawClosingPage(ctx, dateLong);
    }

    const pdfBytes = await doc.save();

    // Log download history (service role)
    const safeName = ownerName.replace(/[^a-zA-Z0-9]/g, '-');
    const fileDate = new Date().toISOString().slice(0, 10);
    let fileName: string;
    if (isFuneral) {
      fileName = `FuneralInstructions_${safeName}_${fileDate}.pdf`;
    } else if (isEmergency) {
      fileName = `EmergencyMedical_${safeName}_${fileDate}.pdf`;
    } else if (body.download_type === 'section' && opts.sections.length === 1) {
      const sectionLabel = SECTION_DEFS.find((d) => d.id === opts.sections[0])?.label.replace(/[^a-zA-Z0-9]/g, '') || 'Section';
      fileName = `SurvivorPacket_${sectionLabel}_${safeName}_${fileDate}.pdf`;
    } else {
      fileName = `SurvivorPacket_${safeName}_${fileDate}.pdf`;
    }

    try {
      await adminClient.from('packet_download_history').insert({
        packet_id: packetId,
        downloaded_by: callerId,
        downloader_email: callerProfile?.email || callerEmail,
        downloader_role: downloaderRole,
        sections_included: opts.sections,
        include_sensitive: !opts.redactSensitive,
        format_option: opts.format,
        download_type: body.download_type || 'full_packet',
        file_name: fileName,
        notes: adminCopyEmail ? `Admin copy generated by ${adminCopyEmail}` : null,
      });

      if (downloaderRole === 'admin') {
        await adminClient.from('admin_activity_log').insert({
          admin_user_id: callerId,
          admin_email: callerEmail,
          target_user_id: packet.owner_user_id,
          target_user_email: ownerProfile?.email || null,
          action: 'admin_download_packet_pdf',
          note: `Sections: ${opts.sections.length} · Sensitive: ${!opts.redactSensitive}`,
        });
      }
    } catch (logErr: any) {
      console.warn('[generate-packet-pdf] history log failed:', logErr.message);
    }

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'X-Survivor-Packet-File': fileName,
      },
    });
  } catch (err: any) {
    console.error('[generate-packet-pdf] fatal', err);
    return new Response(JSON.stringify({ error: err.message || 'PDF generation failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
