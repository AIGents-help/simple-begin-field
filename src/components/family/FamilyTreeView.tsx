import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Loader2, Pencil, Plus, Heart, Minus, Maximize2 } from 'lucide-react';
import { HavenOwlSvg } from '@/components/haven/HavenOwlSvg';
import { useAppContext } from '@/context/AppContext';
import { familyService } from '@/services/familyService';
import { uploadService } from '@/services/uploadService';
import { PersonAvatar } from '@/components/common/PersonAvatar';

interface FamilyMember {
  id: string;
  name: string;
  relationship: string | null;
  birthday: string | null;
  parent_member_id: string | null;
  is_deceased?: boolean | null;
  date_of_death?: string | null;
  category?: string | null; // e.g. "Maternal" / "Paternal" / "Mother" / "Father"
  marital_status?: string | null; // for spouses: married | separated | divorced | widowed
  [key: string]: any; // Allow full-row hydration
}

const HavenOwl = () => <HavenOwlSvg size={120} className="mx-auto" />;

// ── Node card dimensions ──
const NODE_W = 140;
const NODE_H = 130;
const AVATAR_SIZE = 48;
const H_GAP = 24;
const V_GAP = 70;

// Generation indices (lower = older generation)
const GEN = {
  GRANDPARENT: 0,
  PARENT: 1,
  USER: 2,
  CHILD: 3,
  GRANDCHILD: 4,
} as const;

type GenIndex = (typeof GEN)[keyof typeof GEN];

interface PositionedNode {
  id: string;
  member: FamilyMember | null; // null = the user (root)
  gen: GenIndex;
  side: 'left' | 'right' | 'center'; // for grandparents/parents grouping
  isUser?: boolean;
  isSpouse?: boolean;
  x?: number;
  y?: number;
}

// Classify a member into a generation row + side (for parents/grandparents)
function classify(member: FamilyMember): { gen: GenIndex; side: 'left' | 'right' | 'center'; isSpouse: boolean } | null {
  const rel = (member.relationship || '').toLowerCase().trim();
  const cat = (member.category || '').toLowerCase().trim();

  if (!rel) return null;

  // Spouse / partner — same row as user, right side
  if (['spouse', 'partner', 'husband', 'wife'].includes(rel)) {
    return { gen: GEN.USER, side: 'right', isSpouse: true };
  }

  // Siblings — same row as user
  if (['sibling', 'brother', 'sister', 'half-sibling', 'step-sibling'].includes(rel)) {
    return { gen: GEN.USER, side: 'left', isSpouse: false };
  }

  // Parents
  if (['parent', 'mother', 'father', 'mom', 'dad', 'step-parent', 'step parent', 'stepparent', 'adoptive parent'].includes(rel)) {
    // Mom => right, Dad => left (matches user's spec where Dad is left)
    const side: 'left' | 'right' =
      rel.includes('father') || rel.includes('dad') || cat.includes('father') || cat.includes('dad')
        ? 'left'
        : rel.includes('mother') || rel.includes('mom') || cat.includes('mother') || cat.includes('mom')
        ? 'right'
        : 'left';
    return { gen: GEN.PARENT, side, isSpouse: false };
  }

  // In-laws — parent generation, on spouse side (right)
  if (rel.includes('in-law') || rel.includes('in law') || ['mother-in-law', 'father-in-law'].includes(rel)) {
    return { gen: GEN.PARENT, side: 'right', isSpouse: false };
  }

  // Aunts / uncles — parent generation
  if (['aunt', 'uncle'].includes(rel)) {
    return { gen: GEN.PARENT, side: 'left', isSpouse: false };
  }

  // Grandparents
  if (rel.includes('grandparent') || rel.includes('grandmother') || rel.includes('grandfather') || rel.includes('grandma') || rel.includes('grandpa')) {
    const side: 'left' | 'right' =
      cat.includes('paternal') || rel.includes('paternal') ? 'left' :
      cat.includes('maternal') || rel.includes('maternal') ? 'right' :
      'left';
    return { gen: GEN.GRANDPARENT, side, isSpouse: false };
  }

  // Children
  if (['child', 'son', 'daughter', 'step-child', 'stepchild', 'adopted child'].includes(rel)) {
    return { gen: GEN.CHILD, side: 'center', isSpouse: false };
  }

  // Grandchildren
  if (['grandchild', 'grandson', 'granddaughter'].includes(rel)) {
    return { gen: GEN.GRANDCHILD, side: 'center', isSpouse: false };
  }

  // Cousins, nieces, nephews — fall back to user's row, left side
  if (['cousin', 'niece', 'nephew', 'other'].includes(rel)) {
    return { gen: GEN.USER, side: 'left', isSpouse: false };
  }

  // Unknown — same generation as user, left
  return { gen: GEN.USER, side: 'left', isSpouse: false };
}

interface FamilyTreeViewProps {
  onEditMember?: (member: any) => void;
  onAddMember?: (parentId?: string) => void;
  /**
   * Bumping this number forces the tree to re-fetch family members from the
   * database. The parent component should increment it after any save/delete
   * so the tree never shows stale data.
   */
  refreshKey?: number;
}

const validYear = (raw: string | null | undefined): string => {
  if (!raw || raw.startsWith('0000-') || raw.startsWith('0001-')) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  return y >= 1900 ? y.toString() : '';
};

export const FamilyTreeView = ({ onEditMember, onAddMember, refreshKey = 0 }: FamilyTreeViewProps) => {
  const { currentPacket } = useAppContext();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasCenteredRef = useRef(false);
  const pinchRef = useRef<{ startDist: number; startZoom: number } | null>(null);
  const [showScrollHint, setShowScrollHint] = useState(false);

  const clampZoom = (z: number) => Math.min(2, Math.max(0.3, z));

  // Show one-time scroll hint when tree overflows (session-scoped)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = scrollRef.current;
    if (!el) return;
    const seen = sessionStorage.getItem('familyTreeHintSeen');
    if (seen) return;
    const overflows = el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight;
    if (!overflows) return;
    setShowScrollHint(true);
    sessionStorage.setItem('familyTreeHintSeen', '1');
    const t = setTimeout(() => setShowScrollHint(false), 3000);
    return () => clearTimeout(t);
  }, [members.length]);

  // Wheel zoom (ctrl/meta + wheel) and shift-wheel horizontal scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoom((z) => clampZoom(z - e.deltaY * 0.002));
        return;
      }
      if (e.shiftKey && e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Pinch-to-zoom on touch
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const dist = (t: TouchList) => {
      const dx = t[0].clientX - t[1].clientX;
      const dy = t[0].clientY - t[1].clientY;
      return Math.hypot(dx, dy);
    };
    const onStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinchRef.current = { startDist: dist(e.touches), startZoom: zoom };
      }
    };
    const onMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchRef.current) {
        e.preventDefault();
        const d = dist(e.touches);
        const ratio = d / pinchRef.current.startDist;
        setZoom(clampZoom(pinchRef.current.startZoom * ratio));
      }
    };
    const onEnd = () => { pinchRef.current = null; };
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd);
    el.addEventListener('touchcancel', onEnd);
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onEnd);
    };
  }, [zoom]);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!currentPacket?.id) return;
      setLoading(true);
      const { data } = await familyService.list(currentPacket.id);
      setMembers((data as any[]) || []);
      setLoading(false);
    };
    void fetchMembers();
  }, [currentPacket?.id, refreshKey]);

  // Initial mobile zoom-out + auto-center on user once members load
  useEffect(() => {
    if (loading || members.length === 0 || hasCenteredRef.current) return;
    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) setZoom(0.7);
    hasCenteredRef.current = true;
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollLeft = Math.max(0, (el.scrollWidth - el.clientWidth) / 2);
    });
  }, [loading, members.length]);

  const rootName = currentPacket?.person_a_name || 'You';

  // Build positioned nodes grouped by generation
  const { nodes, connections, svgW, svgH } = useMemo(() => {
    const userNode: PositionedNode = {
      id: '__user__',
      member: null,
      gen: GEN.USER,
      side: 'center',
      isUser: true,
    };

    // Bucket by generation + side
    const buckets: Record<GenIndex, { left: PositionedNode[]; center: PositionedNode[]; right: PositionedNode[] }> = {
      [GEN.GRANDPARENT]: { left: [], center: [], right: [] },
      [GEN.PARENT]: { left: [], center: [], right: [] },
      [GEN.USER]: { left: [], center: [userNode], right: [] },
      [GEN.CHILD]: { left: [], center: [], right: [] },
      [GEN.GRANDCHILD]: { left: [], center: [], right: [] },
    };

    let spouseNode: PositionedNode | null = null;

    for (const m of members) {
      const c = classify(m);
      if (!c) continue;
      const node: PositionedNode = {
        id: m.id,
        member: m,
        gen: c.gen,
        side: c.side,
        isSpouse: c.isSpouse,
      };
      if (c.isSpouse && !spouseNode) {
        spouseNode = node;
        buckets[GEN.USER].right.push(node);
      } else {
        buckets[c.gen][c.side].push(node);
      }
    }

    // Assemble each generation row in order: left → center → right
    const rows: PositionedNode[][] = [];
    for (let g = 0 as GenIndex; g <= 4; g = (g + 1) as GenIndex) {
      const b = buckets[g];
      const row = [...b.left, ...b.center, ...b.right];
      if (row.length > 0) rows.push(row);
    }

    // Compute width of widest row
    const rowWidths = rows.map((r) => r.length * NODE_W + (r.length - 1) * H_GAP);
    const maxRowW = Math.max(...rowWidths, NODE_W);
    const padding = 32;
    const totalW = maxRowW + padding * 2;
    const totalH = rows.length * NODE_H + (rows.length - 1) * V_GAP + padding * 2;

    // Position each node — center each row inside totalW
    const positioned: PositionedNode[] = [];
    rows.forEach((row, rowIdx) => {
      const rowW = row.length * NODE_W + (row.length - 1) * H_GAP;
      const startX = (totalW - rowW) / 2;
      const y = padding + rowIdx * (NODE_H + V_GAP);
      row.forEach((n, i) => {
        const x = startX + i * (NODE_W + H_GAP);
        positioned.push({ ...n, x, y });
      });
    });

    // Build connections
    const conns: Array<{ from: PositionedNode; to: PositionedNode; type: 'parent' | 'spouse' | 'sibling' }> = [];

    const userPositioned = positioned.find((n) => n.isUser);
    const spousePositioned = spouseNode ? positioned.find((n) => n.id === spouseNode!.id) : null;
    const parents = positioned.filter((n) => n.gen === GEN.PARENT && !n.isSpouse);
    const grandparents = positioned.filter((n) => n.gen === GEN.GRANDPARENT);
    const siblings = positioned.filter((n) => n.gen === GEN.USER && !n.isUser && !n.isSpouse);
    const children = positioned.filter((n) => n.gen === GEN.CHILD);
    const grandchildren = positioned.filter((n) => n.gen === GEN.GRANDCHILD);

    // Spouse connector (horizontal heart line)
    if (userPositioned && spousePositioned) {
      conns.push({ from: userPositioned, to: spousePositioned, type: 'spouse' });
    }

    // Parents → User
    if (userPositioned) {
      parents.forEach((p) => conns.push({ from: p, to: userPositioned, type: 'parent' }));
    }

    // Grandparents → Parents (best-effort: paternal grandparents to dad-side parents, maternal to mom-side)
    grandparents.forEach((gp) => {
      const matchSide = parents.find((p) => p.side === gp.side);
      if (matchSide) conns.push({ from: gp, to: matchSide, type: 'parent' });
    });

    // Siblings → share parents (draw bracket from parents row down to each sibling)
    if (parents.length > 0) {
      siblings.forEach((s) => {
        // Connect to first parent for visual continuity
        conns.push({ from: parents[0], to: s, type: 'sibling' });
      });
    }

    // Children → User (and spouse if present)
    children.forEach((c) => {
      if (userPositioned) conns.push({ from: userPositioned, to: c, type: 'parent' });
    });

    // Grandchildren → first child as default (no parent_member_id wiring yet for grand-gen)
    if (children.length > 0) {
      grandchildren.forEach((gc) => {
        conns.push({ from: children[0], to: gc, type: 'parent' });
      });
    }

    return { nodes: positioned, connections: conns, svgW: totalW, svgH: totalH };
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

  return (
    <div className="relative">
      {/* Zoom controls */}
      <div className="flex items-center gap-2 mb-2 justify-end">
        <button
          onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
          className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-700 hover:bg-stone-200"
          aria-label="Zoom out"
        >
          <Minus size={14} />
        </button>
        <span className="text-xs font-semibold text-stone-500 tabular-nums w-10 text-center">{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
          className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-700 hover:bg-stone-200"
          aria-label="Zoom in"
        >
          <Plus size={14} />
        </button>
        <button
          onClick={() => setZoom(1)}
          className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-700 hover:bg-stone-200"
          aria-label="Reset zoom"
        >
          <Maximize2 size={12} />
        </button>
      </div>

      <div className="relative">
        {showScrollHint && (
          <div className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-full bg-navy-muted/90 text-white text-xs font-semibold shadow-lg animate-fade-in md:hidden">
            ← Scroll to explore →
          </div>
        )}
        <div
          ref={scrollRef}
          className="overflow-x-auto overflow-y-auto pb-4 -mx-6 px-6 overscroll-contain"
          style={{
            maxHeight: '70vh',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-x pan-y pinch-zoom',
            scrollbarWidth: 'thin',
          }}
        >
        <div
          style={{
            width: svgW * zoom,
            height: svgH * zoom,
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            touchAction: 'none',
          }}
        >
          <svg width={svgW} height={svgH} className="block">
            {/* Connectors */}
            {connections.map((c, idx) => {
              const fx = (c.from.x ?? 0) + NODE_W / 2;
              const fy = (c.from.y ?? 0) + NODE_H;
              const tx = (c.to.x ?? 0) + NODE_W / 2;
              const ty = c.to.y ?? 0;

              if (c.type === 'spouse') {
                // Horizontal line between user and spouse with heart icon midpoint
                const y = (c.from.y ?? 0) + NODE_H / 2;
                const x1 = (c.from.x ?? 0) + NODE_W;
                const x2 = c.to.x ?? 0;
                const midX = (x1 + x2) / 2;
                return (
                  <g key={`conn-${idx}`}>
                    <line x1={x1} y1={y} x2={x2} y2={y} stroke="#c9a84c" strokeWidth={2} />
                    <line x1={x1} y1={y - 4} x2={x2} y2={y - 4} stroke="#c9a84c" strokeWidth={1} opacity={0.5} />
                    <circle cx={midX} cy={y} r={10} fill="#fff" stroke="#c9a84c" strokeWidth={1.5} />
                    <foreignObject x={midX - 7} y={y - 7} width={14} height={14}>
                      <Heart size={14} color="#e11d48" fill="#e11d48" />
                    </foreignObject>
                  </g>
                );
              }

              // Parent / sibling vertical-orthogonal connector
              const midY = fy + (ty - fy) / 2;
              return (
                <path
                  key={`conn-${idx}`}
                  d={`M${fx},${fy} L${fx},${midY} L${tx},${midY} L${tx},${ty}`}
                  stroke={c.type === 'sibling' ? '#9ca3af' : '#c9a84c'}
                  strokeWidth={c.type === 'sibling' ? 1.5 : 2}
                  strokeDasharray={c.type === 'sibling' ? '4 3' : undefined}
                  fill="none"
                  opacity={0.6}
                />
              );
            })}

            {/* Node cards */}
            {nodes.map((n) => {
              const x = n.x ?? 0;
              const y = n.y ?? 0;
              const member = n.member;
              const isUser = !!n.isUser;
              const deceased = !isUser && !!member?.is_deceased;
              const name = isUser ? rootName : member?.name || '';
              // Relabel spouses based on marital status so the tree never shows
              // a divorced/widowed person as a current "Spouse".
              const rawRel = isUser ? 'You' : member?.relationship || '';
              const status = (member?.marital_status || '').toLowerCase();
              const isSpouseLike = ['spouse', 'partner', 'husband', 'wife'].includes(rawRel.toLowerCase());
              const label = isUser
                ? 'You'
                : isSpouseLike && (status === 'divorced' || status === 'separated')
                ? 'Ex-Spouse'
                : isSpouseLike && status === 'widowed'
                ? 'Widowed'
                : rawRel;
              const year = validYear(member?.birthday);
              const deathYear = validYear(member?.date_of_death);
              const fillColor = isUser ? '#0f1d3a' : deceased ? '#6b7280' : '#1a2744';
              const strokeColor = isUser ? '#c9a84c' : 'transparent';
              const displayName = (deceased ? '† ' : '') + name;

              return (
                <g key={n.id} opacity={deceased ? 0.75 : 1}>
                  <rect
                    x={x}
                    y={y}
                    width={NODE_W}
                    height={NODE_H}
                    rx={12}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={isUser ? 2 : 0}
                  />
                  {/* Avatar (photo or monogram) */}
                  <foreignObject
                    x={x + (NODE_W - AVATAR_SIZE) / 2}
                    y={y + 10}
                    width={AVATAR_SIZE}
                    height={AVATAR_SIZE}
                  >
                    <PersonAvatar
                      photoPath={isUser ? null : member?.photo_path}
                      name={name}
                      isDeceased={deceased}
                      size={AVATAR_SIZE}
                      ring={isUser}
                    />
                  </foreignObject>
                  {deceased && (
                    <text
                      x={x + NODE_W / 2 + AVATAR_SIZE / 2 - 4}
                      y={y + 18}
                      fill="#c9a84c"
                      fontSize="14"
                      fontWeight="700"
                      fontFamily="inherit"
                    >
                      †
                    </text>
                  )}
                  <text
                    x={x + NODE_W / 2}
                    y={y + 10 + AVATAR_SIZE + 16}
                    textAnchor="middle"
                    fill="white"
                    fontSize="12"
                    fontWeight="700"
                    fontFamily="inherit"
                  >
                    {name.length > 16 ? name.slice(0, 15) + '…' : name}
                  </text>
                  <text
                    x={x + NODE_W / 2}
                    y={y + 10 + AVATAR_SIZE + 32}
                    textAnchor="middle"
                    fill={deceased ? '#d4d4d4' : '#c9a84c'}
                    fontSize="10"
                    fontWeight="600"
                    fontFamily="inherit"
                  >
                    {label}
                  </text>
                  {(year || deathYear) && (
                    <text
                      x={x + NODE_W / 2}
                      y={y + 10 + AVATAR_SIZE + 46}
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
                  {!isUser && (
                    <g
                      className="cursor-pointer"
                      onClick={() => onEditMember?.(member)}
                      role="button"
                    >
                      <circle cx={x + NODE_W - 12} cy={y + 12} r={10} fill="#2a3a5c" />
                      <foreignObject x={x + NODE_W - 19} y={y + 5} width={14} height={14}>
                        <Pencil size={10} color="#c9a84c" />
                      </foreignObject>
                    </g>
                  )}
                  {/* Tap target overlay */}
                  {!isUser && (
                    <rect
                      x={x}
                      y={y}
                      width={NODE_W}
                      height={NODE_H}
                      fill="transparent"
                      className="cursor-pointer"
                      onClick={() => onEditMember?.(member)}
                    />
                  )}
                </g>
              );
            })}
          </svg>
        </div>
        </div>
      </div>

      {/* Floating add button */}
      <button
        onClick={() => onAddMember?.()}
        className="fixed bottom-24 right-6 z-30 w-14 h-14 bg-navy-muted text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
        aria-label="Add family member"
      >
        <Plus size={24} />
      </button>
    </div>
  );
};
