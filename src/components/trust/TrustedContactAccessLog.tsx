import React, { useEffect, useState } from 'react';
import { Eye, Loader2, History } from 'lucide-react';
import { toast } from 'sonner';
import { useAppContext } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { SECTIONS_CONFIG } from '@/config/sectionsConfig';

interface AccessLogRow {
  id: string;
  trusted_contact_user_id: string;
  packet_id: string;
  section_key: string | null;
  action: string;
  created_at: string;
}

interface ContactLookup {
  user_id: string;
  contact_name: string;
}

const sectionLabel = (key: string | null) => {
  if (!key) return 'Packet';
  const found = SECTIONS_CONFIG.find((s) => s.id === key);
  return found?.label ?? key;
};

export const TrustedContactAccessLog: React.FC = () => {
  const { currentPacket } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AccessLogRow[]>([]);
  const [contacts, setContacts] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      if (!currentPacket?.id) return;
      setLoading(true);
      try {
        const [logRes, contactsRes] = await Promise.all([
          supabase
            .from('trusted_contact_access_log' as any)
            .select('*')
            .eq('packet_id', currentPacket.id)
            .order('created_at', { ascending: false })
            .limit(100),
          supabase
            .from('trusted_contacts')
            .select('user_id, contact_name')
            .eq('packet_id', currentPacket.id),
        ]);

        if (logRes.error) throw logRes.error;
        if (contactsRes.error) throw contactsRes.error;

        const map: Record<string, string> = {};
        ((contactsRes.data || []) as ContactLookup[]).forEach((c) => {
          if (c.user_id) map[c.user_id] = c.contact_name;
        });
        setContacts(map);
        setRows(((logRes.data || []) as unknown) as AccessLogRow[]);
      } catch (err: any) {
        console.error('Load access log:', err);
        toast.error(err?.message || 'Could not load access log');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentPacket?.id]);

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-stone-500 flex items-center gap-2">
          <History className="w-4 h-4" /> Trusted Contact Access Log
        </h3>
        <p className="text-xs text-stone-500 mt-1">
          A record of every section view by your trusted contacts.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
        </div>
      ) : rows.length === 0 ? (
        <div className="paper-sheet p-6 text-center text-sm text-stone-500">
          No access activity recorded yet.
        </div>
      ) : (
        <div className="paper-sheet divide-y divide-stone-100 overflow-hidden">
          {rows.map((row) => {
            const name = contacts[row.trusted_contact_user_id] || 'Trusted contact';
            const when = new Date(row.created_at);
            return (
              <div key={row.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <Eye className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-stone-700">
                    <span className="font-bold text-navy-muted">{name}</span>{' '}
                    viewed <span className="font-semibold">{sectionLabel(row.section_key)}</span>
                  </div>
                  <div className="text-xs text-stone-500">
                    {when.toLocaleDateString()} at {when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
