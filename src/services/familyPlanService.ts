import { supabase } from "@/integrations/supabase/client";

export interface FamilyPlan {
  id: string;
  owner_user_id: string;
  plan_key: string;
  feature_tier: string;
  seat_limit: number;
  created_at: string;
}
export interface FamilyMember {
  id: string;
  family_plan_id: string;
  invited_email: string;
  invited_name: string | null;
  status: string;
  user_id: string | null;
  invited_at: string;
  activated_at: string | null;
  removed_at: string | null;
}

export const familyPlanService = {
  async getMyFamilyPlan(userId: string): Promise<FamilyPlan | null> {
    const { data } = await supabase
      .from("family_plans")
      .select("*")
      .eq("owner_user_id", userId)
      .maybeSingle();
    return (data as FamilyPlan) ?? null;
  },

  async listMembers(familyPlanId: string): Promise<FamilyMember[]> {
    const { data, error } = await supabase
      .from("family_plan_members")
      .select("*")
      .eq("family_plan_id", familyPlanId)
      .order("invited_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as FamilyMember[];
  },

  async inviteMember(familyPlanId: string, email: string, name?: string) {
    const token = crypto.randomUUID().replace(/-/g, "");
    const { data, error } = await supabase
      .from("family_plan_members")
      .insert({
        family_plan_id: familyPlanId,
        invited_email: email.toLowerCase().trim(),
        invited_name: name ?? null,
        invite_token: token,
        invite_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: "invited",
      })
      .select()
      .single();
    if (error) throw error;
    return data as FamilyMember;
  },

  async removeMember(memberId: string) {
    const { error } = await supabase
      .from("family_plan_members")
      .update({ status: "removed", removed_at: new Date().toISOString() })
      .eq("id", memberId);
    if (error) throw error;
  },
};
