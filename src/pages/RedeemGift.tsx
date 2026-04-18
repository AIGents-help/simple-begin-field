import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Gift, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { giftService } from "@/services/giftService";
import { useAppContext } from "@/context/AppContext";

export const RedeemGift: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, refreshBilling } = useAppContext() as any;
  const [code, setCode] = useState(params.get("code") ?? "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; planKey?: string; error?: string } | null>(null);

  useEffect(() => {
    const c = params.get("code");
    if (c) setCode(c);
  }, [params]);

  const handleRedeem = async () => {
    if (!user) {
      toast.error("Please sign in or create an account first to redeem your gift.");
      navigate("/?redeem=" + encodeURIComponent(code));
      return;
    }
    setLoading(true);
    try {
      const res = await giftService.redeemGift(code);
      setResult({ success: !!res.success, planKey: res.plan_key, error: res.error });
      if (res.success) {
        toast.success("Gift redeemed! Your plan is now active.");
        if (typeof refreshBilling === "function") await refreshBilling();
      }
    } catch (err: any) {
      setResult({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8 space-y-5">
        <div className="text-center">
          <div className="inline-flex w-14 h-14 rounded-full bg-amber-100 items-center justify-center mb-3">
            <Gift size={26} className="text-amber-600" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-navy-muted">Redeem your gift</h1>
          <p className="text-sm text-stone-500 mt-2">Enter the 12-character code from your gift email.</p>
        </div>

        {result?.success ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
            <CheckCircle2 size={28} className="text-emerald-600 mx-auto mb-2" />
            <div className="font-bold text-emerald-700">Gift redeemed</div>
            <div className="text-xs text-emerald-600 mt-1">Plan: {result.planKey}</div>
            <button onClick={() => navigate("/")} className="mt-4 px-5 py-2 bg-navy-muted text-white rounded-xl font-bold text-sm">Open my packet</button>
          </div>
        ) : (
          <>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="XXXXXXXXXXXX"
              maxLength={12}
              className="w-full p-4 text-center text-2xl tracking-widest font-mono bg-stone-50 rounded-xl border border-stone-200 outline-none focus:border-navy-muted"
            />
            {result?.error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{result.error.replace(/_/g, " ")}</span>
              </div>
            )}
            <button
              onClick={handleRedeem}
              disabled={loading || code.length < 8}
              className="w-full py-3 rounded-xl bg-navy-muted text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Redeem
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default RedeemGift;
