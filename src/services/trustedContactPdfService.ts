import jsPDF from 'jspdf';
import { supabase } from '@/integrations/supabase/client';
import { SECTIONS_CONFIG } from '@/config/sectionsConfig';

/**
 * PDF export for the Trusted Contact viewer.
 * Exports ONLY the sections the viewer is permitted to see.
 * RLS guarantees that any rows fetched here are already permission-scoped.
 */

const SECTION_TABLES: Record<string, { table: string; titleField: string; subtitleField?: string; bodyFields?: string[] }[]> = {
  info: [{ table: 'info_records', titleField: 'title', subtitleField: 'category', bodyFields: ['notes'] }],
  family: [{ table: 'family_members', titleField: 'name', subtitleField: 'relationship', bodyFields: ['email', 'phone', 'address', 'reminder_notes'] }],
  medical: [
    { table: 'medical_records', titleField: 'provider_name', subtitleField: 'specialty', bodyFields: ['phone', 'address', 'notes'] },
    { table: 'medications', titleField: 'name', subtitleField: 'dose', bodyFields: ['frequency', 'pharmacy', 'notes'] },
  ],
  banking: [
    { table: 'banking_records', titleField: 'institution', subtitleField: 'account_type', bodyFields: ['account_number_masked', 'beneficiary_notes', 'notes'] },
    { table: 'credit_cards', titleField: 'issuer', subtitleField: 'card_type', bodyFields: ['last_four', 'notes'] },
  ],
  investments: [{ table: 'investment_records', titleField: 'institution', subtitleField: 'account_type', bodyFields: ['account_nickname', 'approximate_value', 'notes'] }],
  legal: [{ table: 'legal_documents', titleField: 'document_type', subtitleField: 'attorney_name', bodyFields: ['attorney_firm', 'attorney_phone', 'original_location', 'notes'] }],
  advisors: [{ table: 'advisor_records', titleField: 'name', subtitleField: 'firm', bodyFields: ['email', 'phone', 'address', 'notes'] }],
  funeral: [{ table: 'funeral_records', titleField: 'funeral_home', subtitleField: 'burial_or_cremation', bodyFields: ['funeral_director', 'service_preferences', 'additional_instructions'] }],
  memories: [{ table: 'memories', titleField: 'title', subtitleField: 'entry_type', bodyFields: ['content', 'recipient'] }],
};

export async function generateTrustedContactPDF(
  packetId: string,
  ownerName: string,
  permittedSections: string[]
): Promise<void> {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Cover
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(`${ownerName}'s Survivor Packet`, margin, y);
  y += 28;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(120);
  doc.text('Trusted contact export — read-only view', margin, y);
  y += 16;
  doc.text(`Generated ${new Date().toLocaleString()}`, margin, y);
  y += 28;
  doc.setTextColor(0);

  for (const sectionId of permittedSections) {
    const tables = SECTION_TABLES[sectionId];
    if (!tables) continue;
    const sectionLabel = SECTIONS_CONFIG.find((s) => s.id === sectionId)?.label ?? sectionId;

    ensureSpace(40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(26, 35, 50);
    doc.text(sectionLabel, margin, y);
    y += 8;
    doc.setDrawColor(220);
    doc.line(margin, y, pageWidth - margin, y);
    y += 16;
    doc.setTextColor(0);

    let totalRows = 0;
    for (const t of tables) {
      const { data, error } = await supabase
        .from(t.table as any)
        .select('*')
        .eq('packet_id', packetId);
      if (error) {
        console.error(`Fetch ${t.table}:`, error);
        continue;
      }
      const rows = (data as any[]) || [];
      totalRows += rows.length;

      for (const row of rows) {
        ensureSpace(60);
        const title = row[t.titleField] || 'Untitled';
        const subtitle = t.subtitleField ? row[t.subtitleField] : null;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(String(title), margin, y);
        y += 14;

        if (subtitle) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(10);
          doc.setTextColor(110);
          doc.text(String(subtitle), margin, y);
          y += 12;
          doc.setTextColor(0);
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        for (const field of t.bodyFields || []) {
          const val = row[field];
          if (!val) continue;
          const lines = doc.splitTextToSize(`${field.replace(/_/g, ' ')}: ${val}`, pageWidth - margin * 2);
          ensureSpace(lines.length * 12 + 6);
          doc.text(lines, margin, y);
          y += lines.length * 12;
        }
        y += 10;
      }
    }

    if (totalRows === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(140);
      doc.text('No entries recorded in this section.', margin, y);
      doc.setTextColor(0);
      y += 24;
    } else {
      y += 8;
    }
  }

  doc.save(`${ownerName.replace(/[^a-z0-9]/gi, '_')}_survivor_packet.pdf`);
}
