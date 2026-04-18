// Frontend service for the server-side PDF generator.
// Calls the `generate-packet-pdf` edge function and triggers a browser download.

import { supabase } from '@/integrations/supabase/client';

export type PdfDownloadType =
  | 'full_packet'
  | 'section'
  | 'admin'
  | 'funeral_instructions'
  | 'emergency_medical';

export interface PdfGenOptions {
  packetId?: string;            // defaults to caller's own packet on the server
  sections?: string[];          // empty/undefined = all sections
  redactSensitive?: boolean;    // default true
  format?: 'full' | 'summary';  // default 'full'
  includeCover?: boolean;       // default true
  includeWatermark?: boolean;   // default true
  downloadType?: PdfDownloadType;
}

export interface DownloadHistoryRow {
  id: string;
  packet_id: string;
  downloaded_by: string | null;
  downloader_email: string | null;
  downloader_role: string;
  sections_included: string[];
  include_sensitive: boolean;
  format_option: string;
  download_type: string;
  file_name: string | null;
  notes: string | null;
  created_at: string;
}

function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Defer revoke so the download starts cleanly in all browsers
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const packetPdfService = {
  async generate(options: PdfGenOptions = {}): Promise<{ filename: string; size: number }> {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) {
      throw new Error('You must be signed in to generate a PDF.');
    }

    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
    const url = `${SUPABASE_URL}/functions/v1/generate-packet-pdf`;

    const body = {
      packet_id: options.packetId,
      sections: options.sections,
      redact_sensitive: options.redactSensitive ?? true,
      format: options.format ?? 'full',
      include_cover: options.includeCover ?? true,
      include_watermark: options.includeWatermark ?? true,
      download_type: options.downloadType ?? 'full_packet',
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      let message = `Server returned ${res.status}`;
      try {
        const parsed = JSON.parse(errBody);
        if (parsed?.error) message = parsed.error;
      } catch {
        if (errBody) message = errBody;
      }
      throw new Error(message);
    }

    const filenameHeader = res.headers.get('X-Survivor-Packet-File') || res.headers.get('content-disposition') || '';
    let filename = 'SurvivorPacket.pdf';
    const match = filenameHeader.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
    if (match) {
      filename = decodeURIComponent(match[1]);
    } else if (res.headers.get('X-Survivor-Packet-File')) {
      filename = res.headers.get('X-Survivor-Packet-File')!;
    }

    const blob = await res.blob();
    triggerBrowserDownload(blob, filename);
    return { filename, size: blob.size };
  },

  async getHistory(limit = 25): Promise<DownloadHistoryRow[]> {
    const { data, error } = await supabase
      .from('packet_download_history' as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []) as unknown as DownloadHistoryRow[];
  },
};
