import React, { useState } from 'react';
import {
  ChevronDown, ChevronUp, Edit2, Trash2, ShieldCheck, ExternalLink,
  Mail, Banknote, Users, Landmark, HeartPulse, ShoppingBag, Tv,
  Briefcase, TrendingUp, Bitcoin, Lightbulb, MoreHorizontal, AlertTriangle, Save, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { passwordService, PASSWORD_CATEGORIES, PasswordCategory } from '../../services/passwordService';

interface Props {
  packetId: string;
  record: any;
  onSaved: (record: any) => void;
  onDelete: () => void;
}

const CAT_ICON: Record<string, any> = {
  banking: Banknote, email: Mail, social: Users, government: Landmark,
  medical: HeartPulse, shopping: ShoppingBag, streaming: Tv, work: Briefcase,
  utilities: Lightbulb, investment: TrendingUp, crypto: Bitcoin, other: MoreHorizontal,
};

export const PasswordEntryCard: React.FC<Props> = ({ packetId, record, onSaved, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>(record);

  React.useEffect(() => { setForm(record); }, [record]);

  const Icon = CAT_ICON[record.category as string] || MoreHorizontal;
  const cat = (record.category || 'other') as PasswordCategory;

  // Detect legacy data (any non-empty values inside legacy_notes JSON)
  const hasLegacy = record.legacy_notes &&
    typeof record.legacy_notes === 'object' &&
    Object.values(record.legacy_notes).some((v) => v !== null && v !== '' && v !== undefined);

  const handleSave = async () => {
    if (saving) return;
    if (!form.service_name?.trim()) {
      toast.error('Account/site name is required.', { duration: 3000, position: 'bottom-center' });
      return;
    }
    setSaving(true);
    const { data, error } = await passwordService.save(packetId, form);
    setSaving(false);
    if (error) {
      toast.error(`Save failed: ${error.message}`, { duration: 4000, position: 'bottom-center' });
      return;
    }
    toast.success('Saved.', { duration: 2000, position: 'bottom-center' });
    setEditing(false);
    onSaved(data);
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
      {/* Card face */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-start gap-3 text-left hover:bg-stone-50/50 transition"
      >
        <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center shrink-0">
          <Icon size={18} className="text-navy-muted" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-navy-muted truncate">{record.service_name || 'Untitled'}</h3>
            {record.two_fa_enabled && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 flex items-center gap-0.5">
                <ShieldCheck size={10} /> 2FA
              </span>
            )}
          </div>
          <p className="text-[11px] text-stone-500 mt-0.5 capitalize">
            {PASSWORD_CATEGORIES.find((c) => c.value === cat)?.label || cat}
            {record.username && <> · {record.username}</>}
          </p>
          {record.website_url && (
            <p className="text-[11px] text-stone-400 truncate mt-0.5">{record.website_url}</p>
          )}
        </div>
        {expanded ? <ChevronUp size={18} className="text-stone-400 shrink-0" /> : <ChevronDown size={18} className="text-stone-400 shrink-0" />}
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-stone-100 p-4 space-y-4">
          {!editing ? (
            <>
              <ReadOnlyView record={record} cat={cat} hasLegacy={hasLegacy} />
              <div className="flex gap-2 pt-2 border-t border-stone-100">
                <button
                  onClick={() => setEditing(true)}
                  className="flex-1 py-2 rounded-lg bg-navy-muted text-white text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Edit2 size={13} /> Edit
                </button>
                <button
                  onClick={onDelete}
                  className="px-3 py-2 rounded-lg border border-rose-200 text-rose-600 text-xs font-bold flex items-center gap-1.5"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </>
          ) : (
            <>
              <EditForm form={form} setForm={setForm} cat={cat} />
              <div className="flex gap-2 pt-2 border-t border-stone-100">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2 rounded-lg bg-navy-muted text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Save size={13} /> {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={() => { setEditing(false); setForm(record); }}
                  className="px-3 py-2 rounded-lg border border-stone-200 text-stone-600 text-xs font-bold flex items-center gap-1.5"
                >
                  <X size={13} /> Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ============= READ-ONLY VIEW =============
const ReadOnlyView: React.FC<{ record: any; cat: PasswordCategory; hasLegacy: boolean }> = ({ record, cat, hasLegacy }) => (
  <div className="space-y-4 text-sm">
    <Section title="Access Details">
      <Row label="Username / email">{record.username || '—'}</Row>
      <Row label="Password hint">{record.password_masked || <span className="text-stone-400 italic">Stored in password manager</span>}</Row>
      <Row label="2FA">{record.two_fa_enabled ? `Yes${record.two_fa_method ? ` · ${record.two_fa_method}` : ''}` : 'No'}</Row>
      {record.authenticator_app && <Row label="Authenticator app">{record.authenticator_app}</Row>}
      {record.backup_codes_location && <Row label="Backup codes">{record.backup_codes_location}</Row>}
    </Section>

    <Section title="Account Details">
      {record.account_phone && <Row label="Phone on file">{record.account_phone}</Row>}
      {record.recovery_email && <Row label="Recovery email">{record.recovery_email}</Row>}
      {record.security_question_hint && <Row label="Security Q hint">{record.security_question_hint}</Row>}
      {record.subscription_cost > 0 && (
        <Row label="Subscription">${record.subscription_cost}/mo{record.renewal_date ? ` · renews ${record.renewal_date}` : ''}</Row>
      )}
    </Section>

    {(record.after_death_action || record.special_instructions) && (
      <Section title="Trusted Contact Instructions">
        {record.after_death_action && <Row label="After death">{record.after_death_action}</Row>}
        {record.special_instructions && <Row label="Instructions">{record.special_instructions}</Row>}
      </Section>
    )}

    {cat === 'crypto' && (
      <Section title="Crypto Details">
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-2 text-[11px] text-rose-800 flex gap-1.5 mb-2">
          <AlertTriangle size={12} className="shrink-0 mt-0.5" />
          <span>Never store the actual seed phrase in any digital system.</span>
        </div>
        {record.crypto_exchange && <Row label="Exchange">{record.crypto_exchange}</Row>}
        {record.wallet_type && <Row label="Wallet type">{record.wallet_type}</Row>}
        {record.hardware_wallet_location && <Row label="Hardware wallet">{record.hardware_wallet_location}</Row>}
        {record.seed_phrase_location && <Row label="Seed phrase location">{record.seed_phrase_location}</Row>}
      </Section>
    )}

    {cat === 'social' && (record.memorial_contact_name || record.download_archive_instructions) && (
      <Section title="Social Media Wishes">
        {record.memorial_contact_name && <Row label="Memorial contact">{record.memorial_contact_name}</Row>}
        {record.download_archive_instructions && <Row label="Download archive">{record.download_archive_instructions}</Row>}
      </Section>
    )}

    {cat === 'work' && (record.work_company_name || record.hr_contact_name) && (
      <Section title="Work Account">
        <p className="text-[11px] text-stone-500 italic mb-1">Work accounts are company-owned — contact HR.</p>
        {record.work_company_name && <Row label="Company">{record.work_company_name}</Row>}
        {record.hr_contact_name && <Row label="HR contact">{record.hr_contact_name}{record.hr_contact_phone ? ` · ${record.hr_contact_phone}` : ''}</Row>}
      </Section>
    )}

    {record.notes && (
      <Section title="Notes">
        <p className="text-stone-600 whitespace-pre-wrap text-[13px]">{record.notes}</p>
      </Section>
    )}

    {hasLegacy && (
      <details className="rounded-lg bg-stone-50 border border-stone-200 p-3">
        <summary className="text-[11px] font-bold uppercase tracking-wider text-stone-500 cursor-pointer">
          Legacy Notes
        </summary>
        <pre className="text-[11px] text-stone-600 mt-2 whitespace-pre-wrap break-all">
          {JSON.stringify(record.legacy_notes, null, 2)}
        </pre>
      </details>
    )}
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1.5">{title}</p>
    <div className="space-y-1">{children}</div>
  </div>
);

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex gap-3 text-[12px]">
    <span className="text-stone-500 w-32 shrink-0">{label}</span>
    <span className="text-stone-800 min-w-0 flex-1 break-words">{children}</span>
  </div>
);

// ============= EDIT FORM =============
const EditForm: React.FC<{ form: any; setForm: (f: any) => void; cat: PasswordCategory }> = ({ form, setForm, cat }) => {
  const upd = (k: string, v: any) => setForm({ ...form, [k]: v });

  return (
    <div className="space-y-4">
      <FormSection title="Account Info">
        <Field label="Account/site name *">
          <input value={form.service_name || ''} onChange={(e) => upd('service_name', e.target.value)} className="input" />
        </Field>
        <Field label="Category">
          <select value={form.category || cat} onChange={(e) => upd('category', e.target.value)} className="input">
            {PASSWORD_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </Field>
        <Field label="Website URL">
          <input value={form.website_url || ''} onChange={(e) => upd('website_url', e.target.value)} className="input" placeholder="https://…" />
        </Field>
      </FormSection>

      <FormSection title="Access Details">
        <p className="text-[10px] text-stone-500 italic">Store actual passwords in your password manager — reference them here.</p>
        <Field label="Username / email">
          <input value={form.username || ''} onChange={(e) => upd('username', e.target.value)} className="input" />
        </Field>
        <Field label="Password hint" hint="Not the actual password — e.g. 'usual + birthyear' or 'in 1Password'">
          <input value={form.password_masked || ''} onChange={(e) => upd('password_masked', e.target.value)} className="input" />
        </Field>
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={!!form.two_fa_enabled} onChange={(e) => upd('two_fa_enabled', e.target.checked)} />
          <span>2FA enabled</span>
        </label>
        {form.two_fa_enabled && (
          <>
            <Field label="2FA method">
              <select value={form.two_fa_method || ''} onChange={(e) => upd('two_fa_method', e.target.value)} className="input">
                <option value="">Select…</option>
                <option value="authenticator">Authenticator app</option>
                <option value="sms">SMS</option>
                <option value="email">Email</option>
                <option value="hardware">Hardware key</option>
              </select>
            </Field>
            {form.two_fa_method === 'authenticator' && (
              <Field label="Which app">
                <select value={form.authenticator_app || ''} onChange={(e) => upd('authenticator_app', e.target.value)} className="input">
                  <option value="">Select…</option>
                  <option>Google Authenticator</option>
                  <option>Authy</option>
                  <option>1Password</option>
                  <option>Microsoft Authenticator</option>
                  <option>Other</option>
                </select>
              </Field>
            )}
            <Field label="Backup codes location">
              <input value={form.backup_codes_location || ''} onChange={(e) => upd('backup_codes_location', e.target.value)} className="input" />
            </Field>
          </>
        )}
      </FormSection>

      <FormSection title="Account Details">
        <Field label="Account phone (recovery)">
          <input value={form.account_phone || ''} onChange={(e) => upd('account_phone', e.target.value)} className="input" />
        </Field>
        <Field label="Recovery email">
          <input value={form.recovery_email || ''} onChange={(e) => upd('recovery_email', e.target.value)} className="input" />
        </Field>
        <Field label="Security question hint" hint="Hint only — never the actual answer">
          <input value={form.security_question_hint || ''} onChange={(e) => upd('security_question_hint', e.target.value)} className="input" />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Subscription cost ($/mo)">
            <input type="number" step="0.01" value={form.subscription_cost ?? ''} onChange={(e) => upd('subscription_cost', e.target.value === '' ? null : parseFloat(e.target.value))} className="input" />
          </Field>
          <Field label="Renewal date">
            <input type="date" value={form.renewal_date || ''} onChange={(e) => upd('renewal_date', e.target.value || null)} className="input" />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Trusted Contact Instructions">
        <Field label="What to do with this account">
          <select value={form.after_death_action || ''} onChange={(e) => upd('after_death_action', e.target.value)} className="input">
            <option value="">Select…</option>
            <option>Keep active</option>
            <option>Cancel</option>
            <option>Memorialize</option>
            <option>Transfer</option>
            <option>Delete</option>
          </select>
        </Field>
        <Field label="Special instructions">
          <textarea value={form.special_instructions || ''} onChange={(e) => upd('special_instructions', e.target.value)} rows={2} className="input" />
        </Field>
      </FormSection>

      {cat === 'crypto' && (
        <FormSection title="Crypto Details">
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-2 text-[11px] text-rose-800 flex gap-1.5">
            <AlertTriangle size={12} className="shrink-0 mt-0.5" />
            <span><strong>Never</strong> store the actual seed phrase digitally — only its physical location.</span>
          </div>
          <Field label="Exchange name"><input value={form.crypto_exchange || ''} onChange={(e) => upd('crypto_exchange', e.target.value)} className="input" /></Field>
          <Field label="Wallet type">
            <select value={form.wallet_type || ''} onChange={(e) => upd('wallet_type', e.target.value)} className="input">
              <option value="">Select…</option>
              <option>Exchange</option>
              <option>Hardware wallet</option>
              <option>Software wallet</option>
              <option>Paper wallet</option>
            </select>
          </Field>
          <Field label="Hardware wallet location"><input value={form.hardware_wallet_location || ''} onChange={(e) => upd('hardware_wallet_location', e.target.value)} className="input" /></Field>
          <Field label="Seed phrase location (physical only)"><input value={form.seed_phrase_location || ''} onChange={(e) => upd('seed_phrase_location', e.target.value)} className="input" /></Field>
        </FormSection>
      )}

      {cat === 'social' && (
        <FormSection title="Social Media Wishes">
          <Field label="Memorial contact name (Facebook legacy contact)"><input value={form.memorial_contact_name || ''} onChange={(e) => upd('memorial_contact_name', e.target.value)} className="input" /></Field>
          <Field label="Download archive instructions"><textarea value={form.download_archive_instructions || ''} onChange={(e) => upd('download_archive_instructions', e.target.value)} rows={2} className="input" /></Field>
        </FormSection>
      )}

      {cat === 'work' && (
        <FormSection title="Work Account">
          <p className="text-[11px] text-stone-500 italic">Contact HR for work account access — these are company-owned.</p>
          <Field label="Company name"><input value={form.work_company_name || ''} onChange={(e) => upd('work_company_name', e.target.value)} className="input" /></Field>
          <Field label="HR contact name"><input value={form.hr_contact_name || ''} onChange={(e) => upd('hr_contact_name', e.target.value)} className="input" /></Field>
          <Field label="HR contact phone"><input value={form.hr_contact_phone || ''} onChange={(e) => upd('hr_contact_phone', e.target.value)} className="input" /></Field>
        </FormSection>
      )}

      <FormSection title="Notes">
        <textarea value={form.notes || ''} onChange={(e) => upd('notes', e.target.value)} rows={3} className="input" />
      </FormSection>

      <style>{`.input { width: 100%; padding: 0.5rem 0.75rem; border-radius: 0.5rem; border: 1px solid hsl(var(--border)); font-size: 0.8125rem; background: white; }`}</style>
    </div>
  );
};

const FormSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="space-y-2">
    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{title}</p>
    {children}
  </div>
);

const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <div>
    <label className="block text-[11px] font-semibold text-stone-600 mb-1">{label}</label>
    {hint && <p className="text-[10px] text-stone-400 mb-1">{hint}</p>}
    {children}
  </div>
);
