import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Pencil, Trash2, Plus, Shield, Loader2, X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useAppContext } from '@/context/AppContext';
import { useConfirm } from '@/context/ConfirmDialogContext';
import { BackButton } from '@/components/common/BackButton';

const PROFESSION_TYPES = [
  'Estate Planning Attorney',
  'Financial Advisor / Wealth Manager',
  'CPA / Tax Professional',
  'Insurance Agent',
  'Funeral Home / Pre-Planner',
];

interface FeaturedProfessional {
  id: string;
  name: string;
  firm: string | null;
  profession_type: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  description: string | null;
  is_verified: boolean;
  is_active: boolean;
  display_order: number;
  service_area_states: string[] | null;
}

const emptyForm = {
  name: '',
  firm: '',
  profession_type: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  phone: '',
  email: '',
  website: '',
  description: '',
  service_area_states_text: '',
  display_order: 1,
  is_active: true,
};

export const AdminFeaturedProfessionals = () => {
  const { profile } = useAppContext();
  const confirm = useConfirm();
  const [professionals, setProfessionals] = useState<FeaturedProfessional[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isAdmin = profile?.role === 'admin';

  const fetchProfessionals = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('featured_professionals')
      .select('*')
      .order('display_order', { ascending: true });
    if (error) {
      console.error('Load error:', error);
      toast.error('Failed to load professionals');
    }
    setProfessionals((data as FeaturedProfessional[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) fetchProfessionals();
  }, [isAdmin, fetchProfessionals]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (pro: FeaturedProfessional) => {
    setEditingId(pro.id);
    setForm({
      name: pro.name,
      firm: pro.firm || '',
      profession_type: pro.profession_type,
      address: pro.address || '',
      city: pro.city || '',
      state: pro.state || '',
      zip: pro.zip || '',
      phone: pro.phone || '',
      email: pro.email || '',
      website: pro.website || '',
      description: pro.description || '',
      service_area_states_text: (pro.service_area_states || []).join(', '),
      display_order: pro.display_order,
      is_active: pro.is_active,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (!form.profession_type) { toast.error('Profession type is required'); return; }

    setSaving(true);
    const payload: any = {
      name: form.name.trim(),
      firm: form.firm.trim() || null,
      profession_type: form.profession_type,
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim().toUpperCase() || null,
      zip: form.zip.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      website: form.website.trim() || null,
      description: form.description.trim() || null,
      display_order: form.display_order,
      is_active: form.is_active,
      service_area_states: form.service_area_states_text
        ? form.service_area_states_text.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
        : null,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from('featured_professionals').update(payload).eq('id', editingId));
    } else {
      ({ error } = await supabase.from('featured_professionals').insert(payload));
    }

    if (error) {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save');
    } else {
      toast.success(editingId ? 'Professional updated' : 'Professional added');
      setModalOpen(false);
      fetchProfessionals();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Remove this professional?',
      description: 'They will be removed from the public directory. This action cannot be undone.',
    });
    if (!ok) return;
    setDeletingId(id);
    const { error } = await supabase.from('featured_professionals').delete().eq('id', id);
    if (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete');
    } else {
      toast.success('Professional removed');
      fetchProfessionals();
    }
    setDeletingId(null);
  };

  const toggleActive = async (pro: FeaturedProfessional) => {
    const { error } = await supabase
      .from('featured_professionals')
      .update({ is_active: !pro.is_active })
      .eq('id', pro.id);
    if (error) {
      console.error('Toggle error:', error);
      toast.error('Failed to update');
    } else {
      setProfessionals(prev =>
        prev.map(p => (p.id === pro.id ? { ...p, is_active: !p.is_active } : p))
      );
      toast.success(pro.is_active ? 'Deactivated' : 'Activated');
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-stone-500">
        <Shield className="w-12 h-12 mx-auto mb-4 text-stone-300" />
        <p className="font-bold">Admin access required</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1280px] mx-auto pb-32">
      <div className="mb-4"><BackButton /></div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-serif font-bold text-navy-muted">Admin Panel</h1>
            <span className="px-2 py-0.5 bg-[#c9a84c] text-white text-[10px] font-bold uppercase rounded-full flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Admin
            </span>
          </div>
          <p className="text-sm text-stone-500">Manage verified professionals shown to users</p>
        </div>
      </div>

      {/* Featured Professionals Card */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-stone-100">
          <h2 className="font-bold text-navy-muted text-sm">Featured Professionals</h2>
          <button
            onClick={openAdd}
            className="px-4 py-2 bg-navy-muted text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-navy-muted/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Professional
          </button>
        </div>

        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
          </div>
        ) : professionals.length === 0 ? (
          <div className="p-8 text-center text-stone-400 text-sm">
            No featured professionals yet. Click "Add Professional" to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 text-left">
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-stone-400">Name</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-stone-400">Firm</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-stone-400">Type</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-stone-400">City/State</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-stone-400">Phone</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-stone-400 text-center">Active</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-stone-400 text-center">Order</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-stone-400 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {professionals.map(pro => (
                  <tr key={pro.id} className="border-t border-stone-100 hover:bg-stone-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-stone-900">{pro.name}</td>
                    <td className="px-4 py-3 text-stone-500">{pro.firm || '—'}</td>
                    <td className="px-4 py-3 text-stone-500 text-xs">{pro.profession_type}</td>
                    <td className="px-4 py-3 text-stone-500">
                      {[pro.city, pro.state].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-3 text-stone-500">{pro.phone || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <Switch
                        checked={pro.is_active}
                        onCheckedChange={() => toggleActive(pro)}
                      />
                    </td>
                    <td className="px-4 py-3 text-center text-stone-500">{pro.display_order}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEdit(pro)}
                          className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors text-stone-500 hover:text-navy-muted"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(pro.id)}
                          disabled={deletingId === pro.id}
                          className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-stone-400 hover:text-red-500 disabled:opacity-50"
                        >
                          {deletingId === pro.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-navy-muted/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-stone-100">
              <h3 className="font-bold text-navy-muted">
                {editingId ? 'Edit Professional' : 'Add Professional'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 hover:bg-stone-100 rounded-lg">
                <X className="w-5 h-5 text-stone-400" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <FormField label="Name *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
              <FormField label="Firm" value={form.firm} onChange={v => setForm(f => ({ ...f, firm: v }))} />
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Profession Type *</label>
                <select
                  value={form.profession_type}
                  onChange={e => setForm(f => ({ ...f, profession_type: e.target.value }))}
                  className="w-full p-2.5 bg-white rounded-xl border border-stone-200 text-sm outline-none focus:border-stone-400"
                >
                  <option value="">Select...</option>
                  {PROFESSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <FormField label="Address" value={form.address} onChange={v => setForm(f => ({ ...f, address: v }))} />
              <div className="grid grid-cols-3 gap-2">
                <FormField label="City" value={form.city} onChange={v => setForm(f => ({ ...f, city: v }))} />
                <FormField label="State" value={form.state} onChange={v => setForm(f => ({ ...f, state: v }))} placeholder="PA" />
                <FormField label="ZIP" value={form.zip} onChange={v => setForm(f => ({ ...f, zip: v }))} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <FormField label="Phone" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} />
                <FormField label="Email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} />
              </div>
              <FormField label="Website" value={form.website} onChange={v => setForm(f => ({ ...f, website: v }))} />
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full p-2.5 bg-white rounded-xl border border-stone-200 text-sm outline-none focus:border-stone-400 min-h-[80px] resize-none"
                />
              </div>
              <FormField
                label="Service Area States"
                value={form.service_area_states_text}
                onChange={v => setForm(f => ({ ...f, service_area_states_text: v }))}
                placeholder="PA, NJ, DE"
              />
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Display Order</label>
                  <input
                    type="number"
                    value={form.display_order}
                    onChange={e => setForm(f => ({ ...f, display_order: parseInt(e.target.value) || 1 }))}
                    className="w-full p-2.5 bg-white rounded-xl border border-stone-200 text-sm outline-none focus:border-stone-400"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm font-medium text-stone-700">Active</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-stone-100">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-stone-500 hover:bg-stone-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-navy-muted text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-navy-muted/90 transition-colors disabled:opacity-50"
              >
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FormField = ({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) => (
  <div className="space-y-1">
    <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{label}</label>
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full p-2.5 bg-white rounded-xl border border-stone-200 text-sm outline-none focus:border-stone-400"
    />
  </div>
);
