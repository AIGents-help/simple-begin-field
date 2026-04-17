import jsPDF from 'jspdf';
import { supabase } from '@/integrations/supabase/client';

interface Args {
  section: 'obituary' | 'eulogy' | 'full';
  packetTitle: string;
  personName: string;
  record: any;
}

const stripHtml = (html: string | null | undefined): string => {
  if (!html) return '';
  return html
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
};

const addWrappedText = (
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight = 6,
): number => {
  if (!text) return y;
  const lines = doc.splitTextToSize(text, maxWidth);
  for (const line of lines) {
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
    doc.text(line, x, y);
    y += lineHeight;
  }
  return y;
};

const heading = (doc: jsPDF, text: string, y: number): number => {
  if (y > 270) {
    doc.addPage();
    y = 20;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(text, 20, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  return y + 8;
};

export async function buildFuneralPdfBlob(args: Args): Promise<Blob> {
  const { section, packetTitle, personName, record } = args;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const maxW = 170;
  let y = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  const titleMap: Record<string, string> = {
    obituary: 'Obituary',
    eulogy: 'Eulogy',
    full: 'Funeral Instructions',
  };
  doc.text(titleMap[section], 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`${packetTitle}${personName ? ` — ${personName}` : ''}`, 20, y);
  doc.text(new Date().toLocaleDateString(), 190, y, { align: 'right' });
  doc.setTextColor(0);
  y += 10;

  const obituaryText = stripHtml(record.obituary_text);
  const eulogyText = stripHtml(record.eulogy_text);

  if (section === 'obituary' || section === 'full') {
    if (obituaryText) {
      y = heading(doc, 'Obituary', y);
      y = addWrappedText(doc, obituaryText, 20, y, maxW);
      y += 4;
    }
  }

  if (section === 'eulogy' || section === 'full') {
    if (eulogyText) {
      y = heading(doc, 'Eulogy', y);
      if (record.eulogy_author) {
        doc.setFont('helvetica', 'italic');
        y = addWrappedText(doc, `By ${record.eulogy_author}`, 20, y, maxW);
        doc.setFont('helvetica', 'normal');
        y += 2;
      }
      y = addWrappedText(doc, eulogyText, 20, y, maxW);
      y += 4;
    }
  }

  if (section === 'full') {
    const sections: Array<[string, string | null | undefined]> = [
      ['Burial or Cremation', record.burial_or_cremation],
      ['Service Preferences', record.service_preferences],
      ['Religious / Cultural Preferences', record.religious_cultural_preferences],
      ['Cemetery / Plot Details', record.cemetery_plot_details],
      ['Prepaid Arrangements', record.prepaid_arrangements],
      ['Flowers & Arrangements', record.flowers_preferences],
      ['Reception Wishes', record.reception_wishes],
      ['Personal Messages', record.personal_messages],
      ['Additional Instructions', record.additional_instructions],
    ];
    for (const [label, val] of sections) {
      if (val && String(val).trim()) {
        y = heading(doc, label, y);
        y = addWrappedText(doc, String(val), 20, y, maxW);
        y += 4;
      }
    }

    // Music
    if (record.packet_id && record.id) {
      const { data: music } = await (supabase as any)
        .from('funeral_music')
        .select('song_title, artist, when_to_play, notes')
        .eq('funeral_record_id', record.id)
        .order('display_order', { ascending: true });
      if (music && music.length > 0) {
        y = heading(doc, 'Music List', y);
        for (const [i, s] of music.entries()) {
          const line = `${i + 1}. ${s.song_title}${s.artist ? ` — ${s.artist}` : ''}${s.when_to_play ? ` (${s.when_to_play})` : ''}`;
          y = addWrappedText(doc, line, 20, y, maxW);
          if (s.notes) y = addWrappedText(doc, `   ${s.notes}`, 20, y, maxW);
        }
        y += 4;
      }

      const { data: readings } = await (supabase as any)
        .from('funeral_readings')
        .select('title, author, full_text, reader_name')
        .eq('funeral_record_id', record.id)
        .order('display_order', { ascending: true });
      if (readings && readings.length > 0) {
        y = heading(doc, 'Readings & Poems', y);
        for (const r of readings) {
          doc.setFont('helvetica', 'bold');
          y = addWrappedText(doc, r.title, 20, y, maxW);
          doc.setFont('helvetica', 'normal');
          if (r.author) y = addWrappedText(doc, `By ${r.author}`, 20, y, maxW);
          if (r.reader_name) y = addWrappedText(doc, `Read by ${r.reader_name}`, 20, y, maxW);
          if (r.full_text) y = addWrappedText(doc, r.full_text, 20, y, maxW);
          y += 3;
        }
      }
    }
  }

  return doc.output('blob');
}

export async function generateFuneralPdf(args: Args) {
  const blob = await buildFuneralPdfBlob(args);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const name =
    args.section === 'full'
      ? 'funeral-instructions'
      : args.section === 'obituary'
        ? 'obituary'
        : 'eulogy';
  a.download = `${name}-${(args.personName || 'survivor-packet').replace(/\s+/g, '-').toLowerCase()}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
