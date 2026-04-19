import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { MaskedInput } from '@/components/common/MaskedInput';
import { RecordDocumentUpload } from '@/components/common/RecordDocumentUpload';
import { useConfirm } from '@/context/ConfirmDialogContext';
import { useAppContext } from '@/context/AppContext';
import {
  ChevronDown,
  ChevronUp,
  Save,
  Trash2,
  Loader2,
  AlertTriangle,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  retirementService,
  maskAccountNumber,
  yearsSince,
} from '@/services/retirementService';
import { RetirementBeneficiaryPicker } from './RetirementBeneficiaryPicker';
import { RetirementAdvisorPicker } from './RetirementAdvisorPicker';

type Account = Record<string, any> & {
  id: string;
  packet_id?: string | null;
};

type Props = {
  packetId: string;
  scope: string;
  account: Account;
  expanded: boolean;
  onToggle: () => void;
  onSaved: (saved: Account, prevDraftId?: string) => void;
  onDeleted: (id: string) => void;
  onCancelDraft: (id: string) => void;
};

const ACCOUNT_TYPES = [
  '401k', '403b', '457', 'Traditional IRA', 'Roth IRA',
  'SEP IRA', 'SIMPLE IRA', 'Pension', 'Annuity', 'Other',
];

const EMPLOYER_PLAN_TYPES = new Set(['401k', '403b', '457', 'SIMPLE IRA']);
const isEmployerPlan = (t?: string) => !!t && EMPLOYER_PLAN_TYPES.has(t);
const isPension = (t?: string) => t === 'Pension';

const isDraftId = (id?: string | null) => !!id && id.startsWith('draft-');

const currencyFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const fmtCurrency = (v: any): string | null => {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  return currencyFmt.format(n);
};

/** Pull details JSON path safely. */
const dget = (obj: any, key: string) => obj?.details?.[key];

export const RetirementAccountCard: React.FC<Props> = ({
  packetId,
  scope,
  account,
  expanded,
  onToggle,
  onSaved,
  onDeleted,
  onCancelDraft,
}) => {
  const confirm = useConfirm();
  const { bumpCompletion } = useAppContext();
  const [form, setForm] = useState<Account>(() => ({
    ...account,
    details: account.details || {},
  }));
  const [revealAccount, setRevealAccount] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isDraft = isDraftId(account.id);

  // Track if there's any legacy data to expose advanced accordion
  const hasLegacy = useMemo(() => {
    return !!(form.legacy_notes && form.legacy_notes.trim());
  }, [form.legacy_notes]);

  const setField = (name: string, value: any) =>
    setForm((prev) => ({ ...prev, [name]: value }));

  const setDetail = (name: string, value: any) =>
    setForm((prev) => ({
      ...prev,
      details: { ...(prev.details || {}), [name]: value },
    }));

  const reviewYears = yearsSince(form.beneficiary_last_reviewed_date);
  const reviewStale = reviewYears !== null && reviewYears >= 3;

  const headerSummary = useMemo(() => {
    const parts: string[] = [];
    if (form.account_type) parts.push(form.account_type);
    const val = fmtCurrency(form.approximate_value);
    if (val) parts.push(val);
    const benName = dget(form, 'primary_beneficiary_name');
    if (benName) parts.push(`Beneficiary: ${benName}`);
    return parts.join(' • ');
  }, [form]);

  const handleSave = async () => {
    if (!form.institution || !String(form.institution).trim()) {
      toast.error('Institution name is required.', { duration: 3500, position: 'bottom-center' });
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        ...form,
        packet_id: packetId,
        scope,
      };
      // Strip the masked field and keep the raw value in account_number_encrypted as plaintext
      // (matches sibling sections like banking which use *_masked for display).
      if (payload.account_number_encrypted) {
        payload.account_number_masked = maskAccountNumber(payload.account_number_encrypted);
      }
      const { data, error } = await retirementService.upsert(payload);
      if (error || !data) {
        toast.error(`Save failed: ${error?.message || 'Unknown error'}`, {
          duration: 4000,
          position: 'bottom-center',
        });
        return;
      }
      onSaved(data as Account, isDraft ? account.id : undefined);
      bumpCompletion();
      toast.success(isDraft ? 'Account added.' : 'Account saved.', {
        duration: 2500,
        position: 'bottom-center',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isDraft) {
      onCancelDraft(account.id);
      return;
    }
    const ok = await confirm({
      title: 'Delete this retirement account?',
      description: `Delete "${form.institution || form.account_type || 'this account'}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    setDeleting(true);
    try {
      const { error } = await retirementService.remove(account.id);
      if (error) {
        toast.error(`Delete failed: ${error.message}`, { duration: 4000, position: 'bottom-center' });
        return;
      }
      onDeleted(account.id);
      bumpCompletion();
      toast.success('Account deleted.', { duration: 2500, position: 'bottom-center' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
      {/* Card header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-stone-50 transition-colors"
      >
        <div className="rounded-xl bg-navy-muted/10 p-3 shrink-0">
          <Wallet className="h-5 w-5 text-navy-muted" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-stone-900 truncate">
              {form.institution || (isDraft ? 'New Retirement Account' : 'Retirement Account')}
            </h3>
            {form.nickname && (
              <span className="text-xs text-stone-500 truncate">"{form.nickname}"</span>
            )}
          </div>
          {headerSummary && (
            <p className="text-xs text-stone-500 mt-0.5 truncate">{headerSummary}</p>
          )}
          {reviewStale && (
            <p className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-red-600">
              <AlertTriangle className="h-3.5 w-3.5" />
              Beneficiary not reviewed in {Math.floor(reviewYears!)} years
            </p>
          )}
        </div>
        <div className="shrink-0 text-stone-400">
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-stone-100 p-4 space-y-5 bg-stone-50/40">
          {/* Account Details (always visible when expanded) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-stone-500">
              Account details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Label>Institution / brokerage <span className="text-red-500">*</span></Label>
                <Input
                  value={form.institution || ''}
                  onChange={(e) => setField('institution', e.target.value)}
                  placeholder="e.g. Fidelity, Vanguard"
                />
              </div>
              <div>
                <Label>Account type</Label>
                <select
                  value={form.account_type || ''}
                  onChange={(e) => setField('account_type', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select…</option>
                  {ACCOUNT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Nickname</Label>
                <Input
                  value={form.nickname || ''}
                  onChange={(e) => setField('nickname', e.target.value)}
                  placeholder='e.g. "Fidelity 401k"'
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Account number</Label>
                <MaskedInput
                  value={form.account_number_encrypted || ''}
                  onChange={(v) => setField('account_number_encrypted', v)}
                  placeholder="Tap eye to reveal"
                />
              </div>
              <div>
                <Label>Approximate current value (USD)</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={form.approximate_value ?? ''}
                  onChange={(e) => setField('approximate_value', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Employer (if employer-sponsored)</Label>
                <Input
                  value={form.employer_name || ''}
                  onChange={(e) => setField('employer_name', e.target.value)}
                  placeholder="Employer name"
                />
              </div>
              <div>
                <Label>Plan administrator name</Label>
                <Input
                  value={dget(form, 'plan_admin_name') || ''}
                  onChange={(e) => setDetail('plan_admin_name', e.target.value)}
                  placeholder="Administrator name"
                />
              </div>
              <div>
                <Label>Plan administrator phone</Label>
                <Input
                  type="tel"
                  value={dget(form, 'plan_admin_phone') || ''}
                  onChange={(e) => setDetail('plan_admin_phone', e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>

          {/* Collapsible subsections */}
          <Accordion type="multiple" className="space-y-2">
            {/* Access */}
            <AccordionItem value="access" className="border rounded-lg bg-white px-3">
              <AccordionTrigger className="text-sm font-medium">Access</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
                  <div className="sm:col-span-2">
                    <Label>Online portal URL</Label>
                    <Input
                      value={dget(form, 'portal_url') || ''}
                      onChange={(e) => setDetail('portal_url', e.target.value)}
                      placeholder="https://"
                    />
                  </div>
                  <div>
                    <Label>Username hint</Label>
                    <Input
                      value={dget(form, 'username_hint') || ''}
                      onChange={(e) => setDetail('username_hint', e.target.value)}
                      placeholder="Hint only — not the password"
                    />
                  </div>
                  <div>
                    <Label>Customer service phone</Label>
                    <Input
                      type="tel"
                      value={dget(form, 'customer_service_phone') || ''}
                      onChange={(e) => setDetail('customer_service_phone', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Mobile app name</Label>
                    <Input
                      value={dget(form, 'mobile_app_name') || ''}
                      onChange={(e) => setDetail('mobile_app_name', e.target.value)}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Financial Advisor */}
            <AccordionItem value="advisor" className="border rounded-lg bg-white px-3">
              <AccordionTrigger className="text-sm font-medium">Financial advisor</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
                  <div>
                    <Label>Advisor name</Label>
                    <RetirementAdvisorPicker
                      packetId={packetId}
                      value={dget(form, 'advisor_name') || ''}
                      onChangeText={(v) => setDetail('advisor_name', v)}
                      onPick={(adv) => {
                        setForm((prev) => ({
                          ...prev,
                          details: {
                            ...(prev.details || {}),
                            advisor_name: adv.name,
                            advisor_firm: adv.firm || prev.details?.advisor_firm || '',
                            advisor_phone: adv.phone || prev.details?.advisor_phone || '',
                            advisor_email: adv.email || prev.details?.advisor_email || '',
                          },
                        }));
                      }}
                    />
                  </div>
                  <div>
                    <Label>Firm</Label>
                    <Input
                      value={dget(form, 'advisor_firm') || ''}
                      onChange={(e) => setDetail('advisor_firm', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Advisor phone</Label>
                    <Input
                      type="tel"
                      value={dget(form, 'advisor_phone') || ''}
                      onChange={(e) => setDetail('advisor_phone', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Advisor email</Label>
                    <Input
                      type="email"
                      value={dget(form, 'advisor_email') || ''}
                      onChange={(e) => setDetail('advisor_email', e.target.value)}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Beneficiary */}
            <AccordionItem value="beneficiary" className="border rounded-lg bg-white px-3">
              <AccordionTrigger className="text-sm font-medium">
                Beneficiary
                {reviewStale && (
                  <span className="ml-2 text-xs text-red-600 font-normal">
                    Review overdue
                  </span>
                )}
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
                  <div>
                    <Label>Primary beneficiary</Label>
                    <RetirementBeneficiaryPicker
                      packetId={packetId}
                      listId={`primary-ben-${account.id}`}
                      value={dget(form, 'primary_beneficiary_name') || ''}
                      onChange={(v, rel) => {
                        setForm((prev) => ({
                          ...prev,
                          details: {
                            ...(prev.details || {}),
                            primary_beneficiary_name: v,
                            primary_beneficiary_relationship:
                              rel || prev.details?.primary_beneficiary_relationship || '',
                          },
                        }));
                      }}
                    />
                  </div>
                  <div>
                    <Label>Primary relationship</Label>
                    <Input
                      value={dget(form, 'primary_beneficiary_relationship') || ''}
                      onChange={(e) => setDetail('primary_beneficiary_relationship', e.target.value)}
                      placeholder="Spouse, Child…"
                    />
                  </div>
                  <div>
                    <Label>Primary % allocation</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={dget(form, 'primary_beneficiary_pct') || ''}
                      onChange={(e) => setDetail('primary_beneficiary_pct', e.target.value)}
                      placeholder="100"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <Switch
                      checked={!!dget(form, 'beneficiary_on_file')}
                      onCheckedChange={(v) => setDetail('beneficiary_on_file', v)}
                    />
                    <Label className="!mt-0">Designation on file</Label>
                  </div>

                  <div>
                    <Label>Contingent beneficiary</Label>
                    <RetirementBeneficiaryPicker
                      packetId={packetId}
                      listId={`contingent-ben-${account.id}`}
                      value={dget(form, 'contingent_beneficiary_name') || ''}
                      onChange={(v, rel) => {
                        setForm((prev) => ({
                          ...prev,
                          details: {
                            ...(prev.details || {}),
                            contingent_beneficiary_name: v,
                            contingent_beneficiary_relationship:
                              rel || prev.details?.contingent_beneficiary_relationship || '',
                          },
                        }));
                      }}
                    />
                  </div>
                  <div>
                    <Label>Contingent relationship</Label>
                    <Input
                      value={dget(form, 'contingent_beneficiary_relationship') || ''}
                      onChange={(e) => setDetail('contingent_beneficiary_relationship', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Contingent % allocation</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={dget(form, 'contingent_beneficiary_pct') || ''}
                      onChange={(e) => setDetail('contingent_beneficiary_pct', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Last reviewed date</Label>
                    <Input
                      type="date"
                      value={form.beneficiary_last_reviewed_date || ''}
                      onChange={(e) => setField('beneficiary_last_reviewed_date', e.target.value)}
                    />
                    {reviewStale && (
                      <p className="text-xs text-red-600 mt-1">
                        Last reviewed over 3 years ago — consider re-confirming.
                      </p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Beneficiary notes</Label>
                    <Textarea
                      value={form.beneficiary_notes || ''}
                      onChange={(e) => setField('beneficiary_notes', e.target.value)}
                      rows={2}
                    />
                  </div>
                  {!isDraft && (
                    <div className="sm:col-span-2">
                      <Label>Beneficiary form (upload)</Label>
                      <RecordDocumentUpload
                        packetId={packetId}
                        relatedTable="retirement_records"
                        relatedRecordId={account.id}
                        category="beneficiary_form"
                        scope={scope}
                      />
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Distribution */}
            <AccordionItem value="distribution" className="border rounded-lg bg-white px-3">
              <AccordionTrigger className="text-sm font-medium">Distribution / RMD</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={!!dget(form, 'rmd_required')}
                      onCheckedChange={(v) => setDetail('rmd_required', v)}
                    />
                    <Label className="!mt-0">RMD required</Label>
                  </div>
                  <div>
                    <Label>RMD start date</Label>
                    <Input
                      type="date"
                      value={dget(form, 'rmd_start_date') || ''}
                      onChange={(e) => setDetail('rmd_start_date', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Current distribution amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={dget(form, 'distribution_amount') || ''}
                      onChange={(e) => setDetail('distribution_amount', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Frequency</Label>
                    <select
                      value={dget(form, 'distribution_frequency') || ''}
                      onChange={(e) => setDetail('distribution_frequency', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select…</option>
                      <option>Monthly</option>
                      <option>Quarterly</option>
                      <option>Annually</option>
                    </select>
                  </div>
                  <div>
                    <Label>Method</Label>
                    <select
                      value={dget(form, 'distribution_method') || ''}
                      onChange={(e) => setDetail('distribution_method', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select…</option>
                      <option>Check</option>
                      <option>Direct deposit</option>
                      <option>Reinvested</option>
                    </select>
                  </div>
                </div>
                <p className="text-xs text-stone-500 mt-2 italic">
                  RMD flag is informational only — not financial advice.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Employer plan (conditional) */}
            {isEmployerPlan(form.account_type) && (
              <AccordionItem value="employer" className="border rounded-lg bg-white px-3">
                <AccordionTrigger className="text-sm font-medium">Employer plan details</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={!!dget(form, 'employer_match')}
                        onCheckedChange={(v) => setDetail('employer_match', v)}
                      />
                      <Label className="!mt-0">Employer match</Label>
                    </div>
                    <div>
                      <Label>Match percentage</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={dget(form, 'employer_match_pct') || ''}
                        onChange={(e) => setDetail('employer_match_pct', e.target.value)}
                        placeholder="e.g. 4"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Vesting schedule</Label>
                      <Input
                        value={dget(form, 'vesting_schedule') || ''}
                        onChange={(e) => setDetail('vesting_schedule', e.target.value)}
                        placeholder="e.g. 25% per year, fully vested at 4 years"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={!!dget(form, 'loan_outstanding')}
                        onCheckedChange={(v) => setDetail('loan_outstanding', v)}
                      />
                      <Label className="!mt-0">Loan outstanding</Label>
                    </div>
                    <div>
                      <Label>Loan balance</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={form.loan_balance ?? ''}
                        onChange={(e) => setField('loan_balance', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Monthly payment</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={dget(form, 'loan_monthly_payment') || ''}
                        onChange={(e) => setDetail('loan_monthly_payment', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Payoff date</Label>
                      <Input
                        type="date"
                        value={dget(form, 'loan_payoff_date') || ''}
                        onChange={(e) => setDetail('loan_payoff_date', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Plan sponsor contact</Label>
                      <Input
                        value={dget(form, 'plan_sponsor_name') || ''}
                        onChange={(e) => setDetail('plan_sponsor_name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Plan sponsor phone</Label>
                      <Input
                        type="tel"
                        value={dget(form, 'plan_sponsor_phone') || ''}
                        onChange={(e) => setDetail('plan_sponsor_phone', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>HR contact name</Label>
                      <Input
                        value={dget(form, 'hr_contact_name') || ''}
                        onChange={(e) => setDetail('hr_contact_name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>HR contact phone</Label>
                      <Input
                        type="tel"
                        value={dget(form, 'hr_contact_phone') || ''}
                        onChange={(e) => setDetail('hr_contact_phone', e.target.value)}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Pension specific (conditional) */}
            {isPension(form.account_type) && (
              <AccordionItem value="pension" className="border rounded-lg bg-white px-3">
                <AccordionTrigger className="text-sm font-medium">Pension details</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
                    <div>
                      <Label>Monthly benefit amount</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={dget(form, 'pension_monthly_amount') || ''}
                        onChange={(e) => setDetail('pension_monthly_amount', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Benefit start date</Label>
                      <Input
                        type="date"
                        value={dget(form, 'pension_start_date') || ''}
                        onChange={(e) => setDetail('pension_start_date', e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={!!dget(form, 'survivor_benefit')}
                        onCheckedChange={(v) => setDetail('survivor_benefit', v)}
                      />
                      <Label className="!mt-0">Survivor benefit</Label>
                    </div>
                    <div>
                      <Label>Survivor %</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={dget(form, 'survivor_benefit_pct') || ''}
                        onChange={(e) => setDetail('survivor_benefit_pct', e.target.value)}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Pension administrator contact</Label>
                      <Textarea
                        rows={2}
                        value={dget(form, 'pension_admin_contact') || ''}
                        onChange={(e) => setDetail('pension_admin_contact', e.target.value)}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Documents */}
            {!isDraft && (
              <AccordionItem value="documents" className="border rounded-lg bg-white px-3">
                <AccordionTrigger className="text-sm font-medium">Documents</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pb-2">
                    <div>
                      <Label>Most recent statement</Label>
                      <RecordDocumentUpload
                        packetId={packetId}
                        relatedTable="retirement_records"
                        relatedRecordId={account.id}
                        category="statement"
                        scope={scope}
                      />
                    </div>
                    <div>
                      <Label>Plan summary document</Label>
                      <RecordDocumentUpload
                        packetId={packetId}
                        relatedTable="retirement_records"
                        relatedRecordId={account.id}
                        category="plan_summary"
                        scope={scope}
                      />
                    </div>
                    <div>
                      <Label>Correspondence</Label>
                      <RecordDocumentUpload
                        packetId={packetId}
                        relatedTable="retirement_records"
                        relatedRecordId={account.id}
                        category="correspondence"
                        scope={scope}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Disposition */}
            <AccordionItem value="disposition" className="border rounded-lg bg-white px-3">
              <AccordionTrigger className="text-sm font-medium">Disposition / instructions</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 gap-3 pb-2">
                  <div>
                    <Label>Special instructions for executor / trusted contact</Label>
                    <Textarea
                      rows={3}
                      value={dget(form, 'executor_instructions') || ''}
                      onChange={(e) => setDetail('executor_instructions', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Notes about distribution preferences</Label>
                    <Textarea
                      rows={3}
                      value={form.notes || ''}
                      onChange={(e) => setField('notes', e.target.value)}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Advanced (legacy notes) — only shown if there's preserved legacy data */}
            {hasLegacy && (
              <AccordionItem value="advanced" className="border rounded-lg bg-white px-3">
                <AccordionTrigger className="text-sm font-medium">
                  Advanced — Legacy data preserved
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-xs text-stone-500 mb-2">
                    Fields from the previous version of this section are kept here so nothing is lost.
                    You can edit or clear them at any time.
                  </p>
                  <Textarea
                    rows={6}
                    value={form.legacy_notes || ''}
                    onChange={(e) => setField('legacy_notes', e.target.value)}
                  />
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={handleDelete}
              disabled={deleting || saving}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {isDraft ? 'Cancel' : 'Delete account'}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isDraft ? 'Add account' : 'Save changes'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
