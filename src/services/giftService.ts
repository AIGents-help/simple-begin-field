import { supabase } from "@/integrations/supabase/client";

export interface GiftCode {
  id: string;
  code: string;
  plan_key: string;
  recipient_name: string | null;
  recipient_email: string | null;
  personal_message: string | null;
  delivery_date: string | null;
  delivered_at: string | null;
  redeemed_at: string | null;
  redeemed_by_user_id: string | null;
  expires_at: string;
  status: string;
  created_at: string;
}

export const giftService = {
  async purchaseGift(args: {
    planKey: string;
    recipientName: string;
    recipientEmail?: string;
    personalMessage?: string;
    deliveryDate?: string;
  }) {
    const { data, error } = await supabase.functions.invoke("purchase-gift", {
      body: {
        ...args,
        successUrl: window.location.origin + "/gift/success?code={CODE}",
        cancelUrl: window.location.origin + "/pricing",
      },
    });
    if (error) throw error;
    return data as { url: string; code: string; giftId: string };
  },

  async redeemGift(code: string) {
    const { data, error } = await supabase.functions.invoke("redeem-gift", {
      body: { code },
    });
    if (error) throw error;
    return data as { success: boolean; plan_key?: string; error?: string };
  },

  async listMyPurchases(userId: string): Promise<GiftCode[]> {
    const { data, error } = await supabase
      .from("gift_codes")
      .select("*")
      .eq("purchased_by_user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as GiftCode[];
  },
};
