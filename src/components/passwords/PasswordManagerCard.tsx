import React, { useState } from 'react';
import { KeyRound, ChevronDown, ChevronUp, Edit2, X } from 'lucide-react';
import { toast } from 'sonner';
import { passwordService, PASSWORD_MANAGER_CATEGORY } from '../../services/passwordService';

interface Props {
  packetId: string;
  record: any | null;
  onSaved: (record: any) => void;
}

const MANAGER_OPTIONS = ['1Password', 'LastPass', 'Bitwarden', 'Dashlane', 'Apple Keychain', 'Google Password Manager', 'Other'];

export const PasswordManagerCard: React.FC<Props> = ({ packetId, record, onSaved }) => {
  const [editing, setEditing] = useState(!record);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>(record || {
    manager_name: '',
    master_password_location: '',
    recovery_key_location: '',
    emergency_instructions: '',
    trusted_person_name: '',
    notes: '',
  });

  React.useEffect(() => {
    if (record) setForm(record);
  }, [record]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const payload = {
      ...form,
      id: record?.id,
      category: PASSWORD_MANAGER_CATEGORY,
      service_name: form.manager_name || 'Password Manager',
      scope: record?.scope || 'shared',
    };
    const { data, error } = await passwordService.save(packetId, payload);
    setSaving(false);
    if (error) {
      toast.error(`Save failed: ${error.message}`, { duration: 4000, position: 'bottom-center' });
      return;
    }
    toast.success('Password manager saved.', { duration: 2500, position: 'bottom-center' });
    setEditing(false);
    onSaved(data);
  };

  const isEmpty = !record || !record.manager_name;

  if (!editing && !isEmpty) {
    return (
      <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <KeyRound size={20} className="text-amber-700" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Master Key · Pinned</p>
              <h3 className="text-base font-bold text-navy-muted mt-0.5 truncate">
                {record.manager_name || 'Password Manager'}
              </h3>
              {record.master_password_location && (
                <p className="text-xs text-stone-600 mt-1">
                  <span className="font-semibold">Master password:</span> {record.master_password_location}
                </p>
              )}
              {record.trusted_person_name && (
                <p className="text-xs text-stone-600 mt-0.5">
                  <span className="font-semibold">Knows it:</span> {record.trusted_person_name}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="p-2 rounded-lg hover:bg-amber-100 text-amber-700 shrink-0"
            aria-label="Edit password manager"
          >
            <Edit2 size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <KeyRound size={18} className="text-amber-700" />
          <h3 className="font-bold text-navy-muted">Password Manager</h3>
        </div>
        {!isEmpty && (
          <button onClick={() => { setEditing(false); setForm(record); }} className="p-1 rounded hover:bg-amber-100">
            <X size={16} className="text-stone-500" />
          </button>
        )}
      </div>
      <p className="text-[11px] text-amber-800 mb-3 leading-relaxed">
        Without the master password, none of your other accounts are accessible. Make sure a trusted person knows where to find it.
      </p>

      <div className="space-y-3">
        <Field label="Password manager">
          <select
            value={form.manager_name || ''}
            onChange={(e) => setForm({ ...form, manager_name: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm bg-white"
          >
            <option value="">Select…</option>
            {MANAGER_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </Field>

        <Field label="Where to find the master password" hint="Physical location only — e.g. 'fireproof safe, envelope marked Digital'">
          <input
            value={form.master_password_location || ''}
            onChange={(e) => setForm({ ...form, master_password_location: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
            placeholder="Fireproof safe, top drawer envelope…"
          />
        </Field>

        <Field label="Recovery key location" hint="Where is the emergency recovery kit?">
          <input
            value={form.recovery_key_location || ''}
            onChange={(e) => setForm({ ...form, recovery_key_location: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
            placeholder="Bank safe deposit box, attorney's file…"
          />
        </Field>

        <Field label="Emergency access instructions">
          <textarea
            value={form.emergency_instructions || ''}
            onChange={(e) => setForm({ ...form, emergency_instructions: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
            placeholder="Step-by-step: 1) Open safe with combo… 2) Master password is on the blue card…"
          />
        </Field>

        <Field label="Trusted person who knows the master password">
          <input
            value={form.trusted_person_name || ''}
            onChange={(e) => setForm({ ...form, trusted_person_name: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
            placeholder="Name + relationship"
          />
        </Field>

        <Field label="Notes">
          <textarea
            value={form.notes || ''}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
          />
        </Field>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2.5 rounded-lg bg-navy-muted text-white font-bold text-sm disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Password Manager'}
        </button>
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <div>
    <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">{label}</label>
    {hint && <p className="text-[10px] text-stone-400 mb-1">{hint}</p>}
    {children}
  </div>
);
