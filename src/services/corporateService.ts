import { supabase } from "@/integrations/supabase/client";

export interface CorporateAccount {
  id: string;
  admin_user_id: string;
  company_name: string;
  company_logo_url: string | null;
  plan_key: string;
  feature_tier: string;
  seat_limit: number;
  total_paid: number;
  created_at: string;
}
export interface CorporateSeat {
  id: string;
  corporate_account_id: string;
  invited_email: string;
  invited_name: string | null;
  status: string;
  user_id: string | null;
  invited_at: string;
  activated_at: string | null;
  revoked_at: string | null;
}

export const corporateService = {
  async getMyAccount(userId: string): Promise<CorporateAccount | null> {
    const { data } = await supabase
      .from("corporate_accounts")
      .select("*")
      .eq("admin_user_id", userId)
      .maybeSingle();
    return (data as CorporateAccount) ?? null;
  },

  async listSeats(corporateAccountId: string): Promise<CorporateSeat[]> {
    const { data, error } = await supabase
      .from("corporate_seats")
      .select("*")
      .eq("corporate_account_id", corporateAccountId)
      .order("invited_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as CorporateSeat[];
  },

  async inviteSeat(corporateAccountId: string, email: string, name?: string) {
    const token = crypto.randomUUID().replace(/-/g, "");
    const { data, error } = await supabase
      .from("corporate_seats")
      .insert({
        corporate_account_id: corporateAccountId,
        invited_email: email.toLowerCase().trim(),
        invited_name: name ?? null,
        invite_token: token,
        invite_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        status: "invited",
      })
      .select()
      .single();
    if (error) throw error;
    return data as CorporateSeat;
  },

  async inviteBulk(corporateAccountId: string, emails: string[]) {
    const rows = emails.map((email) => ({
      corporate_account_id: corporateAccountId,
      invited_email: email.toLowerCase().trim(),
      invite_token: crypto.randomUUID().replace(/-/g, ""),
      invite_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      status: "invited",
    }));
    const { error } = await supabase.from("corporate_seats").insert(rows);
    if (error) throw error;
  },

  async revokeSeat(seatId: string) {
    const { error } = await supabase
      .from("corporate_seats")
      .update({ status: "revoked", revoked_at: new Date().toISOString() })
      .eq("id", seatId);
    if (error) throw error;
  },

  async submitEnterpriseLead(args: {
    company_name: string;
    contact_name: string;
    contact_email: string;
    contact_phone?: string;
    estimated_seats?: number;
    message?: string;
  }) {
    const { error } = await supabase.from("enterprise_leads").insert(args);
    if (error) throw error;
  },
};
