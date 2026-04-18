import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  aiValuationService,
  formatUsd,
  type VehicleValuation,
  type RealEstateValuation,
  type PersonalPropertyValuation,
} from '@/services/aiValuationService';

type Variant = 'vehicle' | 'real_estate' | 'personal_property';

interface BaseProps {
  /** Whether the AI button is enabled (required fields filled) */
  enabled: boolean;
  /** Helper text shown when disabled (e.g. "Enter year, make, model, and mileage") */
  disabledHint?: string;
  /** Called when user clicks "Use this value" — passes the recommended primary number */
  onAccept: (value: number) => void;
  className?: string;
}

interface VehicleProps extends BaseProps {
  variant: 'vehicle';
  input: () => Parameters<typeof aiValuationService.vehicle>[0];
}
interface RealEstateProps extends BaseProps {
  variant: 'real_estate';
  input: () => Parameters<typeof aiValuationService.realEstate>[0];
}
interface PersonalPropertyProps extends BaseProps {
  variant: 'personal_property';
  input: () => Parameters<typeof aiValuationService.personalProperty>[0];
}

type Props = VehicleProps | RealEstateProps | PersonalPropertyProps;

export const AIValuationPanel: React.FC<Props> = (props) => {
  const { enabled, disabledHint, onAccept, className } = props;
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<
    | { kind: 'vehicle'; data: VehicleValuation }
    | { kind: 'real_estate'; data: RealEstateValuation }
    | { kind: 'personal_property'; data: PersonalPropertyValuation }
    | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const loadingLabel =
    props.variant === 'real_estate'
      ? 'Looking up current property estimate...'
      : 'Looking up current market value...';

  const handleEstimate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      if (props.variant === 'vehicle') {
        const data = await aiValuationService.vehicle(props.input());
        setResult({ kind: 'vehicle', data });
      } else if (props.variant === 'real_estate') {
        const data = await aiValuationService.realEstate(props.input());
        setResult({ kind: 'real_estate', data });
      } else {
        const data = await aiValuationService.personalProperty(props.input());
        setResult({ kind: 'personal_property', data });
      }
    } catch (err: any) {
      const msg = err?.message || 'Could not retrieve valuation. Please enter manually.';
      setError(msg);
      toast.error(msg, { duration: 5000, position: 'bottom-center' });
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (!result) return;
    let v = 0;
    if (result.kind === 'vehicle') v = result.data.private_party;
    else if (result.kind === 'real_estate') v = result.data.estimated_value;
    else v = result.data.resale_value;
    if (v > 0) {
      onAccept(Math.round(v));
      toast.success('Estimated value applied. You can still override it.', {
        duration: 3000, position: 'bottom-center',
      });
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            AI valuation assistant
          </p>
          {!enabled && disabledHint ? (
            <p className="text-xs text-muted-foreground mt-1">{disabledHint}</p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleEstimate}
          disabled={!enabled || loading}
          className="border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 hover:text-amber-900"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          <span>{loading ? 'Estimating…' : '✨ Estimate Value with AI'}</span>
        </Button>
      </div>

      {loading && (
        <div className="rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          {loadingLabel}
        </div>
      )}

      {error && !loading && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && !loading && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 space-y-3">
          {result.kind === 'vehicle' && (
            <div className="space-y-2">
              <ValueRow color="bg-blue-500" label="Private Party" value={formatUsd(result.data.private_party)} />
              <ValueRow color="bg-amber-500" label="Trade-in" value={formatUsd(result.data.trade_in)} />
              <ValueRow color="bg-emerald-500" label="Dealer Retail" value={formatUsd(result.data.dealer_retail)} />
            </div>
          )}
          {result.kind === 'real_estate' && (
            <div className="space-y-2">
              <ValueRow icon="🏠" label="Estimated Value" value={formatUsd(result.data.estimated_value)} />
              <ValueRow
                icon="📊"
                label="Range"
                value={`${formatUsd(result.data.low_estimate)} — ${formatUsd(result.data.high_estimate)}`}
              />
              {result.data.price_per_sqft > 0 && (
                <ValueRow
                  icon="📐"
                  label="Price per sqft"
                  value={formatUsd(result.data.price_per_sqft)}
                />
              )}
            </div>
          )}
          {result.kind === 'personal_property' && (
            <div className="space-y-2">
              <ValueRow icon="💰" label="Resale Value" value={formatUsd(result.data.resale_value)} />
              {result.data.auction_estimate > 0 && (
                <ValueRow icon="🏛️" label="Auction Estimate" value={formatUsd(result.data.auction_estimate)} />
              )}
              <ValueRow icon="🔄" label="Replacement Value" value={formatUsd(result.data.replacement_value)} />
            </div>
          )}

          <div className="border-t border-amber-200 pt-2 text-[11px] text-amber-900/80">
            <p>
              <span className="font-semibold">Source:</span> {result.data.source || '—'}
              {result.data.as_of_date ? <> · {result.data.as_of_date}</> : null}
            </p>
            <p className="mt-1 italic">
              {result.kind === 'real_estate'
                ? 'AI-estimated based on publicly available data. Get a professional appraisal for legal, insurance, or sale purposes.'
                : result.kind === 'personal_property'
                ? 'AI-estimated for reference only. Get a certified appraisal for insurance or estate purposes.'
                : 'AI-estimated for reference only. Obtain a professional appraisal for legal or insurance purposes.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="button" size="sm" onClick={handleAccept}>
              Use this value
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setResult(null)}>
              Dismiss
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const ValueRow: React.FC<{ label: string; value: string; color?: string; icon?: string }> = ({
  label, value, color, icon,
}) => (
  <div className="flex items-center justify-between gap-3 text-sm">
    <span className="flex items-center gap-2 text-stone-700">
      {icon ? (
        <span aria-hidden className="text-base leading-none">{icon}</span>
      ) : color ? (
        <span aria-hidden className={cn('h-2.5 w-2.5 rounded-full', color)} />
      ) : null}
      <span className="font-medium">{label}</span>
    </span>
    <span className="font-semibold tabular-nums text-stone-900">{value}</span>
  </div>
);
