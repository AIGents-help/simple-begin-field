import jsPDF from 'jspdf';
import { supabase } from '@/integrations/supabase/client';

const NAVY = [26, 39, 68] as const;   // #1a2744
const GOLD = [201, 168, 76] as const;  // #c9a84c
const GRAY = [120, 113, 108] as const;
const LIGHT = [200, 200, 200] as const;

interface SectionData {
  title: string;
  records: Record<string, any>[];
  fields: { key: string; label: string }[];
}

async function loadAllSections(packetId: string): Promise<SectionData[]> {
  const queries = [
    { table: 'family_members', title: 'Family & Contacts', fields: [
      { key: 'name', label: 'Name' }, { key: 'relationship', label: 'Relationship' },
      { key: 'phone', label: 'Phone' }, { key: 'email', label: 'Email' },
      { key: 'address', label: 'Address' }, { key: 'birthday', label: 'Birthday' },
    ]},
    { table: 'medical_records', title: 'Medical Information', fields: [
      { key: 'provider_name', label: 'Provider' }, { key: 'specialty', label: 'Specialty' },
      { key: 'phone', label: 'Phone' }, { key: 'notes', label: 'Notes' },
    ]},
    { table: 'banking_records', title: 'Banking & Financial', fields: [
      { key: 'institution', label: 'Institution' }, { key: 'account_type', label: 'Account Type' },
      { key: 'account_number_masked', label: 'Account (masked)' },
      { key: 'contact_info', label: 'Contact' }, { key: 'notes', label: 'Notes' },
    ]},
    { table: 'real_estate_records', title: 'Real Estate & Property', fields: [
      { key: 'property_label', label: 'Property' }, { key: 'address', label: 'Address' },
      { key: 'insurance_details', label: 'Insurance' }, { key: 'notes', label: 'Notes' },
    ]},
    { table: 'retirement_records', title: 'Retirement & Investments', fields: [
      { key: 'institution', label: 'Institution' }, { key: 'account_type', label: 'Account Type' },
      { key: 'account_number_masked', label: 'Account (masked)' },
      { key: 'beneficiary_notes', label: 'Beneficiary' }, { key: 'notes', label: 'Notes' },
    ]},
    { table: 'vehicle_records', title: 'Vehicles', fields: [
      { key: 'year', label: 'Year' }, { key: 'make', label: 'Make' }, { key: 'model', label: 'Model' },
      { key: 'vin', label: 'VIN' }, { key: 'license_plate', label: 'Plate' },
      { key: 'insurance', label: 'Insurance' }, { key: 'notes', label: 'Notes' },
    ]},
    { table: 'advisor_records', title: 'Advisors & Professionals', fields: [
      { key: 'name', label: 'Name' }, { key: 'advisor_type', label: 'Type' },
      { key: 'firm', label: 'Firm' }, { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' }, { key: 'notes', label: 'Notes' },
    ]},
    { table: 'password_records', title: 'Passwords & Digital Access', fields: [
      { key: 'service_name', label: 'Service' }, { key: 'username', label: 'Username' },
      { key: 'password_masked', label: 'Password (masked)' },
      { key: 'access_instructions', label: 'Access Instructions' },
      { key: 'two_fa_notes', label: '2FA Notes' },
    ]},
    { table: 'personal_property_records', title: 'Personal Property', fields: [
      { key: 'item_name', label: 'Item' }, { key: 'description', label: 'Description' },
      { key: 'location', label: 'Location' }, { key: 'estimated_value', label: 'Est. Value' },
      { key: 'beneficiary', label: 'Beneficiary' }, { key: 'notes', label: 'Notes' },
    ]},
    { table: 'pet_records', title: 'Pets', fields: [
      { key: 'pet_name', label: 'Name' }, { key: 'species_breed', label: 'Species/Breed' },
      { key: 'age', label: 'Age' }, { key: 'veterinarian_contact', label: 'Vet' },
      { key: 'medications', label: 'Medications' }, { key: 'care_instructions', label: 'Care Instructions' },
    ]},
    { table: 'funeral_records', title: 'Funeral & End-of-Life', fields: [
      { key: 'funeral_home', label: 'Funeral Home' }, { key: 'funeral_director', label: 'Director' },
      { key: 'burial_or_cremation', label: 'Burial/Cremation' },
      { key: 'service_preferences', label: 'Service Preferences' },
      { key: 'cemetery_plot_details', label: 'Cemetery/Plot' },
      { key: 'prepaid_arrangements', label: 'Prepaid Arrangements' },
      { key: 'obituary_notes', label: 'Obituary Notes' },
    ]},
    { table: 'info_records', title: 'Additional Information', fields: [
      { key: 'title', label: 'Title' }, { key: 'category', label: 'Category' },
      { key: 'notes', label: 'Notes' },
    ]},
  ];

  const results = await Promise.all(
    queries.map(async (q) => {
      const { data } = await supabase
        .from(q.table as any)
        .select('*')
        .eq('packet_id', packetId);
      return { title: q.title, records: (data || []) as Record<string, any>[], fields: q.fields };
    })
  );

  return results;
}

function addCoverPage(doc: jsPDF, fullName: string, dateStr: string) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  // Confidential watermark
  doc.setTextColor(...LIGHT);
  doc.setFontSize(60);
  doc.text('CONFIDENTIAL', w / 2, h / 2, { align: 'center', angle: 45 });

  // Gold rule
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(1.5);
  doc.line(60, h / 2 - 60, w - 60, h / 2 - 60);

  // Title
  doc.setTextColor(...NAVY);
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  doc.text('Survivor Packet', w / 2, h / 2 - 30, { align: 'center' });

  // Name
  doc.setFontSize(18);
  doc.setFont('helvetica', 'normal');
  doc.text(fullName, w / 2, h / 2 + 10, { align: 'center' });

  // Date
  doc.setFontSize(12);
  doc.setTextColor(...GRAY);
  doc.text(`Generated on ${dateStr}`, w / 2, h / 2 + 30, { align: 'center' });

  // Bottom rule
  doc.setDrawColor(...GOLD);
  doc.line(60, h / 2 + 60, w - 60, h / 2 + 60);
}

function addSectionPages(doc: jsPDF, section: SectionData) {
  doc.addPage();
  const w = doc.internal.pageSize.getWidth();
  let y = 30;

  // Section title
  doc.setTextColor(...NAVY);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(section.title.toUpperCase(), 20, y);
  y += 6;

  // Gold rule
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(1);
  doc.line(20, y, w - 20, y);
  y += 14;

  if (section.records.length === 0) {
    doc.setTextColor(...GRAY);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    doc.text('No information recorded for this section.', 20, y);
    return;
  }

  section.records.forEach((record, idx) => {
    if (idx > 0) {
      // Divider between records
      if (y > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        y = 30;
      }
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
      doc.line(20, y, w - 20, y);
      y += 10;
    }

    section.fields.forEach((field) => {
      const val = record[field.key];
      if (val === null || val === undefined || val === '') return;

      // Check page break
      if (y > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage();
        y = 30;
      }

      // Field label
      doc.setTextColor(...NAVY);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(field.label, 20, y);

      // Field value — wrap long text
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const valStr = String(val);
      const lines = doc.splitTextToSize(valStr, w - 80);
      doc.text(lines, 80, y);
      y += Math.max(lines.length * 5, 6) + 4;
    });

    y += 6;
  });
}

function addFooterPage(doc: jsPDF, dateStr: string) {
  doc.addPage();
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  doc.setTextColor(...GRAY);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('This document was generated by Survivor Packet', w / 2, h / 2 - 10, { align: 'center' });
  doc.text('survivorpacket.com', w / 2, h / 2 + 6, { align: 'center' });
  doc.text(dateStr, w / 2, h / 2 + 22, { align: 'center' });
}

export async function generatePacketPDF(userId: string): Promise<void> {
  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', userId)
    .single();

  const fullName = profile?.full_name || profile?.email || 'User';

  // Get packet
  const { data: packet, error: packetErr } = await supabase
    .from('packets')
    .select('id')
    .eq('owner_user_id', userId)
    .single();

  if (packetErr || !packet) throw new Error('Could not find your packet');

  // Load all sections
  const sections = await loadAllSections(packet.id);

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const fileDate = now.toISOString().slice(0, 10);

  // Build PDF
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });

  addCoverPage(doc, fullName, dateStr);

  sections.forEach((section) => {
    addSectionPages(doc, section);
  });

  addFooterPage(doc, dateStr);

  // Download
  const safeName = fullName.replace(/[^a-zA-Z0-9]/g, '-');
  doc.save(`Survivor-Packet-${safeName}-${fileDate}.pdf`);
}
