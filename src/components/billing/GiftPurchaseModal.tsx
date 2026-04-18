import React, { useState } from "react";
import { X, Gift, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { giftService } from "@/services/giftService";
import { PricingPlan } from "@/config/pricingConfig";

interface Props {
  plan: PricingPlan;
  isOpen: boolean;
  onClose: () => void;
}

export const GiftPurchaseModal: React.FC<Props> = ({ plan, isOpen, onClose }) => {
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!recipientName.trim()) {
      toast.error("Recipient name is required");
      return;
    }
    setLoading(true);
    try {
      const res = await giftService.purchaseGift({
        planKey: plan.id,
        recipientName: recipientName.trim(),
        recipientEmail: recipientEmail.trim() || undefined,
        personalMessage: message.trim() || undefined,
        deliveryDate: deliveryDate || undefined,
      });
      window.location.href = res.url;
    } catch (err: any) {
      toast.error(err.message ?? "Could not start gift checkout");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift size={20} className="text-navy-muted" />
            <h3 className="text-lg font-bold text-stone-900">Send a gift</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200">
            <X size={16} className="text-stone-500" />
          </button>
        </div>
        <div className="text-sm text-stone-500">
          Gifting <span className="font-bold text-navy-muted">{plan.name}</span> — ${plan.price} one-time
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Recipient name *</label>
            <input className="w-full p-3 mt-1 bg-white rounded-xl border border-stone-200 outline-none text-sm" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} maxLength={100} />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Recipient email (optional)</label>
            <input type="email" className="w-full p-3 mt-1 bg-white rounded-xl border border-stone-200 outline-none text-sm" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder="Skip to share the code manually" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Personal message ({200 - message.length} left)</label>
            <textarea className="w-full p-3 mt-1 bg-white rounded-xl border border-stone-200 outline-none text-sm" rows={3} maxLength={200} value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Deliver on (optional — defaults to immediately)</label>
            <input type="date" className="w-full p-3 mt-1 bg-white rounded-xl border border-stone-200 outline-none text-sm" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-navy-muted text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          Continue to payment — ${plan.price}
        </button>
      </div>
    </div>
  );
};
