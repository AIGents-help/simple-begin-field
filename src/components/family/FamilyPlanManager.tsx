import React, { useEffect, useState } from "react";
import { Users, UserPlus, X, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { useAppContext } from "@/context/AppContext";
import { familyPlanService, FamilyPlan, FamilyMember } from "@/services/familyPlanService";

export const FamilyPlanManager: React.FC = () => {
  const { user } = useAppContext() as any;
  const [plan, setPlan] = useState<FamilyPlan | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const fp = await familyPlanService.getMyFamilyPlan(user.id);
      setPlan(fp);
      if (fp) setMembers(await familyPlanService.listMembers(fp.id));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user?.id]);

  if (loading) return <div className="p-6 text-stone-400 text-sm flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Loading family plan…</div>;
  if (!plan) return null;

  const activeCount = members.filter(m => m.status !== "removed").length;
  const seatsLeft = plan.seat_limit - activeCount;

  const handleInvite = async () => {
    if (!email.includes("@")) { toast.error("Enter a valid email"); return; }
    if (seatsLeft <= 0) { toast.error("No seats remaining"); return; }
    setSubmitting(true);
    try {
      await familyPlanService.inviteMember(plan.id, email, name || undefined);
      toast.success("Invitation sent");
      setEmail(""); setName("");
      await load();
    } catch (err: any) {
      toast.error(err.message ?? "Could not invite");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Remove this family member? Their packet will be deleted after 30 days.")) return;
    try {
      await familyPlanService.removeMember(id);
      toast.success("Member removed");
      await load();
    } catch (err: any) {
      toast.error(err.message ?? "Failed");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-navy-muted" />
          <h3 className="font-bold text-navy-muted">Family Plan</h3>
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
          {plan.feature_tier === "full" ? "Full Feature" : "Basic"}
        </span>
      </div>
      <div className="text-sm text-stone-500">
        Seats: <span className="font-bold text-navy-muted">{activeCount} of {plan.seat_limit}</span> activated
      </div>

      {seatsLeft > 0 && (
        <div className="bg-stone-50 rounded-xl p-3 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Invite a member</div>
          <input className="w-full p-2.5 rounded-lg border border-stone-200 text-sm" placeholder="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
          <input type="email" className="w-full p-2.5 rounded-lg border border-stone-200 text-sm" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button onClick={handleInvite} disabled={submitting} className="w-full py-2.5 rounded-lg bg-navy-muted text-white font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50">
            {submitting ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} />} Send Invite
          </button>
        </div>
      )}

      <div className="space-y-2">
        {members.length === 0 && <div className="text-xs text-stone-400 italic">No members invited yet.</div>}
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
            <div>
              <div className="text-sm font-bold text-navy-muted">{m.invited_name || m.invited_email}</div>
              <div className="text-xs text-stone-400">{m.invited_email}</div>
              <div className="text-[10px] uppercase tracking-widest mt-1 font-bold text-stone-500">
                {m.status === "active" ? <span className="text-emerald-600 flex items-center gap-1"><Check size={10} /> Active</span> : m.status}
              </div>
            </div>
            {m.status !== "removed" && (
              <button onClick={() => handleRemove(m.id)} className="text-xs text-red-500 font-bold hover:underline">Remove</button>
            )}
          </div>
        ))}
      </div>

      <p className="text-[10px] text-stone-400 italic">
        Each member's packet is private. You cannot view their content.
      </p>
    </div>
  );
};
