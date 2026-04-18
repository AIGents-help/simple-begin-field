import { supabase } from '@/integrations/supabase/client';

export interface VehicleValuation {
  private_party: number;
  trade_in: number;
  dealer_retail: number;
  source: string;
  as_of_date: string;
}

export interface RealEstateValuation {
  estimated_value: number;
  low_estimate: number;
  high_estimate: number;
  price_per_sqft: number;
  source: string;
  as_of_date: string;
}

export interface PersonalPropertyValuation {
  resale_value: number;
  auction_estimate: number;
  replacement_value: number;
  source: string;
  as_of_date: string;
}

interface VehicleInput {
  year: string | number;
  make: string;
  model: string;
  trim?: string;
  mileage: string | number;
  condition?: string;
}
interface RealEstateInput {
  property_type?: string;
  address: string;
  year_built?: string | number;
  square_feet?: string | number;
}
interface PersonalPropertyInput {
  item_name: string;
  category?: string;
  brand?: string;
  model?: string;
  condition?: string;
}

const invokeValuation = async <T>(payload: any): Promise<T> => {
  const { data, error } = await supabase.functions.invoke('ai-valuation', { body: payload });
  if (error) {
    // Edge function returned non-2xx — surface a meaningful message
    const msg = (error as any)?.context?.error
      || (error as any)?.message
      || 'Could not retrieve valuation. Please enter manually.';
    throw new Error(typeof msg === 'string' ? msg : 'Could not retrieve valuation. Please enter manually.');
  }
  if (!data?.valuation) {
    throw new Error('Could not retrieve valuation. Please enter manually.');
  }
  return data.valuation as T;
};

export const aiValuationService = {
  vehicle: (input: VehicleInput) =>
    invokeValuation<VehicleValuation>({ kind: 'vehicle', ...input }),

  realEstate: (input: RealEstateInput) =>
    invokeValuation<RealEstateValuation>({ kind: 'real_estate', ...input }),

  personalProperty: (input: PersonalPropertyInput) =>
    invokeValuation<PersonalPropertyValuation>({ kind: 'personal_property', ...input }),
};

export const formatUsd = (n: number | null | undefined): string => {
  if (typeof n !== 'number' || !Number.isFinite(n) || n <= 0) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
};
