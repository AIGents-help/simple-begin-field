import React, { useState } from "react";
import { Zap, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAppContext } from "@/context/AppContext";
import { PRICING_PLANS } from "@/config/pricingConfig";
import { supabase } from "@/integrations/supabase/client";

export const PlanUpgradeCard: React.FC = () => {
  const { planKey, featureTier } = useAppContext() as any;
  const [loading, setLoading] = useState(false);
  const plan = PRICING_PLANS.find((p) => p.id === planKey);

  if (!plan || featureTier === "full" || !plan.upgradeTargetId || !plan.upgradeDifference) return null;

  const target = PRICING_PLANS.find((p) => p.id === plan.upgradeTargetId);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("upgrade-plan", {
        body: {
          fromPlanKey: plan.id,
          successUrl: window.location.origin + "/checkout/success?upgrade=1",
          cancelUrl: window.location.origin + "/profile",
        },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (err: any) {
      toast.error(err.message ?? "Could not start upgrade");
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-2xl p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Zap size={18} className="text-amber-600" />
        <h3 className="font-bold text-navy-muted">Upgrade to Full Feature</h3>
      </div>
      <p className="text-sm text-stone-600">
        You're on <span className="font-bold">{plan.name}</span>. Upgrade to <span className="font-bold">{target?.name}</span> for full access — pay only the difference.
      </p>
      <button
        onClick={handleUpgrade}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-navy-muted text-white rounded-xl font-bold text-sm disabled:opacity-50"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
        Upgrade — ${plan.upgradeDifference}
      </button>
    </div>
  );
};
