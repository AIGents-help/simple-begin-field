import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  Loader2, ShieldCheck, Lock, Eye, LogOut, AlertCircle, FileText, Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { trustedContactPortalService } from '@/services/trustedContactPortalService';
import { generateTrustedContactPDF } from '@/services/trustedContactPdfService';
import { SECTIONS_CONFIG } from '@/config/sectionsConfig';

/**
 * Trusted Contact Dashboard — read-only viewer experience.
 *
 * - Loads the released packets the current user can view.
 * - Shows whose packet they are viewing + a read-only banner.
 * - Lists only the section keys the owner has granted.
 * - For each section, fetches the underlying records via RLS-restricted SELECTs.
 *   (RLS guarantees only released + permitted rows come back.)
 *
 * If the user isn't a trusted contact at all, they're redirected home.
 * If their access has not been released yet, they see a "waiting" screen.
 */

const SECTION_TABLES: Record<string, { table: string; titleField: string; subtitleField?: string }[]> = {
  info: [{ table: 'info_records', titleField: 'title', subtitleField: 'category' }],
  family: [{ table: 'family_members', titleField: 'name', subtitleField: 'relationship' }],
  medical: [
    { table: 'medical_records', titleField: 'provider_name', subtitleField: 'specialty' },
    { table: 'medications', titleField: 'name', subtitleField: 'dose' },
  ],
  banking: [
    { table: 'banking_records', titleField: 'institution', subtitleField: 'account_type' },
    { table: 'credit_cards', titleField: 'issuer', subtitleField: 'card_type' },
  ],
  investments: [{ table: 'investment_records', titleField: 'institution', subtitleField: 'account_type' }],
  retirement: [{ table: 'investment_records', titleField: 'institution', subtitleField: 'account_type' }],
  legal: [{ table: 'legal_documents', titleField: 'document_type', subtitleField: 'attorney_name' }],
  advisors: [{ table: 'advisor_records', titleField: 'name', subtitleField: 'firm' }],
  passwords: [{ table: 'password_records', titleField: 'service_name', subtitleField: 'username' }],
  funeral: [{ table: 'funeral_records', titleField: 'funeral_home', subtitleField: 'burial_or_cremation' }],
  memories: [{ table: 'memories', titleField: 'title', subtitleField: 'entry_type' }],
};

interface ViewerPacket {
  id: string;
  packet_id: string;
  access_released: boolean;
  contact_name: string;
  packets: any;
}

export const TrustedContactDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [viewerPackets, setViewerPackets] = useState<ViewerPacket[]>([]);
  const [activePacketId, setActivePacketId] = useState<string | null>(null);
  const [permittedSections, setPermittedSections] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [sectionRows, setSectionRows] = useState<any[]>([]);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Auth check
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSignedIn(!!data.session);
      setAuthChecked(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSignedIn(!!session);
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  // Load viewer packets
  useEffect(() => {
    if (!signedIn) return;
    const load = async () => {
      setLoading(true);
      try {
        const list = await trustedContactPortalService.listViewerPackets();
        setViewerPackets(list as any);
        const released = list.find((p: any) => p.access_released);
        if (released) setActivePacketId((released as any).packet_id);
      } catch (err: any) {
        console.error('Load viewer packets:', err);
        toast.error(err?.message || 'Could not load your access.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [signedIn]);

  // Load permissions for the active packet
  useEffect(() => {
    if (!activePacketId) return;
    trustedContactPortalService
      .listViewerPermittedSections(activePacketId)
      .then((perms) => {
        setPermittedSections(perms);
        if (perms.length > 0) setActiveSection(perms[0]);
      })
      .catch((err) => {
        console.error('Load permissions:', err);
        toast.error(err?.message || 'Could not load permissions.');
      });
  }, [activePacketId]);

  // Load records for the current section
  useEffect(() => {
    if (!activePacketId || !activeSection) {
      setSectionRows([]);
      return;
    }
    const tables = SECTION_TABLES[activeSection];
    if (!tables) {
      setSectionRows([]);
      return;
    }
    const load = async () => {
      setSectionLoading(true);
      try {
        const all: any[] = [];
        for (const t of tables) {
          const { data, error } = await supabase
            .from(t.table as any)
            .select('*')
            .eq('packet_id', activePacketId);
          if (error) {
            console.error(`Fetch ${t.table}:`, error);
            continue;
          }
          (data || []).forEach((row: any) =>
            all.push({ ...row, __title: row[t.titleField], __subtitle: t.subtitleField ? row[t.subtitleField] : null, __table: t.table })
          );
        }
        setSectionRows(all);
        // Log the view (best-effort)
        trustedContactPortalService.logSectionView(activePacketId, activeSection);
      } catch (err: any) {
        toast.error(err?.message || 'Could not load section');
      } finally {
        setSectionLoading(false);
      }
    };
    load();
  }, [activePacketId, activeSection]);

  const activePacket = useMemo(
    () => viewerPackets.find((p) => p.packet_id === activePacketId) || null,
    [viewerPackets, activePacketId]
  );

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/', { replace: true });
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfaf3]">
        <Loader2 className="w-8 h-8 animate-spin text-navy-muted" />
      </div>
    );
  }

  if (!signedIn) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfaf3]">
        <Loader2 className="w-8 h-8 animate-spin text-navy-muted" />
      </div>
    );
  }

  if (viewerPackets.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfaf3] p-6">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-xl text-center space-y-4 border border-stone-200">
          <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-stone-400" />
          </div>
          <h1 className="text-xl font-serif font-bold text-navy-muted">No Trusted Access</h1>
          <p className="text-sm text-stone-600">
            Your account is not linked to any Survivor Packet as a trusted contact yet.
          </p>
          <button
            onClick={handleSignOut}
            className="px-5 py-2.5 rounded-lg bg-stone-100 text-stone-700 font-bold text-sm hover:bg-stone-200"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  if (!activePacket?.access_released) {
    const owner = activePacket?.packets?.person_a_name || 'the owner';
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfaf3] p-6">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-xl text-center space-y-4 border border-stone-200">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-xl font-serif font-bold text-navy-muted">Access Not Yet Released</h1>
          <p className="text-sm text-stone-600 leading-relaxed">
            <span className="font-semibold">{owner}</span> has added you as a trusted contact,
            but has not yet released their packet to you. You will receive an email
            notification when access is granted.
          </p>
          <button
            onClick={handleSignOut}
            className="px-5 py-2.5 rounded-lg bg-stone-100 text-stone-700 font-bold text-sm hover:bg-stone-200 inline-flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </div>
    );
  }

  const ownerName = activePacket.packets?.person_a_name || 'Owner';
  const sectionsToShow = SECTIONS_CONFIG.filter((s) => permittedSections.includes(s.id));

  return (
    <div className="min-h-screen bg-[#fdfaf3] flex flex-col">
      {/* Read-only banner */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs text-amber-800 font-semibold">
        <Eye className="w-3 h-3 inline mr-1" />
        Read-only view — you are viewing {ownerName}'s Survivor Packet
      </div>

      {/* Header */}
      <header className="bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-navy-muted/10 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-navy-muted" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
              Trusted Contact Access
            </div>
            <div className="font-serif font-bold text-navy-muted truncate">
              {ownerName}'s Survivor Packet
            </div>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="text-xs font-bold text-stone-600 hover:text-navy-muted inline-flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-stone-50"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row max-w-[1280px] w-full mx-auto">
        {/* Sidebar nav */}
        <aside className="lg:w-64 lg:border-r border-b lg:border-b-0 border-stone-200 p-4 bg-white">
          <div className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-3">
            Permitted sections
          </div>
          {sectionsToShow.length === 0 ? (
            <p className="text-xs text-stone-500">
              No sections were granted. Contact {ownerName} for access.
            </p>
          ) : (
            <nav className="flex lg:flex-col gap-1 overflow-x-auto">
              {sectionsToShow.map((s) => {
                const Icon = s.icon;
                const isActive = activeSection === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      isActive
                        ? 'bg-navy-muted text-white'
                        : 'text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {s.label}
                  </button>
                );
              })}
            </nav>
          )}
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">
          {!activeSection ? (
            <div className="text-stone-500 text-sm">Select a section to view.</div>
          ) : sectionLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
            </div>
          ) : sectionRows.length === 0 ? (
            <div className="paper-sheet p-8 text-center">
              <FileText className="w-8 h-8 text-stone-300 mx-auto mb-2" />
              <p className="text-sm text-stone-500">
                No entries recorded in this section.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <h2 className="text-xl font-serif font-bold text-navy-muted">
                {SECTIONS_CONFIG.find((s) => s.id === activeSection)?.label}
              </h2>
              {sectionRows.map((row) => (
                <div key={`${row.__table}-${row.id}`} className="paper-sheet p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-bold text-navy-muted">{row.__title || 'Untitled'}</div>
                      {row.__subtitle && (
                        <div className="text-xs text-stone-500 mt-0.5">{row.__subtitle}</div>
                      )}
                    </div>
                  </div>
                  {row.notes && (
                    <p className="text-sm text-stone-600 mt-3 whitespace-pre-wrap">{row.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
