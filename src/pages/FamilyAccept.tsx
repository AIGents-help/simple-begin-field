import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, Users, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAppContext } from "@/context/AppContext";

export default function FamilyAccept() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAppContext() as any;
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    (async () => {
      if (!token) return;
      const { data, error } = await supabase
        .from("family_plan_members")
        .select("*, family_plans(plan_key, feature_tier)")
        .eq("invite_token", token)
        .maybeSingle();
      if (error || !data) {
        setError("This invitation is invalid or has expired.");
      } else if (data.status === "active") {
        setError("This invitation has already been accepted.");
      } else if (data.invite_expires_at && new Date(data.invite_expires_at) < new Date()) {
        setError("This invitation has expired.");
      } else {
        setMember(data);
      }
      setLoading(false);
    })();
  }, [token]);

  const handleAccept = async () => {
    if (!user) {
      navigate(`/?redirect=/family/accept/${token}`);
      return;
    }
    setAccepting(true);
    try {
      const { error } = await supabase
        .from("family_plan_members")
        .update({
          status: "active",
          activated_at: new Date().toISOString(),
          user_id: user.id,
        })
        .eq("invite_token", token);
      if (error) throw error;
      toast.success("Welcome to the family plan!");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Could not accept invite");
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-navy-muted" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-stone-100 shadow-sm p-8 text-center">
          <XCircle className="mx-auto text-rose-500 mb-3" size={40} />
          <h1 className="text-xl font-bold text-navy-muted">Invitation unavailable</h1>
          <p className="text-sm text-stone-500 mt-2">{error}</p>
          <button onClick={() => navigate("/")} className="mt-6 px-5 py-2.5 bg-navy-muted text-white rounded-xl font-bold text-sm">
            Go to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-stone-100 shadow-sm p-8">
        <Users className="mx-auto text-navy-muted mb-3" size={40} />
        <h1 className="text-2xl font-serif font-bold text-navy-muted text-center">
          You've been invited to a Family Plan
        </h1>
        <p className="text-sm text-stone-500 text-center mt-2">
          Accept to activate your own private, independent Survivor Packet under this family plan.
        </p>
        <div className="bg-stone-50 rounded-xl p-4 mt-6 text-sm">
          <div className="flex justify-between"><span className="text-stone-500">Email</span><span className="font-bold text-navy-muted">{member.invited_email}</span></div>
          <div className="flex justify-between mt-1"><span className="text-stone-500">Plan</span><span className="font-bold text-navy-muted capitalize">{member.family_plans?.feature_tier} Family</span></div>
        </div>
        <p className="text-xs text-stone-500 mt-4 text-center">
          Your packet is 100% private. The plan owner cannot see its contents.
        </p>
        <button
          onClick={handleAccept}
          disabled={accepting}
          className="mt-6 w-full py-3 rounded-xl bg-navy-muted text-white font-bold text-sm disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          {accepting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
          {user ? "Accept invitation" : "Sign in to accept"}
        </button>
      </div>
    </div>
  );
}
