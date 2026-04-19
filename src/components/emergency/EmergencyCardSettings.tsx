import React, { useEffect, useState } from 'react';
import { Loader2, QrCode, Download, RefreshCw, Eye, EyeOff, Phone, AlertTriangle, MapPin, Clock, ShieldAlert, ChevronDown, Siren, Check, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { emergencyService, EmergencyToken, EmergencyAccessLogEntry } from '../../services/emergencyService';
import { generateEmergencyCardsPdf, generateQrPng } from '../../services/emergencyCardPdf';
import { useAppContext } from '../../context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { SendQrCardModal } from './SendQrCardModal';
import { QrShopSheet } from './qrShop/QrShopSheet';
import { ShoppingBag } from 'lucide-react';

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

// Default fields suggested for provider bypass — the truly time-critical ones
const DEFAULT_BYPASS_FIELDS = ['blood_type', 'allergies', 'medications', 'dnr_status', 'organ_donor'];
const BYPASS_CONSENT_VERSION = '1.0';

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
  const [visibilityOpen, setVisibilityOpen] = useState(false);
  const [bypassOpen, setBypassOpen] = useState(false);
  const [bypassSaving, setBypassSaving] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [emergencyUrl, setEmergencyUrl] = useState<string>('');
  const [shopOpen, setShopOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const t = await emergencyService.getMyToken();
      setToken(t);
      if (t) {
        setHint(t.pin_hint || '');
        const url = await emergencyService.getEmergencyUrl(t.token);
        setEmergencyUrl(url);
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

  const setBypassEnabled = async (enabled: boolean) => {
    if (!token) return;
    if (enabled && (!token.bypass_fields || token.bypass_fields.length === 0)) {
      // Seed with sensible defaults on first enable
      const seed = DEFAULT_BYPASS_FIELDS.filter((f) => SECTION_LABELS[f]);
      setBypassSaving(true);
      try {
        await emergencyService.updateBypass({ enabled: true, fields: seed, consentVersion: BYPASS_CONSENT_VERSION });
        setToken({ ...token, bypass_enabled: true, bypass_fields: seed, bypass_consent_agreed_at: new Date().toISOString(), bypass_consent_version: BYPASS_CONSENT_VERSION });
        toast.success('Provider bypass enabled', { duration: 3000, position: 'bottom-center' });
      } catch (e: any) {
        toast.error(e.message || 'Failed to enable bypass', { duration: 5000, position: 'bottom-center' });
      } finally {
        setBypassSaving(false);
      }
      return;
    }
    setBypassSaving(true);
    try {
      await emergencyService.updateBypass({ enabled, fields: token.bypass_fields || [], consentVersion: BYPASS_CONSENT_VERSION });
      setToken({
        ...token,
        bypass_enabled: enabled,
        bypass_consent_agreed_at: enabled ? new Date().toISOString() : token.bypass_consent_agreed_at,
      });
      toast.success(enabled ? 'Provider bypass enabled' : 'Provider bypass disabled', { duration: 3000, position: 'bottom-center' });
    } catch (e: any) {
      toast.error(e.message || 'Failed to update', { duration: 5000, position: 'bottom-center' });
    } finally {
      setBypassSaving(false);
    }
  };

  const toggleBypassField = async (field: string) => {
    if (!token) return;
    const current = new Set(token.bypass_fields || []);
    if (current.has(field)) current.delete(field);
    else current.add(field);
    const next = Array.from(current);
    const prev = token.bypass_fields;
    setToken({ ...token, bypass_fields: next });
    try {
      await emergencyService.updateBypass({ enabled: token.bypass_enabled, fields: next, consentVersion: BYPASS_CONSENT_VERSION });
    } catch (e: any) {
      setToken({ ...token, bypass_fields: prev });
      toast.error('Failed to save', { duration: 5000, position: 'bottom-center' });
    }
  };

  const regenerate = async (compromised: boolean) => {
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
          {/* QR Preview & Download + collapsible visibility toggles */}
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
                <button
                  onClick={() => setSendOpen(true)}
                  disabled={!qrPreview || !emergencyUrl}
                  className="mt-2 w-full py-2.5 bg-white border border-stone-300 text-navy-muted rounded-lg text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-stone-50"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Send to a Contact
                </button>
              </div>
            </div>

            {/* Get It on a Product CTA */}
            <button
              onClick={() => setShopOpen(true)}
              disabled={!emergencyUrl}
              className="mt-4 w-full text-left p-4 rounded-xl border border-stone-200 bg-gradient-to-br from-amber-50 to-white hover:border-amber-300 transition-colors disabled:opacity-50 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-5 h-5 text-amber-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-navy-muted">🛍️ Get It on a Product</p>
                <p className="text-[11px] text-stone-500 leading-snug">Put your emergency card on something people will actually keep.</p>
              </div>
              <span className="text-xs font-bold text-amber-700 shrink-0">Browse Designs →</span>
            </button>

            {/* Collapsible: What appears on scan */}
            <div className="mt-4 pt-4 border-t border-stone-200">
              <button
                onClick={() => setVisibilityOpen(o => !o)}
                className="w-full flex items-center justify-between"
              >
                <span className="text-sm font-bold text-navy-muted">What appears on scan</span>
                <ChevronDown size={16} className={`text-stone-500 transition-transform ${visibilityOpen ? 'rotate-180' : ''}`} />
              </button>
              {visibilityOpen && (
                <div className="mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
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
              )}
            </div>
          </div>

          {/* 🚑 Emergency Provider Bypass */}
          <div className="paper-sheet p-5 mb-4">
            <button
              onClick={() => setBypassOpen(o => !o)}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Siren className={`w-4 h-4 shrink-0 ${token.bypass_enabled ? 'text-red-700' : 'text-stone-400'}`} />
                <span className="text-sm font-bold text-navy-muted truncate">Emergency Provider Bypass</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {token.bypass_enabled ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
                    On · {(token.bypass_fields || []).length} {(token.bypass_fields || []).length === 1 ? 'field' : 'fields'}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-500 border border-stone-200">
                    Off · PIN required
                  </span>
                )}
                <ChevronDown size={16} className={`text-stone-500 transition-transform ${bypassOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {bypassOpen && (
              <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                {/* Always-visible explanation banner */}
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 leading-relaxed">
                  <p className="font-bold mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    What is provider bypass?
                  </p>
                  <p>
                    When enabled, anyone who scans your QR code can immediately see the fields you select below — without entering your PIN.
                    This is intended for first responders (EMTs, ER staff) who need critical info in seconds.
                  </p>
                  <p className="mt-2">
                    Anything <span className="font-semibold">not</span> selected stays locked behind your PIN. Choose only what you're comfortable exposing publicly.
                  </p>
                </div>

                {/* Master toggle */}
                <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-navy-muted">Allow provider bypass</p>
                    <p className="text-[11px] text-stone-500">Selected fields visible without PIN.</p>
                  </div>
                  <button
                    onClick={() => setBypassEnabled(!token.bypass_enabled)}
                    disabled={bypassSaving}
                    role="switch"
                    aria-checked={token.bypass_enabled}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
                      token.bypass_enabled ? 'bg-red-700' : 'bg-stone-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${
                        token.bypass_enabled ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* Field selector — only when enabled */}
                {token.bypass_enabled && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                      Visible without PIN
                    </p>
                    <div className="space-y-1.5">
                      {Object.keys(SECTION_LABELS).map(key => {
                        const checked = (token.bypass_fields || []).includes(key);
                        return (
                          <button
                            key={key}
                            onClick={() => toggleBypassField(key)}
                            disabled={bypassSaving}
                            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors text-left ${
                              checked
                                ? 'bg-red-50 border-red-200 hover:bg-red-100'
                                : 'bg-white border-stone-200 hover:bg-stone-50'
                            } disabled:opacity-50`}
                          >
                            <span className={`text-sm ${checked ? 'font-semibold text-red-900' : 'text-stone-700'}`}>
                              {SECTION_LABELS[key]}
                            </span>
                            <span
                              className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                                checked ? 'bg-red-700 border-red-700 text-white' : 'bg-white border-stone-300'
                              }`}
                              aria-hidden
                            >
                              {checked && <Check className="w-3.5 h-3.5" />}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {(token.bypass_fields || []).length === 0 && (
                      <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                        No fields selected — scans will see an empty bypass page. Pick at least one field, or turn bypass off.
                      </p>
                    )}
                    {token.bypass_consent_agreed_at && (
                      <p className="text-[10px] text-stone-400 italic">
                        Consent agreed {new Date(token.bypass_consent_agreed_at).toLocaleDateString()} (v{token.bypass_consent_version || '1.0'})
                      </p>
                    )}
                  </div>
                )}
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

      <SendQrCardModal
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        qrPngDataUrl={qrPreview}
        emergencyUrl={emergencyUrl}
      />
    </div>
  );
};
