import React, { useEffect, useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '@/context/AppContext';
import { Loader2, Save, User } from 'lucide-react';
import { toast } from 'sonner';
import { GenderSelect } from '@/components/common/GenderSelect';

const FIELDS_BASIC = [
  { name: 'first_name', label: 'First name', placeholder: 'Jane' },
  { name: 'middle_name', label: 'Middle name', placeholder: '' },
  { name: 'last_name', label: 'Last name', placeholder: 'Doe' },
  { name: 'suffix', label: 'Suffix', placeholder: 'Jr., Sr., III' },
  { name: 'preferred_name', label: 'Preferred name / nickname', placeholder: '' },
];

const FIELDS_BIRTH = [
  { name: 'date_of_birth', label: 'Date of birth', type: 'date' },
  { name: 'place_of_birth', label: 'Place of birth (city, state, country)', placeholder: 'Boston, MA, USA' },
];

const FIELDS_CONTACT = [
  { name: 'primary_phone', label: 'Primary phone', type: 'tel', placeholder: '+1 555 123 4567' },
];

type ProfileLike = Record<string, any> & { id: string };

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block">
    <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-stone-500">{label}</span>
    {children}
  </label>
);

export const PersonalInfoCard: React.FC = () => {
  const { user } = useAppContext();
  const [profile, setProfile] = useState<ProfileLike | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setLoading(true);
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('Failed to load profile', error);
          toast.error('Could not load your personal info', { position: 'bottom-center' });
        }
        setProfile((data as ProfileLike) || ({ id: user.id } as ProfileLike));
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [user?.id]);

  const setField = (name: string, value: any) => {
    setProfile((p) => ({ ...((p as any) || {}), [name]: value } as ProfileLike));
    setDirty(true);
  };

  const handleSave = async () => {
    if (!user?.id || !profile) return;
    setSaving(true);
    try {
      const payload: any = { ...profile, id: user.id };
      // Mirror current → mailing if toggle on
      if (payload.mailing_same_as_current) {
        payload.mailing_address_street = payload.current_address_street;
        payload.mailing_address_city = payload.current_address_city;
        payload.mailing_address_state = payload.current_address_state;
        payload.mailing_address_zip = payload.current_address_zip;
      }
      const { error } = await (supabase.from('profiles') as any).upsert(payload, { onConflict: 'id' });
      if (error) throw error;
      toast.success('Personal info saved', { position: 'bottom-center' });
      setDirty(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Could not save', { position: 'bottom-center' });
    } finally {
      setSaving(false);
    }
  };

  const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ')
    || profile?.full_name
    || profile?.preferred_name
    || 'Personal Information';

  return (
    <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 p-4 text-left active:bg-stone-50"
      >
        <div className="w-10 h-10 rounded-lg bg-navy-muted text-primary-foreground flex items-center justify-center shrink-0">
          <User size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Pinned</p>
          <p className="text-sm font-bold text-navy-muted truncate">{displayName}</p>
          <p className="text-xs text-stone-500 truncate">{profile?.primary_phone || profile?.email || 'Tap to complete your details'}</p>
        </div>
      </button>

      {open && (
        <div className="border-t border-stone-200 p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-6 text-stone-400">
              <Loader2 className="animate-spin" size={18} />
            </div>
          ) : (
            <>
              <Accordion type="multiple" defaultValue={['name']} className="w-full">
                <AccordionItem value="name">
                  <AccordionTrigger className="text-sm font-bold">Name</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {FIELDS_BASIC.map((f) => (
                        <Field key={f.name} label={f.label}>
                          <Input
                            value={profile?.[f.name] ?? ''}
                            placeholder={f.placeholder}
                            onChange={(e) => setField(f.name, e.target.value)}
                          />
                        </Field>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="birth">
                  <AccordionTrigger className="text-sm font-bold">Birth & Identity</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {FIELDS_BIRTH.map((f) => (
                        <Field key={f.name} label={f.label}>
                          <Input
                            type={f.type || 'text'}
                            value={profile?.[f.name] ?? ''}
                            placeholder={(f as any).placeholder}
                            onChange={(e) => setField(f.name, e.target.value)}
                          />
                        </Field>
                      ))}
                      <Field label="Nationality / citizenship">
                        <Input value={profile?.nationality ?? ''} onChange={(e) => setField('nationality', e.target.value)} />
                      </Field>
                      <Field label="Marital status">
                        <Input value={profile?.marital_status ?? ''} onChange={(e) => setField('marital_status', e.target.value)} placeholder="Single / Married / Divorced / Widowed" />
                      </Field>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="contact">
                  <AccordionTrigger className="text-sm font-bold">Contact</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {FIELDS_CONTACT.map((f) => (
                        <Field key={f.name} label={f.label}>
                          <Input
                            type={f.type || 'text'}
                            value={profile?.[f.name] ?? ''}
                            placeholder={(f as any).placeholder}
                            onChange={(e) => setField(f.name, e.target.value)}
                          />
                        </Field>
                      ))}
                      <Field label="Primary email">
                        <Input type="email" value={profile?.email ?? ''} onChange={(e) => setField('email', e.target.value)} />
                      </Field>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="address">
                  <AccordionTrigger className="text-sm font-bold">Address</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Current address</p>
                      <Field label="Street">
                        <Input value={profile?.current_address_street ?? ''} onChange={(e) => setField('current_address_street', e.target.value)} />
                      </Field>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <Field label="City"><Input value={profile?.current_address_city ?? ''} onChange={(e) => setField('current_address_city', e.target.value)} /></Field>
                        <Field label="State"><Input value={profile?.current_address_state ?? ''} onChange={(e) => setField('current_address_state', e.target.value)} /></Field>
                        <Field label="ZIP"><Input value={profile?.current_address_zip ?? ''} onChange={(e) => setField('current_address_zip', e.target.value)} /></Field>
                      </div>

                      <div className="flex items-center justify-between rounded-lg border border-stone-200 bg-stone-50 p-3 mt-3">
                        <span className="text-xs font-medium text-stone-600">Mailing address same as current</span>
                        <Switch
                          checked={!!profile?.mailing_same_as_current}
                          onCheckedChange={(v) => setField('mailing_same_as_current', v)}
                        />
                      </div>

                      {!profile?.mailing_same_as_current && (
                        <div className="space-y-3 pt-2">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Mailing address</p>
                          <Field label="Street">
                            <Input value={profile?.mailing_address_street ?? ''} onChange={(e) => setField('mailing_address_street', e.target.value)} />
                          </Field>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <Field label="City"><Input value={profile?.mailing_address_city ?? ''} onChange={(e) => setField('mailing_address_city', e.target.value)} /></Field>
                            <Field label="State"><Input value={profile?.mailing_address_state ?? ''} onChange={(e) => setField('mailing_address_state', e.target.value)} /></Field>
                            <Field label="ZIP"><Input value={profile?.mailing_address_zip ?? ''} onChange={(e) => setField('mailing_address_zip', e.target.value)} /></Field>
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="flex justify-end pt-2 border-t border-stone-100">
                <Button onClick={handleSave} disabled={!dirty || saving} size="sm">
                  {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                  <span className="ml-2">Save Personal Info</span>
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
