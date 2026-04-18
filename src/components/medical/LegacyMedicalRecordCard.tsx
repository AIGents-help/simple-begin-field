import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronUp, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { medicalService, MedicalRecord, MEDICAL_TYPE_LABELS, MedicalRecordType } from '@/services/medicalService';
import { useConfirm } from '@/context/ConfirmDialogContext';

interface Props {
  record: MedicalRecord;
  onMigrated: () => void;
  onDeleted: (id: string) => void;
}

const TARGET_TYPES: MedicalRecordType[] = ['doctor', 'insurance', 'allergy', 'surgery', 'emergency'];

/**
 * Generic read-only viewer for legacy medical records that don't fit the
 * structured card components (e.g. an old "End-of-life Treatment Wishes"
 * record that was force-migrated into record_type='doctor').
 *
 * Shows the original title + content, lets the user re-categorize the
 * record, and offers a delete option.
 */
export const LegacyMedicalRecordCard: React.FC<Props> = ({ record, onMigrated, onDeleted }) => {
  const [open, setOpen] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [targetType, setTargetType] = useState<MedicalRecordType | ''>('');
  const confirm = useConfirm();

  const title = record.provider_name || 'Untitled record';
  const body = record.notes || record.legacy_notes || '';

  const handleMigrate = async () => {
    if (!targetType) {
      toast.error('Pick a category first', { position: 'bottom-center' });
      return;
    }
    setMigrating(true);
    try {
      await medicalService.upsert({
        ...record,
        record_type: targetType,
      } as any);
      toast.success(`Moved to ${MEDICAL_TYPE_LABELS[targetType]}`, { position: 'bottom-center' });
      onMigrated();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Could not move record', { position: 'bottom-center' });
    } finally {
      setMigrating(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Delete legacy record?',
      description: `“${title}” will be permanently removed.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await medicalService.remove(record.id);
      onDeleted(record.id);
      toast.success('Record deleted', { position: 'bottom-center' });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Could not delete', { position: 'bottom-center' });
    }
  };

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/40 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 p-4 text-left active:bg-amber-50"
      >
        <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
          <FileText size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Legacy record</p>
          <p className="text-sm font-bold text-stone-900 truncate">{title}</p>
          {body && <p className="text-xs text-stone-500 truncate">{body}</p>}
        </div>
        {open ? <ChevronUp size={16} className="text-stone-400" /> : <ChevronDown size={16} className="text-stone-400" />}
      </button>

      {open && (
        <div className="border-t border-amber-200 p-4 space-y-4 bg-white">
          <p className="text-xs text-stone-500">
            This record was created before the Medical section was updated. You can view it here or move it to the correct category.
          </p>

          {body && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Original content</p>
              <p className="text-sm text-stone-700 whitespace-pre-wrap">{body}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block">Move to category</label>
            <div className="flex gap-2">
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value as MedicalRecordType)}
                className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select category…</option>
                {TARGET_TYPES.map((t) => (
                  <option key={t} value={t}>{MEDICAL_TYPE_LABELS[t]}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleMigrate}
                disabled={!targetType || migrating}
                className="px-3 py-2 rounded-md bg-navy-muted text-primary-foreground text-sm font-bold flex items-center gap-1 disabled:opacity-50"
              >
                {migrating ? <Loader2 className="animate-spin" size={14} /> : <ArrowRight size={14} />}
                Move
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={handleDelete}
              className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
            >
              <Trash2 size={12} /> Delete record
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Heuristic: is this medical record a "legacy / misrouted" entry that
 * shouldn't open in a structured card?
 *
 * Currently focuses on doctor records that have no doctor-specific data
 * populated — these are almost always old free-form info records that
 * were force-migrated.
 */
export const isLegacyMedicalRecord = (r: MedicalRecord): boolean => {
  const validTypes = new Set(['emergency', 'doctor', 'insurance', 'allergy', 'surgery']);
  if (!validTypes.has(r.record_type as string)) return true;

  if (r.record_type === 'doctor') {
    const d = (r.details || {}) as Record<string, any>;
    const hasDoctorData = Boolean(
      d.provider_type || d.practice_name || d.fax || d.patient_id ||
      d.portal_url || d.insurance_accepted || d.conditions_treated ||
      d.last_visit_date ||
      r.specialty || r.phone || r.address || r.next_appointment_date,
    );
    if (hasDoctorData) return false;

    // No doctor-specific data at all → check the title for non-doctor keywords
    const name = (r.provider_name || '').toLowerCase();
    const looksLikeDoctor = /^(dr\.?|doctor|md\b)/i.test(name);
    if (looksLikeDoctor) return false;

    // No doctor-y data, no doctor-y name → treat as legacy
    return true;
  }

  return false;
};
