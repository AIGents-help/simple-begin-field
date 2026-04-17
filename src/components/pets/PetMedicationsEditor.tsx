import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

export interface PetMedicationDraft {
  id?: string;
  _localId?: string;
  name: string;
  dose: string;
  frequency: string;
  notes?: string;
  _deleted?: boolean;
}

interface Props {
  medications: PetMedicationDraft[];
  onChange: (next: PetMedicationDraft[]) => void;
}

export const PetMedicationsEditor: React.FC<Props> = ({ medications, onChange }) => {
  const visible = medications.filter(m => !m._deleted);

  const update = (index: number, patch: Partial<PetMedicationDraft>) => {
    const next = [...medications];
    // map visible index back to underlying array
    const visIndices = medications.map((m, i) => (m._deleted ? -1 : i)).filter(i => i >= 0);
    const realIndex = visIndices[index];
    next[realIndex] = { ...next[realIndex], ...patch };
    onChange(next);
  };

  const remove = (index: number) => {
    const next = [...medications];
    const visIndices = medications.map((m, i) => (m._deleted ? -1 : i)).filter(i => i >= 0);
    const realIndex = visIndices[index];
    if (next[realIndex].id) {
      next[realIndex] = { ...next[realIndex], _deleted: true };
    } else {
      next.splice(realIndex, 1);
    }
    onChange(next);
  };

  const add = () => {
    onChange([
      ...medications,
      { _localId: crypto.randomUUID(), name: '', dose: '', frequency: '', notes: '' },
    ]);
  };

  return (
    <div className="space-y-3">
      {visible.length === 0 && (
        <p className="text-xs text-stone-500 italic">No medications added.</p>
      )}
      {visible.map((med, i) => (
        <div
          key={med.id || med._localId || i}
          className="rounded-xl border border-stone-200 bg-stone-50 p-3 space-y-2"
        >
          <div className="flex items-start gap-2">
            <input
              type="text"
              value={med.name}
              onChange={(e) => update(i, { name: e.target.value })}
              placeholder="Medication name"
              className="flex-1 px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm font-medium text-navy-muted focus:outline-none focus:ring-2 focus:ring-navy-muted/20"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="shrink-0 p-2 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              aria-label="Remove medication"
            >
              <Trash2 size={16} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={med.dose}
              onChange={(e) => update(i, { dose: e.target.value })}
              placeholder="Dose (e.g. 5mg)"
              className="px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm text-navy-muted focus:outline-none focus:ring-2 focus:ring-navy-muted/20"
            />
            <input
              type="text"
              value={med.frequency}
              onChange={(e) => update(i, { frequency: e.target.value })}
              placeholder="Frequency"
              className="px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm text-navy-muted focus:outline-none focus:ring-2 focus:ring-navy-muted/20"
            />
          </div>
          <input
            type="text"
            value={med.notes || ''}
            onChange={(e) => update(i, { notes: e.target.value })}
            placeholder="Notes (optional)"
            className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm text-navy-muted focus:outline-none focus:ring-2 focus:ring-navy-muted/20"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="w-full py-2.5 rounded-xl border-2 border-dashed border-stone-200 text-stone-500 hover:border-navy-muted hover:text-navy-muted text-sm font-bold flex items-center justify-center gap-2 transition-colors"
      >
        <Plus size={16} />
        Add medication
      </button>
    </div>
  );
};
