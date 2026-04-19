import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Loader2, Pencil, Plus, Heart, Minus, Maximize2 } from 'lucide-react';
import { HavenOwlSvg } from '@/components/haven/HavenOwlSvg';
import { useAppContext } from '@/context/AppContext';
import { familyService } from '@/services/familyService';
import { PersonAvatar } from '@/components/common/PersonAvatar';

/**
 * FamilyTreeView — generational layout with full support for:
 *   • Multiple ex-spouses, each with their own children grouping
 *   • Current spouse with their own children + step-children
 *   • Bloodline (solid) vs step / ex (dashed) connectors
 *   • Grandparents, parents, in-laws, siblings, grandchildren
 *
 * Reads existing family_members fields only — no schema changes:
 *   relationship, marital_status, divorce_finalized, related_to_spouse_id,
 *   parent_member_id, parent_side, category, is_deceased, photo_path, etc.
 */

interface FamilyMember {
  id: string;
  name: string;
  relationship: string | null;
  birthday: string | null;
  parent_member_id: string | null;
  related_to_spouse_id?: string | null;
  is_deceased?: boolean | null;
  date_of_death?: string | null;
  category?: string | null;
  marital_status?: string | null;
  divorce_finalized?: boolean | null;
  relationship_subtype?: string | null;
  parent_side?: string | null;
  inlaw_subtype?: string | null;
  photo_path?: string | null;
  [key: string]: any;
}

const HavenOwl = () => <HavenOwlSvg size={120} className="mx-auto" />;

// ── Node + layout dimensions ──
const NODE_W = 140;
const NODE_H = 130;
const AVATAR_SIZE = 48;
const H_GAP = 28;          // gap between siblings inside a row
const UNION_GAP = 56;      // gap between distinct unions on the user row
const V_GAP = 80;
const PAD = 40;

// Generation indices (lower = older generation)
const GEN = {
  GRANDPARENT: 0,
  PARENT: 1,
  USER: 2,
  CHILD: 3,
  GRANDCHILD: 4,
} as const;
type GenIndex = (typeof GEN)[keyof typeof GEN];

type SpouseKind = 'current' | 'ex';

interface Node {
  id: string;
  member: FamilyMember | null;
  kind:
    | 'user'
    | 'spouse'
    | 'parent'
    | 'inlaw'
    | 'grandparent'
    | 'sibling'
    | 'child'
    | 'grandchild'
    | 'other';
  spouseKind?: SpouseKind;
  childKind?: 'bio' | 'step' | 'adopted';
  side?: 'left' | 'right' | 'center';
  // Which spouse-id this child belongs to ("__user_only__" if owner-only).
  unionKey?: string;
  // Layout
  x?: number;
  y?: number;
  deceased?: boolean;
}

const validYear = (raw: string | null | undefined): string => {
  if (!raw || raw.startsWith('0000-') || raw.startsWith('0001-')) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  return y >= 1900 ? y.toString() : '';
};

const isSpouseRel = (r?: string | null) =>
  ['spouse', 'partner', 'husband', 'wife'].includes((r || '').toLowerCase().trim());

const isChildRel = (r?: string | null) => {
  const s = (r || '').toLowerCase().trim();
  return ['child', 'son', 'daughter', 'step-child', 'stepchild', 'step child', 'adopted child'].includes(s);
};

const childKindFor = (m: FamilyMember): 'bio' | 'step' | 'adopted' => {
  const r = (m.relationship || '').toLowerCase();
  const sub = (m.relationship_subtype || '').toLowerCase();
  if (r.includes('step') || sub.includes('step')) return 'step';
  if (r.includes('adopt') || sub.includes('adopt')) return 'adopted';
  return 'bio';
};

const spouseKindFor = (m: FamilyMember): SpouseKind => {
  const status = (m.marital_status || '').toLowerCase();
  if (status === 'divorced' || status === 'separated' || m.divorce_finalized === true) return 'ex';
  // Some users may type "ex" into the relationship text
  const rel = (m.relationship || '').toLowerCase();
  if (rel.includes('ex')) return 'ex';
  return 'current';
};

interface FamilyTreeViewProps {
  onEditMember?: (member: any) => void;
  onAddMember?: (parentId?: string) => void;
  refreshKey?: number;
}

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

  // One-time scroll hint when tree overflows (mobile)
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
      if (e.touches.length === 2) pinchRef.current = { startDist: dist(e.touches), startZoom: zoom };
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

  // Initial mobile zoom-out + auto-center
  useEffect(() => {
    if (loading || members.length === 0 || hasCenteredRef.current) return;
    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) setZoom(0.6);
    hasCenteredRef.current = true;
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollLeft = Math.max(0, (el.scrollWidth - el.clientWidth) / 2);
    });
  }, [loading, members.length]);

  const rootName = currentPacket?.person_a_name || 'You';

  // ─── BUILD LAYOUT ────────────────────────────────────────────────────────
  const { nodes, connections, unionAnchors, svgW, svgH } = useMemo(() => {
    const userNode: Node = { id: '__user__', member: null, kind: 'user' };

    // Bucket members
    const spouses: Node[] = [];           // includes current + ex
    const parents: Node[] = [];
    const inlaws: Node[] = [];
    const grandparents: Node[] = [];
    const siblings: Node[] = [];
    const childrenAll: Node[] = [];
    const grandchildren: Node[] = [];

    for (const m of members) {
      const rel = (m.relationship || '').toLowerCase().trim();
      const deceased = !!m.is_deceased;

      if (isSpouseRel(rel)) {
        spouses.push({ id: m.id, member: m, kind: 'spouse', spouseKind: spouseKindFor(m), deceased });
        continue;
      }
      if (isChildRel(rel)) {
        childrenAll.push({
          id: m.id, member: m, kind: 'child',
          childKind: childKindFor(m), deceased,
        });
        continue;
      }
      if (['grandchild', 'grandson', 'granddaughter'].includes(rel)) {
        grandchildren.push({ id: m.id, member: m, kind: 'grandchild', deceased });
        continue;
      }
      if (['sibling', 'brother', 'sister', 'half-sibling', 'step-sibling'].includes(rel)) {
        siblings.push({ id: m.id, member: m, kind: 'sibling', deceased });
        continue;
      }
      if (['parent', 'mother', 'father', 'mom', 'dad', 'step-parent', 'step parent', 'stepparent', 'adoptive parent'].includes(rel)) {
        const cat = (m.category || '').toLowerCase();
        const side: 'left' | 'right' =
          rel.includes('father') || rel.includes('dad') || cat.includes('father') ? 'left' :
          rel.includes('mother') || rel.includes('mom') || cat.includes('mother') ? 'right' : 'left';
        parents.push({ id: m.id, member: m, kind: 'parent', side, deceased });
        continue;
      }
      if (rel.includes('in-law') || rel.includes('in law')) {
        inlaws.push({ id: m.id, member: m, kind: 'inlaw', side: 'right', deceased });
        continue;
      }
      if (rel.includes('grandparent') || rel.includes('grandmother') || rel.includes('grandfather') || rel.includes('grandma') || rel.includes('grandpa')) {
        const cat = (m.category || '').toLowerCase();
        const side: 'left' | 'right' =
          cat.includes('paternal') || rel.includes('paternal') ? 'left' :
          cat.includes('maternal') || rel.includes('maternal') ? 'right' : 'left';
        grandparents.push({ id: m.id, member: m, kind: 'grandparent', side, deceased });
        continue;
      }
    }

    // Order spouses: ex (left, oldest first), current (right of user)
    const exSpouses = spouses.filter(s => s.spouseKind === 'ex');
    const currentSpouses = spouses.filter(s => s.spouseKind === 'current');

    // Children → assign each to a "union" (which spouse co-parents with the user)
    // Heuristic, using only existing fields:
    //   • related_to_spouse_id matches a spouse → that union
    //   • child labelled "step-child" AND a current spouse exists → step under current spouse
    //   • otherwise → owner-only union
    const USER_ONLY = '__user_only__';
    const childUnion = (c: Node): string => {
      const m = c.member!;
      if (m.related_to_spouse_id) {
        const sp = spouses.find(s => s.id === m.related_to_spouse_id);
        if (sp) return sp.id;
      }
      if (c.childKind === 'step' && currentSpouses[0]) return currentSpouses[0].id;
      return USER_ONLY;
    };

    // Group children by union, in display order: ex unions (left) → user-only → current
    const unionOrder: string[] = [
      ...exSpouses.map(s => s.id),
      USER_ONLY,
      ...currentSpouses.map(s => s.id),
    ];
    const childrenByUnion: Record<string, Node[]> = {};
    for (const c of childrenAll) {
      const k = childUnion(c);
      c.unionKey = k;
      (childrenByUnion[k] = childrenByUnion[k] || []).push(c);
    }

    // ─── ROW 3 (USER ROW) X-LAYOUT ──────────────────────────────────────────
    // Order on user row, left → right:
    //   [ex N] ... [ex 1]  [USER]  [current 1]  [ex from right side?]
    // Per spec: ex-spouses offset away from current spouse. We'll place all
    // exes on the LEFT of the user, current spouse(s) on the RIGHT.
    const userRowLeft: Node[] = [...exSpouses].reverse(); // closest ex sits next to user
    const userRowCenter: Node[] = [userNode];
    const userRowRight: Node[] = [...currentSpouses];

    // Position user-row nodes
    const userRow = [...userRowLeft, ...userRowCenter, ...userRowRight];
    const userRowWidth = userRow.length * NODE_W + (userRow.length - 1) * H_GAP;

    // ─── CHILD ROW LAYOUT ───────────────────────────────────────────────────
    // For each union (in unionOrder), render a horizontal cluster of children.
    // Cluster is centered under the midpoint of its parent pair.
    const presentUnions = unionOrder.filter((k) => (childrenByUnion[k] || []).length > 0);
    const unionWidth = (k: string) => {
      const list = childrenByUnion[k] || [];
      return Math.max(NODE_W, list.length * NODE_W + (list.length - 1) * H_GAP);
    };
    const totalChildWidth = presentUnions.reduce(
      (sum, k, i) => sum + unionWidth(k) + (i > 0 ? UNION_GAP : 0),
      0,
    );

    // Sibling row: place siblings to the left of user row, on same Y
    const sibWidth = siblings.length > 0
      ? siblings.length * NODE_W + (siblings.length - 1) * H_GAP + UNION_GAP
      : 0;

    // Parent row width = parents + inlaws (with separator gap if both present)
    const parentRowMembers = [...parents, ...inlaws];
    const parentRowWidth = parentRowMembers.length > 0
      ? parentRowMembers.length * NODE_W + (parentRowMembers.length - 1) * H_GAP
      : 0;

    const grandRowWidth = grandparents.length > 0
      ? grandparents.length * NODE_W + (grandparents.length - 1) * H_GAP
      : 0;

    const grandchildRowWidth = grandchildren.length > 0
      ? grandchildren.length * NODE_W + (grandchildren.length - 1) * H_GAP
      : 0;

    const contentWidth = Math.max(
      userRowWidth + sibWidth,
      totalChildWidth,
      parentRowWidth,
      grandRowWidth,
      grandchildRowWidth,
      NODE_W,
    );
    const totalW = contentWidth + PAD * 2;

    // Anchor user node at center of canvas
    const userX = (totalW - NODE_W) / 2;
    const yUser = PAD + 2 * (NODE_H + V_GAP);

    // Place user-row nodes around userX
    // Left of user (exes, in reverse so closest sits adjacent)
    let cursor = userX;
    userRowLeft.forEach((n) => {
      cursor -= H_GAP + NODE_W;
      n.x = cursor;
      n.y = yUser;
    });
    userNode.x = userX; userNode.y = yUser;
    cursor = userX;
    userRowRight.forEach((n) => {
      cursor += NODE_W + H_GAP;
      n.x = cursor;
      n.y = yUser;
    });

    // Siblings — to the LEFT of the leftmost user-row item, with extra gap
    const leftmostUserRowX = userRowLeft.length > 0 ? userRowLeft[userRowLeft.length - 1].x! : userX;
    let sibCursor = leftmostUserRowX - UNION_GAP;
    [...siblings].reverse().forEach((s) => {
      sibCursor -= NODE_W;
      s.x = sibCursor;
      s.y = yUser;
      sibCursor -= H_GAP;
    });

    // ─── PARENT ROW ─────────────────────────────────────────────────────────
    // Parents centered above user; in-laws centered above current spouse (if any)
    const yParent = PAD + 1 * (NODE_H + V_GAP);
    if (parents.length > 0) {
      const w = parents.length * NODE_W + (parents.length - 1) * H_GAP;
      const startX = userX + NODE_W / 2 - w / 2;
      parents.forEach((p, i) => {
        p.x = startX + i * (NODE_W + H_GAP);
        p.y = yParent;
      });
    }
    if (inlaws.length > 0) {
      const anchor = currentSpouses[0]?.x ?? userX;
      const w = inlaws.length * NODE_W + (inlaws.length - 1) * H_GAP;
      const startX = anchor + NODE_W / 2 - w / 2;
      inlaws.forEach((p, i) => {
        p.x = startX + i * (NODE_W + H_GAP);
        p.y = yParent;
      });
    }

    // ─── GRANDPARENTS ───────────────────────────────────────────────────────
    const yGP = PAD;
    if (grandparents.length > 0) {
      const w = grandparents.length * NODE_W + (grandparents.length - 1) * H_GAP;
      const startX = userX + NODE_W / 2 - w / 2;
      grandparents.forEach((g, i) => {
        g.x = startX + i * (NODE_W + H_GAP);
        g.y = yGP;
      });
    }

    // ─── CHILD ROW ──────────────────────────────────────────────────────────
    const yChild = PAD + 3 * (NODE_H + V_GAP);

    // Compute each union's anchor X = midpoint of its parent pair
    const unionAnchorX: Record<string, number> = {};
    const computeAnchor = (k: string): number => {
      if (k === USER_ONLY) return userX + NODE_W / 2;
      const sp = spouses.find(s => s.id === k);
      if (!sp || sp.x == null) return userX + NODE_W / 2;
      return (userX + sp.x) / 2 + NODE_W / 2;
    };
    presentUnions.forEach((k) => { unionAnchorX[k] = computeAnchor(k); });

    // Place children under their union anchor, then resolve overlaps left-to-right
    const placedClusters: Array<{ unionKey: string; left: number; right: number; nodes: Node[] }> = [];
    presentUnions
      .map((k) => ({ k, anchor: unionAnchorX[k] }))
      .sort((a, b) => a.anchor - b.anchor)
      .forEach(({ k }) => {
        const list = childrenByUnion[k];
        const w = unionWidth(k);
        let leftX = unionAnchorX[k] - w / 2;
        // Push right if overlapping previous cluster
        const prev = placedClusters[placedClusters.length - 1];
        if (prev && leftX < prev.right + UNION_GAP) leftX = prev.right + UNION_GAP;
        list.forEach((c, i) => {
          c.x = leftX + i * (NODE_W + H_GAP);
          c.y = yChild;
        });
        placedClusters.push({ unionKey: k, left: leftX, right: leftX + w, nodes: list });
      });

    // ─── GRANDCHILDREN ──────────────────────────────────────────────────────
    const yGC = PAD + 4 * (NODE_H + V_GAP);
    if (grandchildren.length > 0) {
      // Place each grandchild under its parent_member_id (a child), else center
      const childById: Record<string, Node> = {};
      childrenAll.forEach((c) => { childById[c.id] = c; });
      const groupsByParent: Record<string, Node[]> = {};
      grandchildren.forEach((gc) => {
        const pid = gc.member?.parent_member_id || '__free__';
        (groupsByParent[pid] = groupsByParent[pid] || []).push(gc);
      });
      let freeCursor = PAD;
      Object.entries(groupsByParent).forEach(([pid, gcs]) => {
        const parent = childById[pid];
        const w = gcs.length * NODE_W + (gcs.length - 1) * H_GAP;
        const anchorX = parent?.x != null ? parent.x + NODE_W / 2 : freeCursor + w / 2;
        const startX = anchorX - w / 2;
        gcs.forEach((g, i) => {
          g.x = startX + i * (NODE_W + H_GAP);
          g.y = yGC;
        });
        freeCursor = startX + w + UNION_GAP;
      });
    }

    // ─── COLLECT ALL POSITIONED NODES ───────────────────────────────────────
    const all: Node[] = [
      ...grandparents,
      ...parents, ...inlaws,
      ...siblings, userNode, ...exSpouses, ...currentSpouses,
      ...childrenAll,
      ...grandchildren,
    ].filter((n) => n.x != null);

    // ─── BUILD CONNECTIONS ──────────────────────────────────────────────────
    type Conn =
      | { kind: 'spouse-current'; from: Node; to: Node }
      | { kind: 'spouse-ex'; from: Node; to: Node }
      | { kind: 'parent-child'; unionKey: string; child: Node; anchorX: number; childKind: 'bio' | 'step' | 'adopted' }
      | { kind: 'parent-of-user'; parents: Node[]; user: Node; siblings: Node[] }
      | { kind: 'gp-parent'; gp: Node; parent: Node }
      | { kind: 'gc-parent'; gc: Node; parent: Node };

    const conns: Conn[] = [];

    // Spouse links (horizontal bars at user row mid-Y)
    currentSpouses.forEach((sp) => conns.push({ kind: 'spouse-current', from: userNode, to: sp }));
    exSpouses.forEach((sp) => conns.push({ kind: 'spouse-ex', from: userNode, to: sp }));

    // Parent → user (+ siblings off the same parent connector)
    if (parents.length > 0) {
      conns.push({ kind: 'parent-of-user', parents, user: userNode, siblings });
    }

    // Grandparents → matching-side parent
    grandparents.forEach((gp) => {
      const match = parents.find((p) => p.side === gp.side) || parents[0];
      if (match) conns.push({ kind: 'gp-parent', gp, parent: match });
    });

    // Children → their union
    presentUnions.forEach((k) => {
      const anchorX = unionAnchorX[k];
      childrenByUnion[k].forEach((c) => {
        conns.push({
          kind: 'parent-child',
          unionKey: k,
          child: c,
          anchorX,
          childKind: c.childKind || 'bio',
        });
      });
    });

    // Grandchildren → their parent (a child node)
    if (grandchildren.length > 0) {
      const childById: Record<string, Node> = {};
      childrenAll.forEach((c) => { childById[c.id] = c; });
      grandchildren.forEach((gc) => {
        const pid = gc.member?.parent_member_id;
        const parent = pid ? childById[pid] : childrenAll[0];
        if (parent) conns.push({ kind: 'gc-parent', gc, parent });
      });
    }

    // Determine vertical bound
    const maxY = Math.max(
      yUser + NODE_H,
      yChild + (presentUnions.length ? NODE_H : 0),
      yGC + (grandchildren.length ? NODE_H : 0),
    );
    const totalH = maxY + PAD;

    // Shift everything if any node went negative-X (siblings push left)
    const minX = Math.min(...all.map((n) => n.x!));
    const shift = minX < PAD ? PAD - minX : 0;
    if (shift > 0) {
      all.forEach((n) => { n.x = (n.x ?? 0) + shift; });
      Object.keys(unionAnchorX).forEach((k) => { unionAnchorX[k] += shift; });
    }
    const maxX = Math.max(...all.map((n) => n.x! + NODE_W));
    const finalW = Math.max(maxX + PAD, totalW);

    return {
      nodes: all,
      connections: conns,
      unionAnchors: unionAnchorX,
      svgW: finalW,
      svgH: totalH,
    };
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

  // ── colors ──
  const COLOR = {
    blood: '#c9a84c',       // gold (bloodline)
    dashed: '#94a3b8',      // muted slate
    nodeBlood: '#1a2744',   // navy
    nodeUser: '#0f1d3a',
    nodeSpouseCurrent: '#7d3a4a',  // warm berry
    nodeEx: '#6b7280',             // muted gray
    nodeStep: '#4b6b76',           // muted teal
    nodeInlaw: '#9aa3b3',
    nodeDeceased: '#6b7280',
    ringGold: '#c9a84c',
  };

  return (
    <div className="relative">
      {/* Zoom controls */}
      <div className="flex items-center gap-2 mb-2 justify-end">
        <button
          onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
          className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-700 hover:bg-stone-200"
          aria-label="Zoom out"
        ><Minus size={14} /></button>
        <span className="text-xs font-semibold text-stone-500 tabular-nums w-10 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
          className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-700 hover:bg-stone-200"
          aria-label="Zoom in"
        ><Plus size={14} /></button>
        <button
          onClick={() => setZoom(1)}
          className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-700 hover:bg-stone-200"
          aria-label="Reset zoom"
        ><Maximize2 size={12} /></button>
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
              {/* ── Connectors ── */}
              {connections.map((c, idx) => {
                if (c.kind === 'spouse-current' || c.kind === 'spouse-ex') {
                  const fromX = c.from.x! < c.to.x! ? c.from.x! + NODE_W : c.from.x!;
                  const toX = c.from.x! < c.to.x! ? c.to.x! : c.to.x! + NODE_W;
                  const y = c.from.y! + NODE_H / 2;
                  const x1 = Math.min(fromX, toX);
                  const x2 = Math.max(fromX, toX);
                  const midX = (x1 + x2) / 2;
                  const isCurrent = c.kind === 'spouse-current';
                  return (
                    <g key={`sp-${idx}`}>
                      <line
                        x1={x1} y1={y} x2={x2} y2={y}
                        stroke={isCurrent ? COLOR.blood : COLOR.dashed}
                        strokeWidth={isCurrent ? 2.5 : 2}
                        strokeDasharray={isCurrent ? undefined : '6 4'}
                      />
                      {isCurrent && (
                        <line x1={x1} y1={y - 4} x2={x2} y2={y - 4}
                          stroke={COLOR.blood} strokeWidth={1} opacity={0.5} />
                      )}
                      <circle cx={midX} cy={y} r={11} fill="#fff"
                        stroke={isCurrent ? COLOR.blood : COLOR.dashed}
                        strokeWidth={1.5} />
                      {isCurrent ? (
                        <foreignObject x={midX - 7} y={y - 7} width={14} height={14}>
                          <Heart size={14} color="#e11d48" fill="#e11d48" />
                        </foreignObject>
                      ) : (
                        <text x={midX} y={y + 3} textAnchor="middle"
                          fontSize="9" fontWeight="700" fill={COLOR.dashed}>EX</text>
                      )}
                    </g>
                  );
                }

                if (c.kind === 'parent-of-user') {
                  // Horizontal bar between parents (or above user if only one parent)
                  const ps = c.parents;
                  const parentBarY = ps[0].y! + NODE_H + 18;
                  const stem = c.user.y! - 10;
                  const xs = ps.map((p) => p.x! + NODE_W / 2);
                  const minPx = Math.min(...xs);
                  const maxPx = Math.max(...xs);
                  const midX = (minPx + maxPx) / 2;
                  const dashed = ps.some((p) => {
                    const s = (p.member?.marital_status || '').toLowerCase();
                    return s === 'divorced' || s === 'separated';
                  });
                  return (
                    <g key={`pu-${idx}`}>
                      {/* drop from each parent */}
                      {ps.map((p, i) => (
                        <line key={i}
                          x1={p.x! + NODE_W / 2} y1={p.y! + NODE_H}
                          x2={p.x! + NODE_W / 2} y2={parentBarY}
                          stroke={COLOR.blood} strokeWidth={2} />
                      ))}
                      {/* horizontal between parents */}
                      {ps.length > 1 && (
                        <line
                          x1={minPx} y1={parentBarY}
                          x2={maxPx} y2={parentBarY}
                          stroke={dashed ? COLOR.dashed : COLOR.blood}
                          strokeWidth={2}
                          strokeDasharray={dashed ? '6 4' : undefined}
                        />
                      )}
                      {/* stem down to user */}
                      <line x1={midX} y1={parentBarY} x2={midX} y2={stem}
                        stroke={COLOR.blood} strokeWidth={2} />
                      <line x1={midX} y1={stem} x2={c.user.x! + NODE_W / 2} y2={stem}
                        stroke={COLOR.blood} strokeWidth={2} />
                      <line x1={c.user.x! + NODE_W / 2} y1={stem}
                        x2={c.user.x! + NODE_W / 2} y2={c.user.y!}
                        stroke={COLOR.blood} strokeWidth={2} />
                      {/* siblings branch off the same stem */}
                      {c.siblings.map((s, i) => (
                        <g key={`sib-${i}`}>
                          <line x1={midX} y1={stem} x2={s.x! + NODE_W / 2} y2={stem}
                            stroke={COLOR.blood} strokeWidth={1.5} opacity={0.7} />
                          <line x1={s.x! + NODE_W / 2} y1={stem}
                            x2={s.x! + NODE_W / 2} y2={s.y!}
                            stroke={COLOR.blood} strokeWidth={1.5} opacity={0.7} />
                        </g>
                      ))}
                    </g>
                  );
                }

                if (c.kind === 'gp-parent') {
                  const fx = c.gp.x! + NODE_W / 2;
                  const fy = c.gp.y! + NODE_H;
                  const tx = c.parent.x! + NODE_W / 2;
                  const ty = c.parent.y!;
                  const midY = fy + (ty - fy) / 2;
                  return (
                    <path key={`gp-${idx}`}
                      d={`M${fx},${fy} L${fx},${midY} L${tx},${midY} L${tx},${ty}`}
                      stroke={COLOR.blood} strokeWidth={1.5} fill="none" opacity={0.6} />
                  );
                }

                if (c.kind === 'parent-child') {
                  const dashed = c.childKind === 'step';
                  const stroke = dashed ? COLOR.dashed : COLOR.blood;
                  const startY = nodes[0]?.y != null ? c.child.y! - 22 : c.child.y! - 22;
                  // Vertical bar at union anchor down to the child row top, then orthogonal to child
                  const anchorY = c.child.y! - 30;
                  const cx = c.child.x! + NODE_W / 2;
                  const userRowMidY = (nodes.find(n => n.kind === 'user')?.y ?? 0) + NODE_H / 2;
                  return (
                    <g key={`pc-${idx}`}>
                      {/* vertical from union anchor down */}
                      <line x1={c.anchorX} y1={userRowMidY + NODE_H / 2 - 4}
                        x2={c.anchorX} y2={anchorY}
                        stroke={stroke} strokeWidth={1.8}
                        strokeDasharray={dashed ? '5 4' : undefined} opacity={0.9} />
                      {/* horizontal across to child column */}
                      <line x1={c.anchorX} y1={anchorY} x2={cx} y2={anchorY}
                        stroke={stroke} strokeWidth={1.8}
                        strokeDasharray={dashed ? '5 4' : undefined} opacity={0.9} />
                      {/* drop into child */}
                      <line x1={cx} y1={anchorY} x2={cx} y2={c.child.y!}
                        stroke={stroke} strokeWidth={1.8}
                        strokeDasharray={dashed ? '5 4' : undefined} opacity={0.9} />
                    </g>
                  );
                }

                if (c.kind === 'gc-parent') {
                  const fx = c.parent.x! + NODE_W / 2;
                  const fy = c.parent.y! + NODE_H;
                  const tx = c.gc.x! + NODE_W / 2;
                  const ty = c.gc.y!;
                  const midY = fy + (ty - fy) / 2;
                  return (
                    <path key={`gc-${idx}`}
                      d={`M${fx},${fy} L${fx},${midY} L${tx},${midY} L${tx},${ty}`}
                      stroke={COLOR.blood} strokeWidth={1.5} fill="none" opacity={0.6} />
                  );
                }
                return null;
              })}

              {/* ── Node cards ── */}
              {nodes.map((n) => {
                const x = n.x ?? 0;
                const y = n.y ?? 0;
                const m = n.member;
                const isUser = n.kind === 'user';
                const deceased = !!n.deceased;
                const name = isUser ? rootName : m?.name || '';

                // Label
                let label = '';
                let badge: string | null = null;
                let badgeColor = COLOR.blood;
                if (isUser) label = 'You';
                else if (n.kind === 'spouse') {
                  if (n.spouseKind === 'ex') { label = 'Ex-Spouse'; badge = 'EX'; badgeColor = COLOR.dashed; }
                  else if ((m?.marital_status || '').toLowerCase() === 'widowed') label = 'Widowed';
                  else label = m?.relationship || 'Spouse';
                } else if (n.kind === 'child') {
                  if (n.childKind === 'step') { label = 'Step-Child'; badge = 'STEP'; badgeColor = COLOR.nodeStep; }
                  else if (n.childKind === 'adopted') { label = 'Adopted'; badge = 'ADOPTED'; badgeColor = COLOR.blood; }
                  else label = m?.relationship || 'Child';
                } else if (n.kind === 'inlaw') label = m?.relationship || 'In-Law';
                else label = m?.relationship || '';

                // Card fill
                let fill = COLOR.nodeBlood;
                let strokeC = 'transparent';
                let strokeW = 0;
                let cardDashed = false;
                if (isUser) { fill = COLOR.nodeUser; strokeC = COLOR.ringGold; strokeW = 2; }
                else if (deceased) fill = COLOR.nodeDeceased;
                else if (n.kind === 'spouse' && n.spouseKind === 'current') fill = COLOR.nodeSpouseCurrent;
                else if (n.kind === 'spouse' && n.spouseKind === 'ex') {
                  fill = COLOR.nodeEx;
                  strokeC = COLOR.dashed; strokeW = 1.5; cardDashed = true;
                }
                else if (n.kind === 'child' && n.childKind === 'step') {
                  fill = COLOR.nodeStep;
                  strokeC = COLOR.dashed; strokeW = 1.5; cardDashed = true;
                }
                else if (n.kind === 'inlaw') fill = COLOR.nodeInlaw;

                const year = validYear(m?.birthday);
                const deathYear = validYear(m?.date_of_death);

                return (
                  <g key={n.id} opacity={deceased ? 0.78 : 1}>
                    <rect
                      x={x} y={y}
                      width={NODE_W} height={NODE_H}
                      rx={12}
                      fill={fill}
                      stroke={strokeC}
                      strokeWidth={strokeW}
                      strokeDasharray={cardDashed ? '5 4' : undefined}
                    />
                    {/* Badge pill (top-left) */}
                    {badge && (
                      <g>
                        <rect x={x + 8} y={y + 8} rx={6} ry={6}
                          width={badge.length * 6 + 14} height={14}
                          fill={badgeColor} opacity={0.95} />
                        <text x={x + 8 + (badge.length * 6 + 14) / 2} y={y + 18}
                          textAnchor="middle" fontSize="8.5" fontWeight="800"
                          fill="#fff" fontFamily="inherit">{badge}</text>
                      </g>
                    )}
                    {/* Avatar */}
                    <foreignObject
                      x={x + (NODE_W - AVATAR_SIZE) / 2}
                      y={y + 12}
                      width={AVATAR_SIZE}
                      height={AVATAR_SIZE}
                    >
                      <PersonAvatar
                        photoPath={isUser ? null : m?.photo_path}
                        name={name}
                        isDeceased={deceased}
                        size={AVATAR_SIZE}
                        ring={isUser}
                      />
                    </foreignObject>
                    {deceased && (
                      <text
                        x={x + NODE_W / 2 + AVATAR_SIZE / 2 - 4}
                        y={y + 20}
                        fill="#c9a84c" fontSize="14" fontWeight="700"
                      >†</text>
                    )}
                    <text
                      x={x + NODE_W / 2}
                      y={y + 12 + AVATAR_SIZE + 16}
                      textAnchor="middle"
                      fill="white" fontSize="12" fontWeight="700"
                    >
                      {name.length > 16 ? name.slice(0, 15) + '…' : name}
                    </text>
                    <text
                      x={x + NODE_W / 2}
                      y={y + 12 + AVATAR_SIZE + 32}
                      textAnchor="middle"
                      fill={deceased ? '#d4d4d4' : '#c9a84c'}
                      fontSize="10" fontWeight="600"
                    >{label}</text>
                    {(year || deathYear) && (
                      <text
                        x={x + NODE_W / 2}
                        y={y + 12 + AVATAR_SIZE + 46}
                        textAnchor="middle"
                        fill="#bbbbbb" fontSize="9"
                      >
                        {year && `b. ${year}`}
                        {year && deathYear && '  '}
                        {deathYear && `d. ${deathYear}`}
                      </text>
                    )}
                    {!isUser && (
                      <g
                        className="cursor-pointer"
                        onClick={() => onEditMember?.(m)}
                        role="button"
                      >
                        <circle cx={x + NODE_W - 12} cy={y + 12} r={10} fill="#2a3a5c" />
                        <foreignObject x={x + NODE_W - 19} y={y + 5} width={14} height={14}>
                          <Pencil size={10} color="#c9a84c" />
                        </foreignObject>
                      </g>
                    )}
                    {!isUser && (
                      <rect
                        x={x} y={y}
                        width={NODE_W} height={NODE_H}
                        fill="transparent"
                        className="cursor-pointer"
                        onClick={() => onEditMember?.(m)}
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
