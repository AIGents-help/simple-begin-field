import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Loader2, Pencil, Plus } from 'lucide-react';
import { HavenOwlSvg } from '@/components/haven/HavenOwlSvg';
import { useAppContext } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';

interface FamilyMember {
  id: string;
  name: string;
  relationship: string | null;
  birthday: string | null;
  parent_member_id: string | null;
  is_deceased?: boolean | null;
  date_of_death?: string | null;
}

interface TreeNode {
  member: FamilyMember | null; // null = root (user)
  children: TreeNode[];
}

const HavenOwl = () => <HavenOwlSvg size={120} className="mx-auto" />;

// ── Node card dimensions ──
const NODE_W = 140;
const NODE_H = 68;
const H_GAP = 24;
const V_GAP = 60;

// ── Recursively compute subtree width ──
function subtreeWidth(node: TreeNode): number {
  if (node.children.length === 0) return NODE_W;
  const childrenW = node.children.reduce((sum, c) => sum + subtreeWidth(c), 0);
  return Math.max(NODE_W, childrenW + H_GAP * (node.children.length - 1));
}

// ── Layout positions for each node ──
interface LayoutNode {
  node: TreeNode;
  x: number;
  y: number;
}

function layoutTree(node: TreeNode, x: number, y: number): LayoutNode[] {
  const result: LayoutNode[] = [{ node, x, y }];
  if (node.children.length === 0) return result;

  const totalW = node.children.reduce((s, c) => s + subtreeWidth(c), 0) + H_GAP * (node.children.length - 1);
  let cx = x - totalW / 2;

  for (const child of node.children) {
    const w = subtreeWidth(child);
    const childX = cx + w / 2;
    const childY = y + NODE_H + V_GAP;
    result.push(...layoutTree(child, childX, childY));
    cx += w + H_GAP;
  }
  return result;
}

interface FamilyTreeViewProps {
  onEditMember?: (member: any) => void;
  onAddMember?: (parentId?: string) => void;
}

export const FamilyTreeView = ({ onEditMember, onAddMember }: FamilyTreeViewProps) => {
  const { currentPacket, activeScope } = useAppContext();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetch = async () => {
      if (!currentPacket) return;
      setLoading(true);
      const { data } = await supabase
        .from('family_members')
        .select('id, name, relationship, birthday, parent_member_id, is_deceased, date_of_death')
        .eq('packet_id', currentPacket.id)
        .order('created_at', { ascending: true });
      setMembers((data as any[]) || []);
      setLoading(false);
    };
    fetch();
  }, [currentPacket]);

  // Build tree
  const tree = useMemo<TreeNode>(() => {
    const root: TreeNode = { member: null, children: [] };
    const nodeMap = new Map<string, TreeNode>();

    // Create a TreeNode for each member
    for (const m of members) {
      nodeMap.set(m.id, { member: m, children: [] });
    }

    // Wire children
    for (const m of members) {
      const tn = nodeMap.get(m.id)!;
      if (m.parent_member_id && nodeMap.has(m.parent_member_id)) {
        nodeMap.get(m.parent_member_id)!.children.push(tn);
      } else {
        root.children.push(tn);
      }
    }
    return root;
  }, [members]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-navy-muted mb-4" size={32} />
        <p className="text-stone-500 text-sm">Loading family tree...</p>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 bg-white rounded-3xl border border-stone-100 shadow-sm text-center">
        <HavenOwl />
        <h3 className="text-lg font-bold text-navy-muted mt-4 mb-2">Your family tree starts here</h3>
        <p className="text-sm text-stone-500 mb-6">Add your first family member to begin.</p>
        <button
          onClick={() => onAddMember?.()}
          className="px-6 py-3 bg-navy-muted text-white rounded-xl font-bold text-sm flex items-center gap-2"
        >
          <Plus size={18} />
          Add Family Member
        </button>
      </div>
    );
  }

  // Layout
  const rootName = currentPacket?.person_a_name || 'You';
  const rootX = 0;
  const rootY = 0;

  // Root layout node
  const layoutNodes = layoutTree(tree, rootX, rootY);

  // The first node is the virtual root (user). Replace it with the user node.
  // Compute bounding box
  let minX = Infinity, maxX = -Infinity, maxY = 0;
  for (const ln of layoutNodes) {
    if (ln.x - NODE_W / 2 < minX) minX = ln.x - NODE_W / 2;
    if (ln.x + NODE_W / 2 > maxX) maxX = ln.x + NODE_W / 2;
    if (ln.y + NODE_H > maxY) maxY = ln.y + NODE_H;
  }

  const padding = 20;
  const svgW = maxX - minX + padding * 2;
  const svgH = maxY + padding * 2;
  const offsetX = -minX + padding;
  const offsetY = padding;

  return (
    <div className="relative">
      <div ref={scrollRef} className="overflow-x-auto pb-4 -mx-6 px-6">
        <svg width={svgW} height={svgH} className="block mx-auto" style={{ minWidth: svgW }}>
          {/* Connector lines */}
          {layoutNodes.map((ln) => {
            if (!ln.node.children.length) return null;
            const px = ln.x + offsetX;
            const py = ln.y + offsetY + NODE_H;
            return ln.node.children.map((child) => {
              const childLn = layoutNodes.find(l => l.node === child);
              if (!childLn) return null;
              const cx = childLn.x + offsetX;
              const cy = childLn.y + offsetY;
              const midY = py + (cy - py) / 2;
              return (
                <path
                  key={`line-${child.member?.id}`}
                  d={`M${px},${py} L${px},${midY} L${cx},${midY} L${cx},${cy}`}
                  stroke="#c9a84c"
                  strokeWidth="2"
                  fill="none"
                  opacity="0.6"
                />
              );
            });
          })}

          {/* Node cards */}
          {layoutNodes.map((ln, i) => {
            const nx = ln.x + offsetX - NODE_W / 2;
            const ny = ln.y + offsetY;
            const isRoot = i === 0;
            const member = ln.node.member;
            const deceased = !isRoot && !!member?.is_deceased;
            const name = isRoot ? rootName : member?.name || '';
            const label = isRoot ? 'You' : member?.relationship || '';
            const validYear = (raw: string | null | undefined): string => {
              if (!raw || raw.startsWith('0000-') || raw.startsWith('0001-')) return '';
              const d = new Date(raw);
              if (isNaN(d.getTime())) return '';
              const y = d.getFullYear();
              return y >= 1900 ? y.toString() : '';
            };
            const year = validYear(member?.birthday);
            const deathYear = validYear(member?.date_of_death);
            const fillColor = deceased ? '#6b7280' : '#1a2744';
            const nameOpacity = deceased ? 0.7 : 1;
            const displayName = (deceased ? '† ' : '') + name;

            return (
              <g key={isRoot ? 'root' : member?.id} opacity={deceased ? 0.75 : 1}>
                <rect
                  x={nx}
                  y={ny}
                  width={NODE_W}
                  height={NODE_H}
                  rx={12}
                  fill={fillColor}
                />
                {/* Name */}
                <text
                  x={nx + NODE_W / 2}
                  y={ny + 22}
                  textAnchor="middle"
                  fill="white"
                  fontSize="12"
                  fontWeight="700"
                  fontFamily="inherit"
                  opacity={nameOpacity}
                >
                  {displayName.length > 16 ? displayName.slice(0, 15) + '…' : displayName}
                </text>
                {/* Relationship label */}
                <text
                  x={nx + NODE_W / 2}
                  y={ny + 38}
                  textAnchor="middle"
                  fill={deceased ? '#d4d4d4' : '#c9a84c'}
                  fontSize="10"
                  fontWeight="600"
                  fontFamily="inherit"
                >
                  {label}
                </text>
                {/* Birth / death years */}
                {(year || deathYear) && (
                  <text
                    x={nx + NODE_W / 2}
                    y={ny + 52}
                    textAnchor="middle"
                    fill="#bbbbbb"
                    fontSize="9"
                    fontFamily="inherit"
                  >
                    {year && `b. ${year}`}
                    {year && deathYear && '  '}
                    {deathYear && `d. ${deathYear}`}
                  </text>
                )}
                {/* Edit button (not on root) */}
                {!isRoot && (
                  <g
                    className="cursor-pointer"
                    onClick={() => onEditMember?.(ln.node.member)}
                    role="button"
                  >
                    <circle cx={nx + NODE_W - 8} cy={ny + 8} r={10} fill="#2a3a5c" />
                    <foreignObject x={nx + NODE_W - 15} y={ny + 1} width={14} height={14}>
                      <Pencil size={10} color="#c9a84c" />
                    </foreignObject>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Floating add button */}
      <button
        onClick={() => onAddMember?.()}
        className="fixed bottom-24 right-6 z-30 w-14 h-14 bg-navy-muted text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
      >
        <Plus size={24} />
      </button>
    </div>
  );
};
