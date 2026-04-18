import { supabase } from '@/integrations/supabase/client';

export interface EstateRecordEntry {
  id: string;
  label: string | null;
  subtype?: string | null;
  value: number;
}

export interface EstateLiability {
  id: string;
  packet_id: string;
  user_id: string;
  liability_type: string;
  lender_name: string | null;
  balance: number;
  monthly_payment: number | null;
  interest_rate: number | null;
  payoff_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface EstateLiabilitySummary {
  id: string;
  liability_type: string;
  label: string;
  value: number;
  payoff_date: string | null;
}

export interface EstateMissingValue {
  section: string;
  id: string;
  label: string | null;
}

export interface EstateSummary {
  packet_id: string;
  gross_assets: number;
  total_liabilities: number;
  net_estate: number;
  liquid_assets: number;
  illiquid_assets: number;
  death_benefits: number;
  categories: {
    real_estate: { total: number; records: EstateRecordEntry[] };
    vehicles: { total: number; records: EstateRecordEntry[] };
    banking: { total: number; records: EstateRecordEntry[] };
    investments: { total: number; records: EstateRecordEntry[] };
    retirement: { total: number; records: EstateRecordEntry[] };
    property: { total: number; records: EstateRecordEntry[] };
    life_insurance: { records: { id: string; label: string; notes: string | null }[] };
  };
  liabilities: EstateLiabilitySummary[];
  missing_values: EstateMissingValue[];
  calculated_at: string;
}

export const LIABILITY_TYPES = [
  'Mortgage',
  'Vehicle Loan',
  'Credit Card',
  'Student Loan',
  'Personal Loan',
  'Business Debt',
  'Other',
] as const;

export const estateSummaryService = {
  async getSummary(packetId: string): Promise<EstateSummary | null> {
    const { data, error } = await supabase.rpc('calculate_estate_summary', { p_packet_id: packetId });
    if (error) {
      console.error('[estateSummaryService] getSummary error:', error);
      throw error;
    }
    return data as unknown as EstateSummary;
  },

  async listLiabilities(packetId: string): Promise<EstateLiability[]> {
    const { data, error } = await supabase
      .from('estate_liabilities')
      .select('*')
      .eq('packet_id', packetId)
      .order('balance', { ascending: false });
    if (error) {
      console.error('[estateSummaryService] listLiabilities error:', error);
      throw error;
    }
    return (data || []) as EstateLiability[];
  },

  async upsertLiability(input: Partial<EstateLiability> & { packet_id: string; user_id: string; liability_type: string; balance: number }) {
    const payload = {
      packet_id: input.packet_id,
      user_id: input.user_id,
      liability_type: input.liability_type,
      lender_name: input.lender_name ?? null,
      balance: input.balance,
      monthly_payment: input.monthly_payment ?? null,
      interest_rate: input.interest_rate ?? null,
      payoff_date: input.payoff_date ?? null,
      notes: input.notes ?? null,
    };
    if (input.id) {
      const { data, error } = await supabase
        .from('estate_liabilities')
        .update(payload)
        .eq('id', input.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const { data, error } = await supabase
      .from('estate_liabilities')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteLiability(id: string) {
    const { error } = await supabase.from('estate_liabilities').delete().eq('id', id);
    if (error) throw error;
  },
};

export const formatCurrency = (n: number | null | undefined): string => {
  const v = Number(n || 0);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
};

export const formatCurrencyAbbrev = (n: number | null | undefined): string => {
  const v = Number(n || 0);
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}K`;
  return formatCurrency(v);
};
