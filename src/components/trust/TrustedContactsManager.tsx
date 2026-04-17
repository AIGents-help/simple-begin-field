import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '../../context/AppContext';
import { toast } from 'sonner';
import {
  UserPlus, Pencil, Trash2, ShieldCheck, Clock, X, Loader2,
  Mail, Phone, Users, Bell, BellOff, CheckCircle2, AlertCircle, Cross
} from 'lucide-react';
import { LifeStatusToggle } from '../common/LifeStatusToggle';

interface TrustedContact {
  id: string;
  packet_id: string;
  user_id: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  relationship: string | null;
  access_level: string;
  status: string;
  notify_on: string;
  access_granted: boolean;
  access_granted_at: string | null;
  notes: string | null;
  created_at: string;
  assigned_sections: string[];
  notify_on_updates: boolean;
  is_deceased?: boolean | null;
  date_of_death?: string | null;
}

const SECTION_OPTIONS = [
  { key: 'all', label: 'All Sections' },
  { key: 'info', label: 'Info & Identity' },
  { key: 'family', label: 'Family & Contacts' },
  { key: 'medical', label: 'Medical' },
  { key: 'banking', label: 'Banking & Financial' },
  { key: 'real_estate', label: 'Real Estate' },
  { key: 'retirement', label: 'Retirement' },
  { key: 'vehicles', label: 'Vehicles' },
  { key: 'advisors', label: 'Advisors' },
  { key: 'passwords', label: 'Passwords & Access' },
  { key: 'property', label: 'Personal Property' },
  { key: 'pets', label: 'Pets' },
  { key: 'funeral', label: 'Funeral Wishes' },
  { key: 'private', label: 'Private Items' },
];

const RELATIONSHIPS = [
  'Spouse/Partner', 'Adult Child', 'Sibling', 'Parent',
  'Attorney', 'Financial Advisor', 'Friend', 'Other'
];

const emptyForm = {
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  relationship: '',
  access_level: 'full',
  notes: '',
  assigned_sections: [] as string[],
  notify_on_updates: true,
};

export const TrustedContactsManager: React.FC = () => {
  const { user } = useAppContext();
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [grantingId, setGrantingId] = useState<string | null>(null);
  const [confirmGrantId, setConfirmGrantId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const loadContacts = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('trusted_contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setContacts((data as any[]) || []);
    } catch (err: any) {
      console.error('Load trusted contacts error:', err);
      toast.error(err.message || 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadContacts(); }, [loadContacts]);

  const getPacketId = async (): Promise<string | null> => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('packets')
      .select('id')
      .eq('owner_user_id', user.id)
      .single();
    if (error || !data) {
      console.error('Get packet error:', error);
      toast.error('Could not find your packet');
      return null;
    }
    return data.id;
  };

  const handleSave = async () => {
    if (!form.contact_name.trim() || !form.contact_email.trim()) {
      toast.error('Name and email are required');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from('trusted_contacts')
          .update({
            contact_name: form.contact_name.trim(),
            contact_email: form.contact_email.trim(),
            contact_phone: form.contact_phone.trim() || null,
            relationship: form.relationship || null,
            access_level: form.access_level,
            notes: form.notes.trim() || null,
            assigned_sections: form.assigned_sections,
            notify_on_updates: form.notify_on_updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Contact updated');
      } else {
        const packetId = await getPacketId();
        if (!packetId) return;
        const { error } = await supabase
          .from('trusted_contacts')
          .insert({
            packet_id: packetId,
            user_id: user!.id,
            contact_name: form.contact_name.trim(),
            contact_email: form.contact_email.trim(),
            contact_phone: form.contact_phone.trim() || null,
            relationship: form.relationship || null,
            access_level: form.access_level,
            notes: form.notes.trim() || null,
            assigned_sections: form.assigned_sections,
            notify_on_updates: form.notify_on_updates,
          });
        if (error) throw error;
        toast.success('Trusted contact added');
      }
      setModalOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      await loadContacts();
    } catch (err: any) {
      console.error('Save trusted contact error:', err);
      toast.error(err.message || 'Failed to save contact');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (c: TrustedContact) => {
    setEditingId(c.id);
    setForm({
      contact_name: c.contact_name,
      contact_email: c.contact_email,
      contact_phone: c.contact_phone || '',
      relationship: c.relationship || '',
      access_level: c.access_level,
      notes: c.notes || '',
      assigned_sections: c.assigned_sections || [],
      notify_on_updates: c.notify_on_updates !== false,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('trusted_contacts').delete().eq('id', id);
      if (error) throw error;
      toast.success('Contact removed');
      setConfirmDeleteId(null);
      await loadContacts();
    } catch (err: any) {
      console.error('Delete trusted contact error:', err);
      toast.error(err.message || 'Failed to delete contact');
    }
  };

  const handleGrantAccess = async (c: TrustedContact) => {
    setGrantingId(c.id);
    try {
      const { error } = await supabase
        .from('trusted_contacts')
        .update({ access_granted: true, access_granted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', c.id);
      if (error) throw error;
      toast.success(`Access granted to ${c.contact_name}`);
      setConfirmGrantId(null);
      await loadContacts();
    } catch (err: any) {
      console.error('Grant access error:', err);
      toast.error(err.message || 'Failed to grant access');
    } finally {
      setGrantingId(null);
    }
  };

  const handleToggleNotify = async (c: TrustedContact) => {
    const newVal = c.notify_on === 'immediate' ? 'manual' : 'immediate';
    try {
      const { error } = await supabase
        .from('trusted_contacts')
        .update({ notify_on: newVal, updated_at: new Date().toISOString() })
        .eq('id', c.id);
      if (error) throw error;
      toast.success(newVal === 'immediate' ? 'Will notify immediately' : 'Set to manual release');
      await loadContacts();
    } catch (err: any) {
      console.error('Toggle notify error:', err);
      toast.error(err.message || 'Failed to update');
    }
  };

  const handleToggleDeceased = async (c: TrustedContact, deceased: boolean) => {
    // Optimistic update
    setContacts(prev => prev.map(x => x.id === c.id ? { ...x, is_deceased: deceased } : x));
    try {
      const { error } = await supabase
        .from('trusted_contacts')
        .update({
          is_deceased: deceased,
          date_of_death: deceased ? (c.date_of_death || null) : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', c.id);
      if (error) throw error;
      toast.success(deceased ? `${c.contact_name} marked as deceased` : `${c.contact_name} marked as living`, {
        duration: 3000, position: 'bottom-center',
      });
    } catch (err: any) {
      // Roll back
      setContacts(prev => prev.map(x => x.id === c.id ? { ...x, is_deceased: !deceased } : x));
      console.error('Toggle deceased error:', err);
      toast.error(err.message || 'Failed to update status', { duration: 4000, position: 'bottom-center' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-serif font-bold text-navy-muted">My Trusted Contacts</h2>
          <p className="text-xs text-stone-500 mt-1">People you trust to access your Survivor Packet</p>
        </div>
        <button
          onClick={() => { setEditingId(null); setForm(emptyForm); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-navy-muted text-white rounded-xl text-sm font-bold hover:bg-navy-muted/90 transition-colors"
        >
          <UserPlus size={16} />
          Add Contact
        </button>
      </div>

      {/* Contact List */}
      {contacts.length === 0 ? (
        <div className="paper-sheet p-8 text-center">
          <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users size={28} className="text-stone-400" />
          </div>
          <h3 className="text-lg font-bold text-navy-muted mb-2">No trusted contacts yet</h3>
          <p className="text-sm text-stone-500 max-w-sm mx-auto">
            Add someone you trust to access your Packet if something happens to you.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {contacts.map(c => (
            <div key={c.id} className={`paper-sheet p-5 ${c.is_deceased ? 'opacity-75 bg-stone-50/40' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`text-base font-bold ${c.is_deceased ? 'text-stone-500' : 'text-navy-muted'}`}>{c.contact_name}</h3>
                    {c.is_deceased && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-stone-200 text-stone-600 border border-stone-300 flex items-center gap-1">
                        <Cross size={10} /> Deceased
                      </span>
                    )}
                    {/* Access level badge */}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      c.access_level === 'full'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'bg-stone-100 text-stone-500'
                    }`}>
                      {c.access_level === 'full' ? 'Full Access' : 'Limited'}
                    </span>
                    {/* Status badge */}
                    {c.access_granted ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 size={10} /> Access Granted
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-amber-50 text-amber-700 flex items-center gap-1">
                        <Clock size={10} /> Pending
                      </span>
                    )}
                  </div>
                  {/* Section pills */}
                  {c.assigned_sections && c.assigned_sections.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {c.assigned_sections.map(s => {
                        const label = SECTION_OPTIONS.find(o => o.key === s)?.label || s;
                        return (
                          <span key={s} className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-navy-muted/10 text-navy-muted">
                            {label}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-stone-500 flex items-center gap-1.5">
                      <Mail size={12} /> {c.contact_email}
                    </p>
                    {c.contact_phone && (
                      <p className="text-xs text-stone-500 flex items-center gap-1.5">
                        <Phone size={12} /> {c.contact_phone}
                      </p>
                    )}
                    {c.relationship && (
                      <p className="text-xs text-stone-500">{c.relationship}</p>
                    )}
                    {c.access_granted && c.access_granted_at && (
                      <p className="text-[10px] text-emerald-600 font-medium mt-1">
                        Granted on {new Date(c.access_granted_at).toLocaleDateString()}
                      </p>
                    )}
                    {c.is_deceased && (
                      <p className="text-[10px] italic text-stone-500 mt-1">
                        Marked deceased — do not contact.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => handleEdit(c)} className="p-2 hover:bg-stone-50 rounded-lg transition-colors" title="Edit">
                    <Pencil size={14} className="text-stone-400" />
                  </button>
                  <button onClick={() => setConfirmDeleteId(c.id)} className="p-2 hover:bg-stone-50 rounded-lg transition-colors" title="Delete">
                    <Trash2 size={14} className="text-stone-400" />
                  </button>
                </div>
              </div>

              {/* Life status toggle — saves immediately */}
              <div className="mt-4 pt-3 border-t border-stone-100">
                <LifeStatusToggle
                  value={!!c.is_deceased}
                  onChange={(d) => handleToggleDeceased(c, d)}
                />
              </div>

              {/* Bottom controls */}
              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between flex-wrap gap-3">
                {/* Notify toggle */}
                <button
                  onClick={() => handleToggleNotify(c)}
                  className="flex items-center gap-2 text-xs text-stone-500 hover:text-navy-muted transition-colors"
                >
                  {c.notify_on === 'immediate' ? (
                    <><Bell size={14} className="text-indigo-500" /> Notify immediately</>
                  ) : (
                    <><BellOff size={14} /> Hold until manual release</>
                  )}
                </button>

                {/* Grant access button */}
                {!c.access_granted && !c.is_deceased && (
                  <button
                    onClick={() => setConfirmGrantId(c.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors"
                  >
                    <ShieldCheck size={14} />
                    Grant Access Now
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => { setModalOpen(false); setEditingId(null); }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-navy-muted">{editingId ? 'Edit' : 'Add'} Trusted Contact</h3>
              <button onClick={() => { setModalOpen(false); setEditingId(null); }} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200">
                <X size={16} className="text-stone-500" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Full Name *</label>
                <input type="text" value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))}
                  placeholder="Jane Doe" className="w-full p-3 bg-white rounded-xl border border-stone-200 focus:border-stone-400 outline-none text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Email Address *</label>
                <input type="email" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))}
                  placeholder="jane@example.com" className="w-full p-3 bg-white rounded-xl border border-stone-200 focus:border-stone-400 outline-none text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Phone</label>
                <input type="tel" value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))}
                  placeholder="(555) 123-4567" className="w-full p-3 bg-white rounded-xl border border-stone-200 focus:border-stone-400 outline-none text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Relationship</label>
                <select value={form.relationship} onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))}
                  className="w-full p-3 bg-white rounded-xl border border-stone-200 focus:border-stone-400 outline-none text-sm">
                  <option value="">Select...</option>
                  {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Access Level</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 cursor-pointer hover:border-stone-300 transition-colors">
                    <input type="radio" name="access_level" value="full" checked={form.access_level === 'full'} onChange={() => setForm(f => ({ ...f, access_level: 'full' }))} className="accent-navy-muted" />
                    <div>
                      <p className="text-sm font-bold text-navy-muted">Full Access</p>
                      <p className="text-[10px] text-stone-400">Can view all sections of your Packet</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 cursor-pointer hover:border-stone-300 transition-colors">
                    <input type="radio" name="access_level" value="limited" checked={form.access_level === 'limited'} onChange={() => setForm(f => ({ ...f, access_level: 'limited' }))} className="accent-navy-muted" />
                    <div>
                      <p className="text-sm font-bold text-navy-muted">Limited Access</p>
                      <p className="text-[10px] text-stone-400">View only — cannot edit or download</p>
                    </div>
                  </label>
                </div>
              </div>
              {/* Responsible Sections */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Responsible Sections</label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto p-3 rounded-xl border border-stone-200 bg-stone-50/50">
                  {SECTION_OPTIONS.map(opt => {
                    const checked = form.assigned_sections.includes(opt.key);
                    const allChecked = form.assigned_sections.includes('all');
                    return (
                      <label key={opt.key} className="flex items-center gap-2.5 cursor-pointer py-0.5">
                        <input
                          type="checkbox"
                          checked={opt.key === 'all' ? allChecked : (allChecked || checked)}
                          disabled={opt.key !== 'all' && allChecked}
                          onChange={() => {
                            setForm(f => {
                              if (opt.key === 'all') {
                                return { ...f, assigned_sections: checked ? [] : ['all'] };
                              }
                              const next = checked
                                ? f.assigned_sections.filter(s => s !== opt.key)
                                : [...f.assigned_sections.filter(s => s !== 'all'), opt.key];
                              return { ...f, assigned_sections: next };
                            });
                          }}
                          className="accent-navy-muted w-3.5 h-3.5"
                        />
                        <span className={`text-xs ${opt.key === 'all' ? 'font-bold text-navy-muted' : 'text-stone-600'}`}>{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              {/* Notify on updates toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-stone-200">
                <div>
                  <p className="text-sm font-bold text-navy-muted">Notify when I update their sections</p>
                  <p className="text-[10px] text-stone-400">Send an email when you update a section they're responsible for</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, notify_on_updates: !f.notify_on_updates }))}
                  className={`relative w-10 h-6 rounded-full transition-colors ${form.notify_on_updates ? 'bg-navy-muted' : 'bg-stone-300'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.notify_on_updates ? 'left-[18px]' : 'left-0.5'}`} />
                </button>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3} placeholder="Any special instructions..."
                  className="w-full p-3 bg-white rounded-xl border border-stone-200 focus:border-stone-400 outline-none text-sm resize-none" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => { setModalOpen(false); setEditingId(null); }}
                className="flex-1 py-3 border border-stone-200 rounded-xl text-sm font-bold text-stone-600 hover:bg-stone-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-3 bg-navy-muted text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-navy-muted/90 transition-colors disabled:opacity-50">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Contact'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grant Access Confirm Dialog */}
      {confirmGrantId && (() => {
        const c = contacts.find(x => x.id === confirmGrantId);
        if (!c) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setConfirmGrantId(null)}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto">
                <ShieldCheck size={24} className="text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-navy-muted text-center">Grant Access?</h3>
              <p className="text-sm text-stone-500 text-center">
                This will immediately notify <strong>{c.contact_name}</strong> at <strong>{c.contact_email}</strong> that they now have access to your Survivor Packet. Are you sure?
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmGrantId(null)}
                  className="flex-1 py-3 border border-stone-200 rounded-xl text-sm font-bold text-stone-600 hover:bg-stone-50">
                  Cancel
                </button>
                <button onClick={() => handleGrantAccess(c)} disabled={grantingId === c.id}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {grantingId === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck size={16} />}
                  Grant Access
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Delete Confirm Dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setConfirmDeleteId(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center mx-auto">
              <AlertCircle size={24} className="text-rose-600" />
            </div>
            <h3 className="text-lg font-bold text-navy-muted text-center">Remove Contact?</h3>
            <p className="text-sm text-stone-500 text-center">
              Are you sure you want to remove this trusted contact? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-3 border border-stone-200 rounded-xl text-sm font-bold text-stone-600 hover:bg-stone-50">
                Cancel
              </button>
              <button onClick={() => handleDelete(confirmDeleteId)}
                className="flex-1 py-3 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700">
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
