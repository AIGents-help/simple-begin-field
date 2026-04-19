import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAppContext } from '../context/AppContext';
import { SectionScreenTemplate } from '../components/sections/SectionScreenTemplate';
import { List, GitBranch } from 'lucide-react';
import { CategoryOption } from '../components/upload/types';
import { FamilyTreeView } from '../components/family/FamilyTreeView';
import { SpouseProfileSheet } from '../components/family/SpouseProfileSheet';
import { AddFamilyMemberSheet } from '../components/family/AddFamilyMemberSheet';
import { SpouseCard } from '../components/family/cards/SpouseCard';
import { ParentCard } from '../components/family/cards/ParentCard';
import { ChildCard } from '../components/family/cards/ChildCard';
import { SiblingCard } from '../components/family/cards/SiblingCard';
import { GrandparentCard } from '../components/family/cards/GrandparentCard';
import { InLawCard } from '../components/family/cards/InLawCard';
import { OtherFamilyCard } from '../components/family/cards/OtherFamilyCard';
import { TemplateLauncher } from '../components/templates/TemplateLauncher';
import { groupRelationship, RELATIONSHIP_GROUPS, isMinorFromBirthday } from '../services/familyService';

type RelKey = 'spouse' | 'child' | 'parent' | 'sibling' | 'grandparent' | 'inlaw' | 'other' | 'grandchild';

const draftId = () => `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const cardForGroup = (group: string) => {
  switch (group) {
    case 'spouse': return SpouseCard;
    case 'child': return ChildCard;
    case 'parent': return ParentCard;
    case 'sibling': return SiblingCard;
    case 'grandparent': return GrandparentCard;
    case 'inlaw': return InLawCard;
    default: return OtherFamilyCard;
  }
};

export const FamilySection = ({
  onAddClick,
  onRefresh,
}: {
  onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void;
  onRefresh?: (fn: () => void) => void;
}) => {
  const { currentPacket, activeScope, bumpCompletion } = useAppContext();
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [spouseSheetOpen, setSpouseSheetOpen] = useState(false);
  const [editingSpouse, setEditingSpouse] = useState<any | null>(null);
  const [treeRefreshKey, setTreeRefreshKey] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const refreshRef = React.useRef<(() => void) | null>(null);

  // Local list of "draft" cards added inline that aren't in the DB yet.
  const [drafts, setDrafts] = useState<any[]>([]);

  const isSpouse = (record: any) =>
    /spouse|partner/i.test(record?.relationship || '');

  const handleAddPick = (relationship: string) => {
    setPickerOpen(false);
    if (relationship === 'Spouse') {
      // Use the existing rich spouse sheet
      setEditingSpouse(null);
      setSpouseSheetOpen(true);
      return;
    }
    // Create an inline draft card for the picked relationship
    const draft: any = {
      id: draftId(),
      packet_id: currentPacket?.id,
      scope: activeScope || 'shared',
      relationship,
      first_name: '',
      last_name: '',
      name: 'New family member',
    };
    setDrafts((d) => [draft, ...d]);
    setExpandedId(draft.id);
    // Scroll the new card into view
    setTimeout(() => {
      document.getElementById(`family-card-${draft.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleSaved = (saved: any, prevDraftId?: string) => {
    if (prevDraftId) setDrafts((d) => d.filter((x) => x.id !== prevDraftId));
    refreshRef.current?.();
    setTreeRefreshKey((k) => k + 1);
    bumpCompletion();
  };

  const handleDeleted = (id: string) => {
    setDrafts((d) => d.filter((x) => x.id !== id));
    refreshRef.current?.();
    setTreeRefreshKey((k) => k + 1);
    bumpCompletion();
    if (expandedId === id) setExpandedId(null);
  };

  const handleCancelDraft = (id: string) => {
    setDrafts((d) => d.filter((x) => x.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  return (
    <div>
      {/* View Toggle */}
      <div className="px-6 pt-2 pb-0">
        <div className="flex bg-stone-100 rounded-xl p-1 gap-1">
          <button
            onClick={() => setViewMode('list')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
              viewMode === 'list' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <List className="w-3 h-3" />
            List View
          </button>
          <button
            onClick={() => setViewMode('tree')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
              viewMode === 'tree' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <GitBranch className="w-3 h-3" />
            Tree View
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <SectionScreenTemplate
          onAddClick={(file, data) => {
            // Intercept relationship-prefilled adds from the recommendations row
            if (data?.relationship) {
              handleAddPick(data.relationship);
              return;
            }
            // Otherwise open the relationship picker
            setPickerOpen(true);
          }}
          onRefresh={(fn) => {
            refreshRef.current = fn;
            const wrapped = (newRecord?: any) => {
              fn(newRecord);
              setTreeRefreshKey((k) => k + 1);
            };
            if (onRefresh) onRefresh(wrapped);
          }}
        >
          {(records, _docs, refresh) => {
            // Merge real records + inline drafts; group by relationship type
            const all = [...drafts, ...records];
            const grouped: Record<string, any[]> = {};
            for (const r of all) {
              const g = groupRelationship(r);
              (grouped[g] = grouped[g] || []).push(r);
            }
            const hasMinorChild = records.some((r) => /child/i.test(r.relationship || '') && isMinorFromBirthday(r.birthday));

            return (
              <div className="space-y-6">
                {hasMinorChild && (
                  <TemplateLauncher
                    templateType="guardianship_nomination"
                    title="Name a guardian for your minor children"
                    description="The Guardianship Nomination Letter template walks you through naming a primary and alternate guardian, financial provisions, and care preferences."
                    buttonLabel="Open Guardianship Template"
                  />
                )}

                {RELATIONSHIP_GROUPS.map((group) => {
                  const list = grouped[group.key] || [];
                  if (list.length === 0) return null;
                  return (
                    <div key={group.key}>
                      <h3 className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2 px-1">
                        {group.label} <span className="text-stone-300">({list.length})</span>
                      </h3>
                      <div className="space-y-3">
                        {list.map((record) => {
                          if (group.key === 'spouse') {
                            const Card = SpouseCard;
                            return (
                              <div key={record.id} id={`family-card-${record.id}`}>
                                <Card
                                  record={record}
                                  packetId={currentPacket?.id}
                                  expanded={expandedId === record.id}
                                  onToggle={() => setExpandedId(expandedId === record.id ? null : record.id)}
                                  onSaved={handleSaved}
                                  onDeleted={(id: string) => { handleDeleted(id); refresh(); }}
                                  onCancelDraft={handleCancelDraft}
                                />
                              </div>
                            );
                          }
                          const Card = cardForGroup(group.key);
                          return (
                            <div key={record.id} id={`family-card-${record.id}`}>
                              <Card
                                record={record}
                                packetId={currentPacket?.id}
                                expanded={expandedId === record.id}
                                onToggle={() => setExpandedId(expandedId === record.id ? null : record.id)}
                                onSaved={handleSaved}
                                onDeleted={(id: string) => { handleDeleted(id); refresh(); }}
                                onCancelDraft={handleCancelDraft}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

              </div>
            );
          }}
        </SectionScreenTemplate>
      ) : (
        <div className="p-6 pb-32">
          <div className="mb-4">
            <h2 className="text-2xl font-serif font-bold text-navy-muted mb-1">Family Tree</h2>
            <p className="text-xs text-stone-500">Visual overview of your family connections.</p>
          </div>
          <FamilyTreeView
            refreshKey={treeRefreshKey}
            onAddMember={() => setPickerOpen(true)}
            onEditMember={(member) => {
              if (isSpouse(member)) {
                setEditingSpouse(member);
                setSpouseSheetOpen(true);
              } else {
                // Switch to list view, expand the matching card
                setViewMode('list');
                setExpandedId(member.id);
                setTimeout(() => {
                  document.getElementById(`family-card-${member.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
              }
            }}
          />
        </div>
      )}

      <AddFamilyMemberSheet
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={handleAddPick}
      />

      <SpouseProfileSheet
        isOpen={spouseSheetOpen}
        onClose={() => setSpouseSheetOpen(false)}
        spouse={editingSpouse}
        onSaved={() => {
          refreshRef.current?.();
          setTreeRefreshKey((k) => k + 1);
        }}
      />
    </div>
  );
};
