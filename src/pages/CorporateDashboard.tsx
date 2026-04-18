import React, { useEffect, useState } from "react";
import { Building2, UserPlus, Loader2, Upload, Download, X, Check } from "lucide-react";
import { toast } from "sonner";
import { useAppContext } from "@/context/AppContext";
import { corporateService, CorporateAccount, CorporateSeat } from "@/services/corporateService";
import { useNavigate } from "react-router-dom";

export const CorporateDashboard: React.FC = () => {
  const { user } = useAppContext() as any;
  const navigate = useNavigate();
  const [account, setAccount] = useState<CorporateAccount | null>(null);
  const [seats, setSeats] = useState<CorporateSeat[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [csvText, setCsvText] = useState("");

  const load = async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const a = await corporateService.getMyAccount(user.id);
      setAccount(a);
      if (a) setSeats(await corporateService.listSeats(a.id));
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [user?.id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-navy-muted" /></div>;

  if (!account) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow p-8 max-w-md text-center space-y-3">
          <Building2 size={32} className="text-navy-muted mx-auto" />
          <h1 className="text-xl font-bold text-navy-muted">No corporate account</h1>
          <p className="text-sm text-stone-500">You don't have a corporate plan yet.</p>
          <button onClick={() => navigate("/pricing")} className="px-5 py-2.5 rounded-xl bg-navy-muted text-white font-bold text-sm">View corporate pricing</button>
        </div>
      </div>
    );
  }

  const activeSeats = seats.filter(s => s.status !== "revoked").length;
  const seatsLeft = account.seat_limit - activeSeats;

  const handleInvite = async () => {
    if (!email.includes("@")) { toast.error("Enter a valid email"); return; }
    if (seatsLeft <= 0) { toast.error("No seats available"); return; }
    setSubmitting(true);
    try {
      await corporateService.inviteSeat(account.id, email, name || undefined);
      toast.success("Invitation sent");
      setEmail(""); setName("");
      await load();
    } catch (err: any) {
      toast.error(err.message);
    } finally { setSubmitting(false); }
  };

  const handleBulk = async () => {
    const emails = csvText.split(/[\n,;]/).map(s => s.trim()).filter(s => s.includes("@"));
    if (emails.length === 0) { toast.error("No valid emails found"); return; }
    if (emails.length > seatsLeft) { toast.error(`Only ${seatsLeft} seats available`); return; }
    setSubmitting(true);
    try {
      await corporateService.inviteBulk(account.id, emails);
      toast.success(`${emails.length} invitations created`);
      setCsvText("");
      await load();
    } catch (err: any) {
      toast.error(err.message);
    } finally { setSubmitting(false); }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Revoke this seat? The employee keeps their personal packet.")) return;
    try {
      await corporateService.revokeSeat(id);
      toast.success("Seat revoked");
      await load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const exportCsv = () => {
    const rows = [["email", "name", "status", "invited_at", "activated_at"]];
    seats.forEach(s => rows.push([s.invited_email, s.invited_name ?? "", s.status, s.invited_at, s.activated_at ?? ""]));
    const csv = rows.map(r => r.map(v => `"${(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${account.company_name}_seats_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-stone-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Building2 size={24} className="text-navy-muted" />
              <h1 className="text-2xl font-serif font-bold text-navy-muted">{account.company_name}</h1>
            </div>
            <p className="text-sm text-stone-500 mt-1">
              {account.feature_tier === "full" ? "Full Feature Corporate" : "Basic Corporate"} • {activeSeats} of {account.seat_limit} seats activated
            </p>
          </div>
          <button onClick={exportCsv} className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs font-bold text-navy-muted">
            <Download size={14} /> Export CSV
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-stone-100 p-5 space-y-3">
            <h3 className="font-bold text-navy-muted text-sm">Invite single employee</h3>
            <input className="w-full p-2.5 rounded-lg border border-stone-200 text-sm" placeholder="Name (optional)" value={name} onChange={e => setName(e.target.value)} />
            <input type="email" className="w-full p-2.5 rounded-lg border border-stone-200 text-sm" placeholder="employee@company.com" value={email} onChange={e => setEmail(e.target.value)} />
            <button onClick={handleInvite} disabled={submitting} className="w-full py-2.5 rounded-lg bg-navy-muted text-white font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50">
              <UserPlus size={12} /> Send invite
            </button>
          </div>
          <div className="bg-white rounded-2xl border border-stone-100 p-5 space-y-3">
            <h3 className="font-bold text-navy-muted text-sm">Bulk invite (paste CSV/list)</h3>
            <textarea className="w-full p-2.5 rounded-lg border border-stone-200 text-sm font-mono" rows={4} placeholder="emp1@x.com, emp2@x.com&#10;emp3@x.com" value={csvText} onChange={e => setCsvText(e.target.value)} />
            <button onClick={handleBulk} disabled={submitting} className="w-full py-2.5 rounded-lg bg-navy-muted text-white font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50">
              <Upload size={12} /> Send bulk invites
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
          <div className="p-4 border-b border-stone-100 font-bold text-navy-muted text-sm">Seats ({seats.length})</div>
          {seats.length === 0 && <div className="p-8 text-center text-stone-400 text-sm italic">No employees invited yet.</div>}
          {seats.map(s => (
            <div key={s.id} className="flex items-center justify-between p-4 border-b border-stone-100 last:border-0">
              <div>
                <div className="font-bold text-sm text-navy-muted">{s.invited_name || s.invited_email}</div>
                <div className="text-xs text-stone-400">{s.invited_email}</div>
                <div className="text-[10px] uppercase tracking-widest font-bold mt-1">
                  {s.status === "active" ? <span className="text-emerald-600 inline-flex items-center gap-1"><Check size={10} /> Active</span> :
                   s.status === "revoked" ? <span className="text-stone-400">Revoked</span> :
                   <span className="text-amber-600">Invited</span>}
                </div>
              </div>
              {s.status !== "revoked" && (
                <button onClick={() => handleRevoke(s.id)} className="text-xs text-red-500 font-bold hover:underline">Revoke</button>
              )}
            </div>
          ))}
        </div>

        <p className="text-xs text-stone-400 italic text-center">
          Employee packets are completely private. You cannot view their content.
        </p>
      </div>
    </div>
  );
};

export default CorporateDashboard;
