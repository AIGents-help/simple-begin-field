import React, { useEffect, useMemo, useState } from 'react';
import {
  Save, CheckCircle2, AlertCircle, Loader2, Shield, ShieldAlert, Trash2,
  ExternalLink, Mail, CreditCard, Users, Database, Lock, Settings as SettingsIcon,
  UserPlus, Activity,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { appSettingsService, type SettingsKey } from '@/services/appSettingsService';
import { useAppContext } from '@/context/AppContext';

// ---------- helpers ----------
const fmtBytes = (b: number) => {
  if (!b) return '0 B';
  const u = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(b) / Math.log(1024));
  return `${(b / Math.pow(1024, i)).toFixed(2)} ${u[i]}`;
};

const fmtTs = (s?: string) => {
  if (!s) return '';
  try { return new Date(s).toLocaleString(); } catch { return s; }
};

// ---------- generic UI primitives ----------
const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-medium text-stone-700">{label}</label>
    {children}
    {hint && <p className="text-xs text-stone-400">{hint}</p>}
  </div>
);

const TextInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (p) => (
  <input
    {...p}
    className={`w-full min-h-[40px] px-3 py-2 text-sm rounded-md border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 disabled:bg-stone-50 disabled:text-stone-400 ${p.className || ''}`}
  />
);

const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (p) => (
  <textarea
    {...p}
    className={`w-full px-3 py-2 text-sm rounded-md border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 ${p.className || ''}`}
  />
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (p) => (
  <select
    {...p}
    className={`w-full min-h-[40px] px-3 py-2 text-sm rounded-md border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 ${p.className || ''}`}
  />
);

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; }> = ({ checked, onChange, label, description }) => (
  <label className="flex items-start justify-between gap-3 py-2 cursor-pointer">
    <div className="min-w-0">
      <div className="text-sm font-medium text-stone-900">{label}</div>
      {description && <div className="text-xs text-stone-500 mt-0.5">{description}</div>}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${checked ? 'bg-stone-900' : 'bg-stone-300'}`}
    >
      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  </label>
);

const ReadOnlyPill: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-stone-100 text-stone-600 border border-stone-200">
    <Lock size={10} />{children}
  </span>
);

// ---------- Section wrapper ----------
type SectionProps = {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  dirty: boolean;
  saving: boolean;
  lastSaved?: string;
  onSave: () => void;
  saveDisabled?: boolean;
  saveConfirm?: string; // if set, requires window.confirm
};

const Section: React.FC<SectionProps> = ({ title, icon, children, dirty, saving, lastSaved, onSave, saveDisabled, saveConfirm }) => {
  const handleSave = () => {
    if (saveConfirm && !window.confirm(saveConfirm)) return;
    onSave();
  };

  return (
    <section className="bg-white border border-stone-200 rounded-lg overflow-hidden">
      <header className="px-4 sm:px-6 py-4 border-b border-stone-200 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-md bg-stone-100 flex items-center justify-center text-stone-700 flex-shrink-0">{icon}</div>
          <h2 className="text-base font-semibold text-stone-900 truncate">{title}</h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {dirty && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-amber-50 text-amber-700 border border-amber-200">
              <AlertCircle size={12} />Unsaved changes
            </span>
          )}
          {!dirty && lastSaved && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 size={12} />Saved {fmtTs(lastSaved)}
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || saving || saveDisabled}
            className="inline-flex items-center gap-2 min-h-[40px] px-4 text-sm font-medium rounded-md bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save
          </button>
        </div>
      </header>
      <div className="p-4 sm:p-6 space-y-4">{children}</div>
    </section>
  );
};

// ---------- Hook for section state ----------
function useSection<T extends Record<string, any>>(initial: T | undefined) {
  const [original, setOriginal] = useState<T | undefined>(initial);
  const [draft, setDraft] = useState<T | undefined>(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setOriginal(initial);
    setDraft(initial);
  }, [JSON.stringify(initial)]);

  const dirty = useMemo(() => {
    if (!original || !draft) return false;
    const a = { ...original }; delete (a as any)._updated_at;
    const b = { ...draft }; delete (b as any)._updated_at;
    return JSON.stringify(a) !== JSON.stringify(b);
  }, [original, draft]);

  const update = (patch: Partial<T>) => setDraft((d) => ({ ...(d || ({} as T)), ...patch } as T));
  const reset = (next: T) => { setOriginal(next); setDraft(next); };

  return { original, draft, setDraft, update, dirty, saving, setSaving, reset };
}

// ---------- Main component ----------
export const AdminSettings: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAppContext();
  const adminEmail = profile?.email || null;

  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState<any[]>([]);
  const [storageStats, setStorageStats] = useState<{ total_bytes: number; count: number }>({ total_bytes: 0, count: 0 });
  const [plans, setPlans] = useState<any[]>([]);

  const general = useSection<any>(undefined);
  const userDefaults = useSection<any>(undefined);
  const billing = useSection<any>(undefined);
  const email = useSection<any>(undefined);
  const affiliate = useSection<any>(undefined);
  const security = useSection<any>(undefined);
  const storage = useSection<any>(undefined);

  const stripeMode = useMemo(() => {
    // Heuristic — env not exposed to client. Show "Managed in backend"
    return 'Managed via backend secret';
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [settingsMap, adminList, stats, planList] = await Promise.all([
        appSettingsService.getAll(),
        appSettingsService.listAdmins(),
        appSettingsService.getStorageStats(),
        appSettingsService.getActivePlans(),
      ]);
      general.reset(settingsMap.general || {});
      userDefaults.reset(settingsMap.user_defaults || {});
      billing.reset(settingsMap.billing || {});
      email.reset(settingsMap.email || {});
      affiliate.reset(settingsMap.affiliate || {});
      security.reset(settingsMap.security || {});
      storage.reset(settingsMap.storage || {});
      setAdmins(adminList);
      setStorageStats(stats);
      setPlans(planList);
    } catch (err: any) {
      console.error('[AdminSettings] load error', err);
      toast.error(err?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, []);

  const saveSection = async (
    key: SettingsKey,
    section: ReturnType<typeof useSection<any>>,
  ) => {
    if (!section.draft) return;
    section.setSaving(true);
    try {
      const old = section.original;
      const next = await appSettingsService.save(key, section.draft);
      section.reset({ ...section.draft, _updated_at: next.updated_at });
      await appSettingsService.logSettingChange(key, old, section.draft, adminEmail);
      toast.success(`${key.replace('_', ' ')} settings saved`);
    } catch (err: any) {
      console.error(`[AdminSettings] save ${key} error`, err);
      toast.error(err?.message || `Failed to save ${key} settings`);
    } finally {
      section.setSaving(false);
    }
  };

  // ----- Admin grant/revoke -----
  const [grantEmail, setGrantEmail] = useState('');
  const [grantBusy, setGrantBusy] = useState(false);

  const handleGrant = async () => {
    if (!grantEmail.trim()) {
      toast.error('Enter an email address');
      return;
    }
    if (!window.confirm(`Grant FULL ADMIN access to ${grantEmail.trim()}? This gives complete control over the system.`)) return;
    setGrantBusy(true);
    try {
      await appSettingsService.grantAdmin(grantEmail.trim(), adminEmail);
      toast.success(`Granted admin to ${grantEmail.trim()}`);
      setGrantEmail('');
      const next = await appSettingsService.listAdmins();
      setAdmins(next);
    } catch (err: any) {
      console.error('[AdminSettings] grant error', err);
      toast.error(err?.message || 'Failed to grant admin access');
    } finally {
      setGrantBusy(false);
    }
  };

  const handleRevoke = async (a: any) => {
    if (!window.confirm(`Revoke admin access from ${a.email}? They will become a regular customer.`)) return;
    try {
      await appSettingsService.revokeAdmin(a.id, a.email, adminEmail);
      toast.success(`Revoked admin from ${a.email}`);
      const next = await appSettingsService.listAdmins();
      setAdmins(next);
    } catch (err: any) {
      console.error('[AdminSettings] revoke error', err);
      toast.error(err?.message || 'Failed to revoke admin');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-3 text-stone-500">
        <Loader2 size={16} className="animate-spin" /> Loading settings…
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Admin Settings</h1>
        <p className="text-sm text-stone-500 mt-1">Configure system-wide behavior. Changes only take effect after saving.</p>
      </div>

      {/* SECTION 1 — GENERAL */}
      <Section
        title="General"
        icon={<SettingsIcon size={16} />}
        dirty={general.dirty}
        saving={general.saving}
        lastSaved={general.original?._updated_at}
        onSave={() => saveSection('general', general)}
        saveConfirm={general.draft?.maintenance_mode !== general.original?.maintenance_mode
          ? `You are about to ${general.draft?.maintenance_mode ? 'ENABLE' : 'disable'} maintenance mode. ${general.draft?.maintenance_mode ? 'Non-admin users will be locked out.' : ''} Continue?`
          : undefined}
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="App name">
            <TextInput value={general.draft?.app_name || ''} onChange={(e) => general.update({ app_name: e.target.value })} maxLength={80} />
          </Field>
          <Field label="Support email">
            <TextInput type="email" value={general.draft?.support_email || ''} onChange={(e) => general.update({ support_email: e.target.value })} maxLength={120} />
          </Field>
          <Field label="Default timezone">
            <Select value={general.draft?.default_timezone || 'America/Los_Angeles'} onChange={(e) => general.update({ default_timezone: e.target.value })}>
              {['America/Los_Angeles','America/Denver','America/Chicago','America/New_York','UTC','Europe/London','Europe/Paris','Asia/Tokyo','Australia/Sydney'].map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="border-t border-stone-100 pt-3">
          <Toggle
            checked={!!general.draft?.maintenance_mode}
            onChange={(v) => general.update({ maintenance_mode: v })}
            label="Maintenance mode"
            description="When on, non-admin users see the maintenance message instead of the app. Admins retain access."
          />
          <Field label="Maintenance message">
            <TextArea rows={3} maxLength={500} value={general.draft?.maintenance_message || ''} onChange={(e) => general.update({ maintenance_message: e.target.value })} />
          </Field>
        </div>
      </Section>

      {/* SECTION 2 — USER DEFAULTS */}
      <Section
        title="User Defaults"
        icon={<Users size={16} />}
        dirty={userDefaults.dirty}
        saving={userDefaults.saving}
        lastSaved={userDefaults.original?._updated_at}
        onSave={() => saveSection('user_defaults', userDefaults)}
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Default plan for new signups">
            <Select value={userDefaults.draft?.default_plan || 'free'} onChange={(e) => userDefaults.update({ default_plan: e.target.value })}>
              <option value="free">Free</option>
              <option value="individual">Individual</option>
              <option value="couple">Couple</option>
            </Select>
          </Field>
          <Field label="Trial period (days)" hint="0 = no trial">
            <TextInput type="number" min={0} max={90} value={userDefaults.draft?.trial_days ?? 0} onChange={(e) => userDefaults.update({ trial_days: Number(e.target.value) })} />
          </Field>
          <Field label="Max upload size (MB)">
            <TextInput type="number" min={1} max={1024} value={userDefaults.draft?.max_upload_mb ?? 50} onChange={(e) => userDefaults.update({ max_upload_mb: Number(e.target.value) })} />
          </Field>
          <Field label="Max storage per user (GB)">
            <TextInput type="number" min={1} max={500} value={userDefaults.draft?.max_storage_gb ?? 5} onChange={(e) => userDefaults.update({ max_storage_gb: Number(e.target.value) })} />
          </Field>
        </div>
        <div className="border-t border-stone-100 pt-3 divide-y divide-stone-100">
          <Toggle checked={!!userDefaults.draft?.auto_send_welcome} onChange={(v) => userDefaults.update({ auto_send_welcome: v })} label="Auto-send welcome email" description="Email new users immediately after signup." />
          <Toggle checked={!!userDefaults.draft?.require_email_verification} onChange={(v) => userDefaults.update({ require_email_verification: v })} label="Require email verification before access" />
          <Toggle checked={!!userDefaults.draft?.allow_self_delete} onChange={(v) => userDefaults.update({ allow_self_delete: v })} label="Allow users to delete their own account" />
        </div>
      </Section>

      {/* SECTION 3 — BILLING & STRIPE */}
      <Section
        title="Billing & Stripe"
        icon={<CreditCard size={16} />}
        dirty={billing.dirty}
        saving={billing.saving}
        lastSaved={billing.original?._updated_at}
        onSave={() => saveSection('billing', billing)}
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Stripe mode">
            <div className="flex items-center gap-2">
              <ReadOnlyPill>Read only</ReadOnlyPill>
              <span className="text-sm text-stone-700">{stripeMode}</span>
            </div>
          </Field>
          <Field label="Stripe dashboard">
            <a
              href={billing.draft?.stripe_dashboard_url || 'https://dashboard.stripe.com'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-stone-900 underline underline-offset-2 hover:text-stone-700"
            >
              Open Stripe dashboard <ExternalLink size={12} />
            </a>
          </Field>
        </div>

        <div className="border border-stone-200 rounded-md overflow-hidden">
          <div className="px-3 py-2 bg-stone-50 text-xs font-medium text-stone-600 uppercase tracking-wide">Current pricing</div>
          <div className="divide-y divide-stone-100">
            {plans.map((p) => (
              <div key={p.plan_key} className="flex items-center justify-between px-3 py-2 text-sm">
                <div className="min-w-0">
                  <div className="font-medium text-stone-900 truncate">{p.name}</div>
                  <div className="text-xs text-stone-400">{p.plan_key} · {p.billing_type}</div>
                </div>
                <div className="font-mono text-stone-900">${(p.price_cents / 100).toFixed(2)}</div>
              </div>
            ))}
            {plans.length === 0 && <div className="px-3 py-3 text-sm text-stone-400">No plans configured</div>}
          </div>
        </div>

        <div className="border-t border-stone-100 pt-3 divide-y divide-stone-100">
          <Toggle checked={!!billing.draft?.allow_lifetime} onChange={(v) => billing.update({ allow_lifetime: v })} label="Allow lifetime purchases" />
          <Toggle checked={!!billing.draft?.allow_manual_assignment} onChange={(v) => billing.update({ allow_manual_assignment: v })} label="Allow manual plan assignment by admin" description="Admins can override plan from the customer detail page." />
        </div>
        <Field label="Pause billing — max duration">
          <Select value={billing.draft?.pause_max_months || '3'} onChange={(e) => billing.update({ pause_max_months: e.target.value })}>
            <option value="1">1 month</option>
            <option value="2">2 months</option>
            <option value="3">3 months</option>
            <option value="6">6 months</option>
            <option value="unlimited">Unlimited</option>
          </Select>
        </Field>
      </Section>

      {/* SECTION 4 — EMAIL */}
      <Section
        title="Email"
        icon={<Mail size={16} />}
        dirty={email.dirty}
        saving={email.saving}
        lastSaved={email.original?._updated_at}
        onSave={() => saveSection('email', email)}
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Transactional provider">
            <div className="flex items-center gap-2"><ReadOnlyPill>Read only</ReadOnlyPill><span className="text-sm text-stone-700">Resend</span></div>
          </Field>
          <Field label="Marketing provider">
            <div className="flex items-center gap-2"><ReadOnlyPill>Read only</ReadOnlyPill><span className="text-sm text-stone-700">Loops</span></div>
          </Field>
          <Field label="From name">
            <TextInput value={email.draft?.from_name || ''} onChange={(e) => email.update({ from_name: e.target.value })} maxLength={80} />
          </Field>
          <Field label="From email">
            <TextInput type="email" value={email.draft?.from_email || ''} onChange={(e) => email.update({ from_email: e.target.value })} maxLength={120} />
          </Field>
          <Field label="Reply-to email">
            <TextInput type="email" value={email.draft?.reply_to || ''} onChange={(e) => email.update({ reply_to: e.target.value })} maxLength={120} />
          </Field>
        </div>
        <div className="border-t border-stone-100 pt-3">
          <div className="text-xs font-medium text-stone-600 uppercase tracking-wide mb-1">Email types</div>
          <div className="divide-y divide-stone-100">
            <Toggle checked={!!email.draft?.welcome_enabled} onChange={(v) => email.update({ welcome_enabled: v })} label="Welcome email" />
            <Toggle checked={!!email.draft?.payment_failed_enabled} onChange={(v) => email.update({ payment_failed_enabled: v })} label="Payment failed email" />
            <Toggle checked={!!email.draft?.subscription_canceled_enabled} onChange={(v) => email.update({ subscription_canceled_enabled: v })} label="Subscription canceled email" />
            <Toggle checked={!!email.draft?.password_reset_enabled} onChange={(v) => email.update({ password_reset_enabled: v })} label="Password reset email" />
            <Toggle checked={!!email.draft?.trusted_contact_enabled} onChange={(v) => email.update({ trusted_contact_enabled: v })} label="Trusted contact notification email" />
            <Toggle checked={!!email.draft?.affiliate_approved_enabled} onChange={(v) => email.update({ affiliate_approved_enabled: v })} label="Affiliate approved email" />
          </div>
        </div>
      </Section>

      {/* SECTION 5 — AFFILIATE */}
      <Section
        title="Affiliate"
        icon={<Users size={16} />}
        dirty={affiliate.dirty}
        saving={affiliate.saving}
        lastSaved={affiliate.original?._updated_at}
        onSave={() => saveSection('affiliate', affiliate)}
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Default commission rate (%)">
            <TextInput type="number" min={0} max={100} value={affiliate.draft?.commission_rate ?? 20} onChange={(e) => affiliate.update({ commission_rate: Number(e.target.value) })} />
          </Field>
          <Field label="Default discount code value (%)">
            <TextInput type="number" min={0} max={100} value={affiliate.draft?.discount_rate ?? 10} onChange={(e) => affiliate.update({ discount_rate: Number(e.target.value) })} />
          </Field>
          <Field label="Approval mode">
            <Select value={affiliate.draft?.approval_mode || 'manual'} onChange={(e) => affiliate.update({ approval_mode: e.target.value })}>
              <option value="auto">Auto-approve</option>
              <option value="manual">Manual review</option>
            </Select>
          </Field>
          <Field label="Minimum payout threshold ($)">
            <TextInput type="number" min={0} value={affiliate.draft?.min_payout ?? 50} onChange={(e) => affiliate.update({ min_payout: Number(e.target.value) })} />
          </Field>
          <Field label="Payout schedule">
            <Select value={affiliate.draft?.payout_schedule || 'monthly'} onChange={(e) => affiliate.update({ payout_schedule: e.target.value })}>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="manual">Manual</option>
            </Select>
          </Field>
        </div>
      </Section>

      {/* SECTION 6 — SECURITY */}
      <Section
        title="Security"
        icon={<Lock size={16} />}
        dirty={security.dirty}
        saving={security.saving}
        lastSaved={security.original?._updated_at}
        onSave={() => saveSection('security', security)}
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Session timeout (minutes)">
            <TextInput type="number" min={5} max={1440} value={security.draft?.session_timeout_minutes ?? 120} onChange={(e) => security.update({ session_timeout_minutes: Number(e.target.value) })} />
          </Field>
          <Field label="Failed login limit before lockout">
            <TextInput type="number" min={1} max={20} value={security.draft?.failed_login_limit ?? 5} onChange={(e) => security.update({ failed_login_limit: Number(e.target.value) })} />
          </Field>
          <Field label="Lockout duration (minutes)">
            <TextInput type="number" min={1} max={1440} value={security.draft?.lockout_minutes ?? 15} onChange={(e) => security.update({ lockout_minutes: Number(e.target.value) })} />
          </Field>
        </div>
        <Toggle checked={!!security.draft?.require_2fa_admin} onChange={(v) => security.update({ require_2fa_admin: v })} label="Require 2FA for admin accounts" />
        <Field label="IP allowlist for admin panel" hint="One IP per line. Leave blank for no restriction.">
          <TextArea rows={4} placeholder="203.0.113.42&#10;198.51.100.10" value={security.draft?.ip_allowlist || ''} onChange={(e) => security.update({ ip_allowlist: e.target.value })} />
        </Field>
      </Section>

      {/* SECTION 7 — DATA & STORAGE */}
      <Section
        title="Data & Storage"
        icon={<Database size={16} />}
        dirty={storage.dirty}
        saving={storage.saving}
        lastSaved={storage.original?._updated_at}
        onSave={() => saveSection('storage', storage)}
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Storage provider">
            <div className="flex items-center gap-2"><ReadOnlyPill>Read only</ReadOnlyPill><span className="text-sm text-stone-700">Lovable Cloud</span></div>
          </Field>
          <Field label="Total storage used">
            <div className="flex items-center gap-2"><ReadOnlyPill>Read only</ReadOnlyPill><span className="text-sm text-stone-700">{fmtBytes(storageStats.total_bytes)} ({storageStats.count} files)</span></div>
          </Field>
          <Field label="Storage bucket">
            <div className="flex items-center gap-2"><ReadOnlyPill>Read only</ReadOnlyPill><code className="text-xs text-stone-700 bg-stone-50 px-2 py-1 rounded">packet-documents</code></div>
          </Field>
          <Field label="Max video file size (MB)">
            <TextInput type="number" min={1} max={5000} value={storage.draft?.max_video_mb ?? 200} onChange={(e) => storage.update({ max_video_mb: Number(e.target.value) })} />
          </Field>
        </div>
        <Toggle checked={!!storage.draft?.allow_video_uploads} onChange={(v) => storage.update({ allow_video_uploads: v })} label="Allow video uploads" />
        <Field label="Allowed file types" hint="Comma-separated extensions, no dots.">
          <TextInput value={storage.draft?.allowed_file_types || ''} onChange={(e) => storage.update({ allowed_file_types: e.target.value })} />
        </Field>
      </Section>

      {/* SECTION 8 — ADMIN ACCOUNTS */}
      <section className="bg-white border border-stone-200 rounded-lg overflow-hidden">
        <header className="px-4 sm:px-6 py-4 border-b border-stone-200 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-stone-100 flex items-center justify-center text-stone-700"><Shield size={16} /></div>
            <h2 className="text-base font-semibold text-stone-900">Admin Accounts</h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard/activity')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-700 hover:text-stone-900 underline underline-offset-2"
          >
            <Activity size={12} /> View admin activity log
          </button>
        </header>
        <div className="p-4 sm:p-6 space-y-4">
          <div className="rounded-md border border-stone-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-xs text-stone-600 uppercase tracking-wide">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Name</th>
                  <th className="text-left px-3 py-2 font-medium">Email</th>
                  <th className="text-left px-3 py-2 font-medium hidden sm:table-cell">Granted</th>
                  <th className="text-right px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {admins.map((a) => (
                  <tr key={a.id}>
                    <td className="px-3 py-2 text-stone-900">{a.full_name || '—'}</td>
                    <td className="px-3 py-2 text-stone-700 break-all">{a.email}</td>
                    <td className="px-3 py-2 text-stone-500 hidden sm:table-cell">{fmtTs(a.created_at)}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleRevoke(a)}
                        disabled={a.id === profile?.id}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed"
                        title={a.id === profile?.id ? 'You cannot revoke your own access' : 'Revoke admin access'}
                      >
                        <Trash2 size={12} /> Revoke
                      </button>
                    </td>
                  </tr>
                ))}
                {admins.length === 0 && (
                  <tr><td colSpan={4} className="px-3 py-4 text-stone-400 text-center">No admins yet</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-stone-100 pt-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert size={14} className="text-amber-600" />
              <h3 className="text-sm font-medium text-stone-900">Grant admin access</h3>
            </div>
            <p className="text-xs text-stone-500 mb-3">User must already have an account. Promoting them grants full system access.</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <TextInput
                type="email"
                placeholder="user@example.com"
                value={grantEmail}
                onChange={(e) => setGrantEmail(e.target.value)}
                className="flex-1"
              />
              <button
                type="button"
                onClick={handleGrant}
                disabled={grantBusy || !grantEmail.trim()}
                className="inline-flex items-center justify-center gap-2 min-h-[40px] px-4 text-sm font-medium rounded-md bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-40"
              >
                {grantBusy ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                Grant Admin
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminSettings;
