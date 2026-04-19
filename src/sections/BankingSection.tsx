import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Building2, ChevronDown, ChevronUp, Plus, Pencil } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { SectionScreenTemplate, RecordCard, buildSubtitle } from '../components/sections/SectionScreenTemplate';
import { CategoryOption } from '../components/upload/types';
import { sectionService } from '../services/sectionService';
import { useConfirm } from '../context/ConfirmDialogContext';
import { getCategoryIcon } from '../config/categoryIcons';
import { InstitutionSheet } from '../components/banking/InstitutionSheet';

const ACCOUNT_TYPE_ORDER = ['Checking', 'Savings', 'Money Market', 'CD', 'Joint', 'Business'];

const sortAccounts = (a: any, b: any) => {
  const ta = String(a.account_type || '');
  const tb = String(b.account_type || '');
  const ia = ACCOUNT_TYPE_ORDER.indexOf(ta);
  const ib = ACCOUNT_TYPE_ORDER.indexOf(tb);
  if (ia !== -1 && ib !== -1) return ia - ib;
  if (ia !== -1) return -1;
  if (ib !== -1) return 1;
  return ta.localeCompare(tb);
};

const UNKNOWN_KEY = '__unknown__';

interface BankingViewProps {
  records: any[];
  refresh: () => void;
  onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void;
  onEditInstitution: (institutionName: string, routing?: string | null) => void;
}

const BankingView: React.FC<BankingViewProps> = ({ records, refresh, onAddClick, onEditInstitution }) => {
  const { bumpCompletion } = useAppContext();
  const confirm = useConfirm();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const handleDelete = async (record: any) => {
    if (!record?.id) return;
    const ok = await confirm({
      title: 'Delete this account?',
      description: `Delete the ${record.account_type || 'account'} at ${record.institution || 'this institution'}? This action cannot be undone.`,
    });
    if (!ok) return;
    const { error } = await sectionService.deleteRecord('banking', record.id);
    if (error) {
      toast.error(`Failed to delete: ${error.message}`, { duration: 4000, position: 'bottom-center' });
      return;
    }
    refresh();
    bumpCompletion();
    toast.success('Account deleted.', { duration: 3000, position: 'bottom-center' });
  };

  // Group records by institution name (case-insensitive grouping using first-seen casing)
  const grouped = useMemo(() => {
    const map: Record<string, { displayName: string; routing?: string; accounts: any[] }> = {};
    for (const r of records) {
      const raw = (r.institution || '').trim();
      const key = raw ? raw.toLowerCase() : UNKNOWN_KEY;
      if (!map[key]) {
        map[key] = {
          displayName: raw || 'Unknown Institution',
          routing: r.routing_number_masked || undefined,
          accounts: [],
        };
      }
      // Prefer the most-populated routing among accounts
      if (!map[key].routing && r.routing_number_masked) {
        map[key].routing = r.routing_number_masked;
      }
      map[key].accounts.push(r);
    }
    // Sort accounts within each group
    for (const k of Object.keys(map)) {
      map[k].accounts.sort(sortAccounts);
    }
    // Sort institutions alphabetically; "Unknown" always last
    return Object.entries(map).sort(([ka, va], [kb, vb]) => {
      if (ka === UNKNOWN_KEY) return 1;
      if (kb === UNKNOWN_KEY) return -1;
      return va.displayName.localeCompare(vb.displayName);
    });
  }, [records]);

  if (records.length === 0) return null;

  return (
    <div className="space-y-4">
      {grouped.map(([key, group]) => {
        const isCollapsed = !!collapsed[key];
        const isUnknown = key === UNKNOWN_KEY;
        return (
          <div key={key} className="rounded-3xl bg-white border border-stone-200 shadow-sm overflow-hidden">
            {/* Institution header */}
            <div className="p-4 bg-stone-50 border-b border-stone-100 flex items-start justify-between gap-3">
              <button
                onClick={() => setCollapsed((c) => ({ ...c, [key]: !isCollapsed }))}
                className="flex items-start gap-3 flex-1 min-w-0 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-navy-muted/10 flex items-center justify-center text-navy-muted shrink-0">
                  <Building2 size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className={`font-bold text-base ${isUnknown ? 'text-stone-500 italic' : 'text-navy-muted'} truncate`}>
                    {group.displayName}
                  </h3>
                  {group.routing && (
                    <p className="text-[11px] text-stone-500 mt-0.5">Routing: {group.routing}</p>
                  )}
                  <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold mt-1">
                    {group.accounts.length} {group.accounts.length === 1 ? 'account' : 'accounts'}
                  </p>
                </div>
                {isCollapsed ? <ChevronDown size={18} className="text-stone-400 mt-1.5 shrink-0" /> : <ChevronUp size={18} className="text-stone-400 mt-1.5 shrink-0" />}
              </button>
              {!isUnknown && (
                <button
                  onClick={() => onEditInstitution(group.displayName, group.routing || null)}
                  className="px-2 py-1 rounded-lg text-[11px] font-bold text-navy-muted hover:bg-stone-200 flex items-center gap-1 shrink-0"
                  aria-label={`Edit ${group.displayName}`}
                >
                  <Pencil size={12} />
                  Edit
                </button>
              )}
            </div>

            {/* Account cards */}
            {!isCollapsed && (
              <div className="p-4 space-y-3">
                {isUnknown && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium">
                    Add an institution name to organize {group.accounts.length === 1 ? 'this account' : 'these accounts'}.
                  </div>
                )}

                {group.accounts.map((record) => (
                  <RecordCard
                    key={record.id}
                    title={record.account_type || 'Account'}
                    subtitle={buildSubtitle(record.account_number_masked, record.joint_account_holder)}
                    subtitlePlaceholder="No account details added"
                    icon={getCategoryIcon('banking', record)}
                    badge={record.scope === 'shared' ? 'Shared' : undefined}
                    data={record}
                    onEdit={() => onAddClick(undefined, record)}
                    onDelete={() => handleDelete(record)}
                  />
                ))}

                {!isUnknown && (
                  <button
                    onClick={() =>
                      onAddClick(undefined, {
                        institution: group.displayName,
                        routing_number_masked: group.routing || '',
                        _lockedFields: ['institution'],
                      })
                    }
                    className="w-full py-3 border-2 border-dashed border-stone-200 rounded-2xl flex items-center justify-center gap-2 text-stone-500 hover:border-navy-muted hover:text-navy-muted transition-colors text-sm font-bold"
                  >
                    <Plus size={16} />
                    Add account at {group.displayName}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export const BankingSection = ({
  onAddClick,
  onRefresh,
}: {
  onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void;
  onRefresh?: (fn: () => void) => void;
}) => {
  const { currentPacket } = useAppContext();
  const [institutionSheetOpen, setInstitutionSheetOpen] = useState(false);
  const [institutionMode, setInstitutionMode] = useState<'create' | 'edit'>('create');
  const [editingInstitution, setEditingInstitution] = useState<{ name: string; routing?: string | null } | null>(null);
  const [allRecords, setAllRecords] = useState<any[]>([]);
  const refreshRef = React.useRef<() => void>(() => {});

  const existingInstitutionNames = useMemo(
    () => Array.from(new Set(allRecords.map((r) => (r.institution || '').trim()).filter(Boolean))),
    [allRecords]
  );

  const handleEditInstitution = (name: string, routing?: string | null) => {
    setEditingInstitution({ name, routing });
    setInstitutionMode('edit');
    setInstitutionSheetOpen(true);
  };

  const handleAddInstitution = () => {
    setEditingInstitution(null);
    setInstitutionMode('create');
    setInstitutionSheetOpen(true);
  };

  const handleInstitutionSaved = (institutionName: string, routing?: string | null, isNew?: boolean) => {
    if (institutionMode === 'create' || isNew) {
      // Open AddEditSheet with institution prefilled and locked, ready to add the first account
      onAddClick(undefined, {
        institution: institutionName,
        routing_number_masked: routing || '',
        _lockedFields: ['institution'],
      });
    } else {
      // Edit mode — refresh the list to reflect renamed/updated routing
      refreshRef.current?.();
    }
  };

  return (
    <>
      <SectionScreenTemplate
        onAddClick={(_file, data) => {
          // If invoked with a record (edit) or a prefill that already has an institution, pass through
          if (data && (data.id || data.institution || data._lockedFields)) {
            onAddClick(undefined, data);
            return;
          }
          // Otherwise the global "+" should open the add-institution flow
          handleAddInstitution();
        }}
        onRefresh={(fn) => {
          refreshRef.current = fn;
          onRefresh?.(fn);
        }}
      >
        {(records, _docs, refresh) => {
          // Track the latest records snapshot for duplicate detection
          if (records !== allRecords) {
            // Defer to avoid setState during render
            queueMicrotask(() => setAllRecords(records));
          }
          return (
            <BankingView
              records={records}
              refresh={refresh}
              onAddClick={onAddClick}
              onEditInstitution={handleEditInstitution}
            />
          );
        }}
      </SectionScreenTemplate>

      <InstitutionSheet
        isOpen={institutionSheetOpen}
        onClose={() => setInstitutionSheetOpen(false)}
        packetId={currentPacket?.id}
        mode={institutionMode}
        initialName={editingInstitution?.name || null}
        initialRouting={editingInstitution?.routing || null}
        existingInstitutions={existingInstitutionNames}
        onSaved={handleInstitutionSaved}
      />
    </>
  );
};
