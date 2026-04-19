import React, { useEffect, useState } from 'react';
import { Loader2, QrCode, Download, RefreshCw, Eye, EyeOff, Phone, AlertTriangle, MapPin, Clock, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { emergencyService, EmergencyToken, EmergencyAccessLogEntry } from '../../services/emergencyService';
import { generateEmergencyCardsPdf, generateQrPng } from '../../services/emergencyCardPdf';
import { useAppContext } from '../../context/AppContext';
import { supabase } from '@/integrations/supabase/client';

const SECTION_LABELS: Record<string, string> = {
  blood_type: 'Blood Type',
  allergies: 'Allergies',
  medications: 'Medications',
  medical_conditions: 'Medical Conditions',
  dnr_status: 'DNR Status',
  organ_donor: 'Organ Donor Status',
  emergency_contacts: 'Emergency Contacts',
  doctor: 'Doctor Info',
  insurance: 'Insurance Info',
  custom_field: 'Custom Note',
};

export const EmergencyCardSettings: React.FC = () => {
  const { user, currentPacket, userDisplayName } = useAppContext();
  const [token, setToken] = useState<EmergencyToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [hint, setHint] = useState('');
  const [saving, setSaving] = useState(false);
  const [qrPreview, setQrPreview] = useState<string>('');
  const [accessLog, setAccessLog] = useState<EmergencyAccessLogEntry[]>([]);
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const t = await emergencyService.getMyToken();
      setToken(t);
      if (t) {
        setHint(t.pin_hint || '');
        const url = await emergencyService.getEmergencyUrl(t.token);
        setQrPreview(await generateQrPng(url));
        setAccessLog(await emergencyService.getAccessLog());
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to load emergency card', { duration: 5000, position: 'bottom-center' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const savePin = async () => {
    if (!/^\d{4,6}$/.test(pin)) { toast.error('PIN must be 4-6 digits'); return; }
    if (pin !== confirmPin) { toast.error('PINs do not match'); return; }
    setSaving(true);
    try {
      await emergencyService.setPin(pin, hint || undefined);
      toast.success('Emergency PIN saved', { duration: 3000, position: 'bottom-center' });
      setPin(''); setConfirmPin('');
      await load();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save PIN', { duration: 5000, position: 'bottom-center' });
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = async (key: string) => {
    if (!token) return;
    const next = { ...token.visible_sections, [key]: !token.visible_sections[key] };
    try {
      await emergencyService.updateVisibleSections(next, token.custom_field_text);
      setToken({ ...token, visible_sections: next });
    } catch (e: any) {
      toast.error('Failed to update', { duration: 5000, position: 'bottom-center' });
    }
  };

  const updateCustomText = async (text: string) => {
    if (!token) return;
    setToken({ ...token, custom_field_text: text });
  };

  const saveCustomText = async () => {
    if (!token) return;
    try {
      await emergencyService.updateVisibleSections(token.visible_sections, token.custom_field_text);
      toast.success('Saved', { duration: 2000, position: 'bottom-center' });
    } catch (e: any) {
      toast.error('Failed to save', { duration: 5000 });
    }
  };

  const regenerate = async (compromised = false) => {
    const msg = compromised
      ? 'RESET QR CODE: This will immediately invalidate the existing QR code and PIN access via that code. Anyone holding an old printed card will no longer be able to scan it. You must reprint and redistribute new cards. Continue?'
      : 'This will invalidate ALL existing printed cards. You will need to reprint and redistribute. Continue?';
    if (!confirm(msg)) return;
    try {
      await emergencyService.regenerateToken();
      toast.success(
        compromised
          ? 'QR code reset. Old cards are now inactive — reprint immediately.'
          : 'New QR code generated. Reprint your cards.',
        { duration: 5000, position: 'bottom-center' }
      );
      await load();
    } catch (e: any) {
      toast.error(e.message || 'Failed', { duration: 5000 });
    }
  };

  const downloadCards = async () => {
    if (!token) return;
    setGenerating(true);
    try {
      const url = await emergencyService.getEmergencyUrl(token.token);
      const firstName = (userDisplayName || 'You').split(' ')[0];

      // Pull supporting data from medical + family for the back of the card
      const { data: med } = await supabase
        .from('medical_records')
        .select('blood_type, allergies')
        .eq('packet_id', currentPacket?.id)
        .maybeSingle();
      const { data: fam } = await supabase
        .from('family_members')
        .select('name, phone')
        .eq('packet_id', currentPacket?.id)
        .not('phone', 'is', null)
        .order('created_at')
        .limit(1);
      const { data: trusted } = await supabase
        .from('trusted_contacts')
        .select('contact_name')
        .eq('user_id', user?.id);

      const blob = await generateEmergencyCardsPdf({
        ownerFirstName: firstName,
        emergencyUrl: url,
        pinHint: token.pin_hint,
        emergencyContactName: fam?.[0]?.name || null,
        emergencyContactPhone: fam?.[0]?.phone || null,
        bloodType: med?.blood_type || null,
        criticalAllergy: med?.allergies?.split(',')[0]?.trim() || null,
        trustedContactNames: (trusted || []).map((t: any) => t.contact_name).filter(Boolean),
      });

      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `EmergencyCard_${firstName}_${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success('Emergency cards downloaded', { duration: 3000, position: 'bottom-center' });
    } catch (e: any) {
      toast.error(e.message || 'Failed to generate PDF', { duration: 5000, position: 'bottom-center' });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div className="paper-sheet p-6 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-stone-400" /></div>;
  }

  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-4 flex items-center gap-2">
        <QrCode size={12} /> Emergency QR Card
      </h3>

      {!token ? (
        <div className="paper-sheet p-5 mb-4 space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-bold text-navy-muted">Set up your Emergency Card</p>
            <p className="text-xs text-stone-500 leading-relaxed">
              Print a wallet-sized card with a QR code. Trusted contacts scan it to access critical emergency
              information after entering your PIN.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">PIN (4-6 digits)</label>
              <input
                type="tel" inputMode="numeric" maxLength={6}
                value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                className="w-full mt-1 p-3 bg-white rounded-xl border border-stone-200 text-sm tracking-widest"
                placeholder="••••"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Confirm PIN</label>
              <input
                type="tel" inputMode="numeric" maxLength={6}
                value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                className="w-full mt-1 p-3 bg-white rounded-xl border border-stone-200 text-sm tracking-widest"
                placeholder="••••"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">PIN Hint (optional)</label>
              <input
                type="text" maxLength={60}
                value={hint} onChange={e => setHint(e.target.value)}
                className="w-full mt-1 p-3 bg-white rounded-xl border border-stone-200 text-sm"
                placeholder="e.g. Year of birth"
              />
            </div>
            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
              ⚠️ Choose a PIN your trusted contacts know. Don't make it too obscure.
            </p>
          </div>

          <button
            onClick={savePin} disabled={saving}
            className="w-full py-3 bg-navy-muted text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Emergency Card'}
          </button>
        </div>
      ) : (
        <>
          {/* QR Preview & Download */}
          <div className="paper-sheet p-5 mb-4">
            <div className="flex gap-4 items-start">
              {qrPreview && (
                <img src={qrPreview} alt="Emergency QR" className="w-28 h-28 border border-stone-200 rounded-lg" />
              )}
              <div className="flex-1 space-y-2">
                <p className="text-sm font-bold text-navy-muted">Your Emergency Card is Active</p>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  Print on cardstock, cut, and laminate. Carry one in your wallet, give one to each trusted contact.
                </p>
                <button
                  onClick={downloadCards} disabled={generating}
                  className="mt-2 w-full py-2.5 bg-navy-muted text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  Download Printable Cards (PDF)
                </button>
              </div>
            </div>
          </div>

          {/* Visibility toggles */}
          <div className="paper-sheet p-5 mb-4">
            <p className="text-sm font-bold text-navy-muted mb-3">What appears on scan</p>
            <div className="space-y-2">
              {Object.keys(SECTION_LABELS).map(key => (
                <button
                  key={key}
                  onClick={() => toggleSection(key)}
                  className="w-full flex items-center justify-between p-3 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors"
                >
                  <span className="text-sm text-stone-700">{SECTION_LABELS[key]}</span>
                  {token.visible_sections[key] ? (
                    <Eye className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-stone-400" />
                  )}
                </button>
              ))}
            </div>
            {token.visible_sections.custom_field && (
              <div className="mt-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Custom note text</label>
                <textarea
                  value={token.custom_field_text || ''}
                  onChange={e => updateCustomText(e.target.value)}
                  onBlur={saveCustomText}
                  rows={2}
                  className="w-full mt-1 p-2 bg-white rounded-lg border border-stone-200 text-xs"
                  placeholder="Anything else first responders should see…"
                />
              </div>
            )}
          </div>

          {/* PIN management */}
          <div className="paper-sheet p-5 mb-4 space-y-3">
            <p className="text-sm font-bold text-navy-muted">Update PIN</p>
            <div className="grid grid-cols-2 gap-2">
              <input type="tel" inputMode="numeric" maxLength={6} value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="New PIN"
                className="p-3 bg-white rounded-xl border border-stone-200 text-sm tracking-widest" />
              <input type="tel" inputMode="numeric" maxLength={6} value={confirmPin}
                onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Confirm"
                className="p-3 bg-white rounded-xl border border-stone-200 text-sm tracking-widest" />
            </div>
            <input type="text" maxLength={60} value={hint}
              onChange={e => setHint(e.target.value)}
              placeholder="PIN hint (optional)"
              className="w-full p-3 bg-white rounded-xl border border-stone-200 text-sm" />
            <button
              onClick={savePin} disabled={saving || !pin}
              className="w-full py-2.5 border border-stone-200 rounded-lg text-xs font-bold text-stone-600 hover:bg-stone-50 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin inline" /> : 'Update PIN'}
            </button>
          </div>

          {/* Reset / Regenerate */}
          <div className="paper-sheet p-5 mb-4 space-y-3">
            <div className="flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-red-700 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-navy-muted">Compromised card?</p>
                <p className="text-[11px] text-stone-500 leading-relaxed mt-0.5">
                  If you've lost a card or suspect someone unauthorized has it, reset the QR code immediately.
                  All existing printed cards will stop working.
                </p>
              </div>
            </div>
            <button
              onClick={() => regenerate(true)}
              className="w-full py-2.5 bg-red-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-800"
            >
              <ShieldAlert className="w-3.5 h-3.5" /> Reset QR Code Now
            </button>
            <button
              onClick={() => regenerate(false)}
              className="w-full py-2.5 border border-stone-200 text-stone-600 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-stone-50"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Regenerate QR (routine refresh)
            </button>
          </div>

          {/* Access log */}
          <div className="paper-sheet p-5">
            <p className="text-sm font-bold text-navy-muted mb-3 flex items-center gap-2">
              <Clock size={14} /> Recent Access
            </p>
            {accessLog.length === 0 ? (
              <p className="text-xs text-stone-400 italic">No scans yet. Print and distribute your cards.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {accessLog.map(log => (
                  <div key={log.id} className="flex items-center justify-between text-xs p-2 bg-stone-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-stone-700">
                        {log.pin_correct ? '✅ Successful access' : '❌ Failed PIN'}
                      </p>
                      <p className="text-stone-500 flex items-center gap-1">
                        <MapPin size={10} />
                        {[log.city, log.region, log.country].filter(Boolean).join(', ') || 'Unknown location'}
                        {log.device_type && ` · ${log.device_type}`}
                      </p>
                    </div>
                    <span className="text-stone-400">{new Date(log.accessed_at).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
