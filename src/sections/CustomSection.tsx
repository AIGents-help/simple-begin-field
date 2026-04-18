import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, Edit2, Trash2, MoreVertical, FileText, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useAppContext } from '../context/AppContext';
import { customSectionService, CustomSection as CustomSectionType, CustomSectionRecord } from '../services/customSectionService';
import { getCustomSectionIcon } from '../config/customSectionIcons';
import { CustomSectionModal } from '../components/sections/CustomSectionModal';
import { useConfirm } from '../context/ConfirmDialogContext';

interface Props {
  section: CustomSectionType;
  onSectionUpdated: (s: CustomSectionType) => void;
  onSectionDeleted: (id: string) => void;
}

export const CustomSection: React.FC<Props> = ({ section, onSectionUpdated, onSectionDeleted }) => {
  const { currentPacket, bumpCompletion } = useAppContext();
  const confirm = useConfirm();
  const [records, setRecords] = useState<CustomSectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<CustomSectionRecord | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showEditSection, setShowEditSection] = useState(false);

  const Icon = getCustomSectionIcon(section.icon);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await customSectionService.listRecords(section.id);
      setRecords(data);
    } catch (err) {
      console.error('[CustomSection.load]', err);
    } finally {
      setLoading(false);
    }
  }, [section.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDeleteSection = async () => {
    const ok = await confirm({
      title: 'Delete this custom section?',
      description: 'This will delete all entries inside. This cannot be undone.',
      confirmLabel: 'Delete Section',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await customSectionService.remove(section.id);
      toast.success('Custom section deleted');
      onSectionDeleted(section.id);
      bumpCompletion();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete section');
    }
  };

  const handleDeleteRecord = async (record: CustomSectionRecord) => {
    const ok = await confirm({
      title: 'Delete this entry?',
      description: `"${record.title}" will be permanently removed.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await customSectionService.removeRecord(record.id);
      setRecords((prev) => prev.filter((r) => r.id !== record.id));
      toast.success('Entry deleted');
      bumpCompletion();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete entry');
    }
  };

  if (!currentPacket) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-xl bg-navy-muted/5 border border-navy-muted/10 text-navy-muted">
            <Icon size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-serif font-bold text-navy-muted">{section.name}</h1>
              <span className="px-2 py-0.5 bg-amber-100/70 text-amber-800 text-[9px] font-bold uppercase tracking-widest rounded border border-amber-200">
                Custom
              </span>
            </div>
            {section.description && (
              <p className="text-stone-500 text-sm mt-1">{section.description}</p>
            )}
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowSettings((s) => !s)}
            className="p-2 rounded-xl hover:bg-stone-100 text-stone-500"
            aria-label="Section settings"
          >
            <MoreVertical size={20} />
          </button>
          {showSettings && (
            <div
              className="absolute right-0 mt-1 w-48 bg-white border border-stone-200 rounded-xl shadow-lg py-1 z-20"
              onMouseLeave={() => setShowSettings(false)}
            >
              <button
                onClick={() => { setShowSettings(false); setShowEditSection(true); }}
                className="w-full px-3 py-2 text-left text-sm text-navy-muted hover:bg-stone-50 flex items-center gap-2"
              >
                <Edit2 size={14} /> Rename / edit
              </button>
              <button
                onClick={() => { setShowSettings(false); void handleDeleteSection(); }}
                className="w-full px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2"
              >
                <Trash2 size={14} /> Delete section
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add button */}
      <button
        onClick={() => { setEditing(null); setShowAdd(true); }}
        className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-navy-muted text-white rounded-xl font-bold shadow-md hover:bg-navy-muted/90"
      >
        <Plus size={18} /> Add Entry
      </button>

      {/* Records list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-navy-muted" size={24} />
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-16 bg-white/60 border border-dashed border-stone-200 rounded-2xl">
          <FileText size={32} className="text-stone-300 mx-auto mb-3" />
          <p className="text-stone-500 font-medium">No entries yet</p>
          <p className="text-stone-400 text-sm mt-1">Tap "Add Entry" to add your first item.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <div key={record.id} className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-navy-muted">{record.title}</h3>
                  {record.entry_date && (
                    <p className="text-[11px] text-stone-400 mt-0.5 flex items-center gap-1">
                      <Calendar size={11} /> {new Date(record.entry_date).toLocaleDateString()}
                    </p>
                  )}
                  {record.notes && (
                    <p className="text-sm text-stone-600 mt-2 whitespace-pre-wrap">{record.notes}</p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => { setEditing(record); setShowAdd(true); }}
                    className="p-2 rounded-lg hover:bg-stone-100 text-stone-500"
                    aria-label="Edit"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteRecord(record)}
                    className="p-2 rounded-lg hover:bg-rose-50 text-rose-500"
                    aria-label="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CustomSectionRecordModal
        isOpen={showAdd}
        onClose={() => { setShowAdd(false); setEditing(null); }}
        section={section}
        existing={editing}
        onSaved={(rec) => {
          setRecords((prev) => {
            const exists = prev.find((r) => r.id === rec.id);
            return exists ? prev.map((r) => (r.id === rec.id ? rec : r)) : [rec, ...prev];
          });
          bumpCompletion();
        }}
      />

      <CustomSectionModal
        isOpen={showEditSection}
        onClose={() => setShowEditSection(false)}
        existing={section}
        onSaved={(s) => onSectionUpdated(s)}
      />
    </div>
  );
};

const CustomSectionRecordModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  section: CustomSectionType;
  existing: CustomSectionRecord | null;
  onSaved: (rec: CustomSectionRecord) => void;
}> = ({ isOpen, onClose, section, existing, onSaved }) => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(existing?.title ?? '');
      setNotes(existing?.notes ?? '');
      setDate(existing?.entry_date ?? '');
    }
  }, [isOpen, existing]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    try {
      const saved = existing
        ? await customSectionService.updateRecord(existing.id, {
            title: title.trim(),
            notes: notes.trim() || null,
            entry_date: date || null,
          })
        : await customSectionService.createRecord({
            customSectionId: section.id,
            packetId: section.packet_id,
            title,
            notes,
            entryDate: date || null,
          });
      toast.success(existing ? 'Entry updated' : 'Entry added');
      onSaved(saved);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[75] flex items-end md:items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full md:max-w-lg bg-[#fdfaf3] rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="px-6 py-5 border-b border-stone-200/60">
          <h2 className="text-xl font-serif font-bold text-navy-muted">
            {existing ? 'Edit Entry' : 'New Entry'}
          </h2>
          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1">
            {section.name}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-navy-muted focus:outline-none focus:border-navy-muted"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2">
              Date <span className="text-stone-400 normal-case font-normal tracking-normal">(optional)</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-navy-muted focus:outline-none focus:border-navy-muted"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-navy-muted focus:outline-none focus:border-navy-muted resize-none"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-stone-200/60 flex gap-3 bg-white">
          <button onClick={onClose} className="flex-1 px-4 py-3 rounded-xl border border-stone-200 text-stone-600 font-bold">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="flex-1 px-4 py-3 rounded-xl bg-navy-muted text-white font-bold disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {existing ? 'Save' : 'Add Entry'}
          </button>
        </div>
      </div>
    </div>
  );
};
