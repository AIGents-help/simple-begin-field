import React, { useState } from "react";
import { Building2, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { corporateService } from "@/services/corporateService";
import { useNavigate } from "react-router-dom";

export const EnterpriseContact: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    company_name: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    estimated_seats: 100,
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!form.company_name || !form.contact_name || !form.contact_email) {
      toast.error("Please fill required fields"); return;
    }
    setLoading(true);
    try {
      await corporateService.submitEnterpriseLead(form);
      setDone(true);
    } catch (err: any) {
      toast.error(err.message ?? "Submission failed");
    } finally { setLoading(false); }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow p-8 max-w-md text-center space-y-3">
          <CheckCircle2 size={36} className="text-emerald-500 mx-auto" />
          <h1 className="text-xl font-bold text-navy-muted">Thank you</h1>
          <p className="text-sm text-stone-500">Our enterprise team will reach out within 1 business day.</p>
          <button onClick={() => navigate("/")} className="px-5 py-2.5 rounded-xl bg-navy-muted text-white font-bold text-sm">Back to home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 p-6">
      <div className="max-w-xl mx-auto bg-white rounded-3xl shadow p-8 space-y-4">
        <div className="flex items-center gap-2">
          <Building2 size={22} className="text-navy-muted" />
          <h1 className="text-2xl font-serif font-bold text-navy-muted">Enterprise quote</h1>
        </div>
        <p className="text-sm text-stone-500">For 100+ seats, SSO, custom subdomain, and a dedicated account manager.</p>

        {[
          { key: "company_name", label: "Company name *" },
          { key: "contact_name", label: "Your name *" },
          { key: "contact_email", label: "Email *", type: "email" },
          { key: "contact_phone", label: "Phone (optional)" },
        ].map((f) => (
          <div key={f.key}>
            <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{f.label}</label>
            <input
              type={f.type ?? "text"}
              value={(form as any)[f.key]}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              className="w-full p-3 mt-1 bg-white rounded-xl border border-stone-200 outline-none text-sm"
            />
          </div>
        ))}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Estimated seats</label>
          <input
            type="number"
            min={100}
            value={form.estimated_seats}
            onChange={(e) => setForm({ ...form, estimated_seats: parseInt(e.target.value || "100", 10) })}
            className="w-full p-3 mt-1 bg-white rounded-xl border border-stone-200 outline-none text-sm"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Message</label>
          <textarea
            rows={4}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="w-full p-3 mt-1 bg-white rounded-xl border border-stone-200 outline-none text-sm"
          />
        </div>

        <button onClick={submit} disabled={loading} className="w-full py-3 rounded-xl bg-navy-muted text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
          {loading && <Loader2 size={14} className="animate-spin" />} Submit
        </button>
      </div>
    </div>
  );
};

export default EnterpriseContact;
