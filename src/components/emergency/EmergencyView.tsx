import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, ShieldAlert, Phone, AlertTriangle, Heart } from 'lucide-react';

interface HintResponse {
  valid: boolean;
  first_name?: string;
  hint?: string | null;
  locked?: boolean;
  locked_until?: string | null;
}

interface VerifyResponse {
  success: boolean;
  error?: string;
  data?: any;
  attempts_remaining?: number;
  locked_until?: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const EmergencyView = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [hint, setHint] = useState<HintResponse | null>(null);
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`${SUPABASE_URL}/functions/v1/get-emergency-info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: ANON, Authorization: `Bearer ${ANON}` },
      body: JSON.stringify({ token, action: 'hint' }),
    })
      .then(r => r.json())
      .then(setHint)
      .catch(() => setHint({ valid: false }));
  }, [token]);

  const submit = async () => {
    if (!/^\d{4,6}$/.test(pin)) {
      setError('Enter a 4-6 digit PIN');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/get-emergency-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: ANON, Authorization: `Bearer ${ANON}` },
        body: JSON.stringify({ token, action: 'verify', pin }),
      });
      const json: VerifyResponse = await res.json();
      if (json.success) {
        setData(json.data);
      } else if (json.error === 'locked') {
        setError('Too many failed attempts. Try again in 15 minutes.');
      } else if (json.error === 'wrong_pin') {
        setError(`Incorrect PIN. ${json.attempts_remaining ?? 0} attempts remaining.`);
      } else if (json.error === 'invalid_token') {
        setError('This emergency card is no longer active.');
      } else {
        setError('Unable to verify PIN. Please try again.');
      }
    } catch (e) {
      setError('Network error. Check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!hint) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    );
  }

  if (!hint.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <ShieldAlert className="w-12 h-12 text-stone-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-stone-900 mb-2">Card Not Active</h1>
          <p className="text-stone-600">This emergency card is no longer valid or has been deactivated.</p>
        </div>
      </div>
    );
  }

  // After successful verification — Emergency view
  if (data) {
    const med = (data.medical_records || [])[0] || {};
    const v = data.visible_sections || {};
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="bg-red-700 text-white p-6 text-center">
          <p className="text-xs uppercase tracking-widest font-bold opacity-80">Emergency Information</p>
          <h1 className="text-3xl font-bold mt-1">{data.first_name}</h1>
        </div>

        <div className="max-w-2xl mx-auto p-6 space-y-6">
          {/* Critical Medical */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-3">Critical Medical</h2>
            <div className="bg-white border-2 border-stone-200 rounded-2xl divide-y divide-stone-100">
              {v.blood_type && med.blood_type && (
                <div className="p-5 flex items-baseline justify-between">
                  <span className="text-base font-bold text-stone-700">Blood Type</span>
                  <span className="text-4xl font-bold text-red-700">{med.blood_type}</span>
                </div>
              )}
              {v.allergies && med.allergies && (
                <div className="p-5 bg-red-50">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-700" />
                    <span className="text-sm font-bold uppercase tracking-wide text-red-700">Allergies</span>
                  </div>
                  <p className="text-xl font-semibold text-red-900 leading-snug">{med.allergies}</p>
                </div>
              )}
              {v.medications && (data.medications || []).length > 0 && (
                <div className="p-5">
                  <p className="text-sm font-bold uppercase tracking-wide text-stone-500 mb-3">Current Medications</p>
                  <ul className="space-y-2">
                    {data.medications.map((m: any, i: number) => (
                      <li key={i} className="text-lg text-stone-900">
                        <span className="font-semibold">{m.name}</span>
                        {m.dose && <span className="text-stone-600"> · {m.dose}</span>}
                        {m.frequency && <span className="text-stone-600"> · {m.frequency}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {v.medical_conditions && med.conditions && (
                <div className="p-5">
                  <p className="text-sm font-bold uppercase tracking-wide text-stone-500 mb-1">Medical Conditions</p>
                  <p className="text-lg text-stone-900">{med.conditions}</p>
                </div>
              )}
              {(v.dnr_status || v.organ_donor) && (
                <div className="p-5 grid grid-cols-2 gap-4">
                  {v.dnr_status && med.dnr_status && (
                    <div>
                      <p className="text-xs font-bold uppercase text-stone-500">DNR Status</p>
                      <p className="text-lg font-bold text-stone-900">{med.dnr_status}</p>
                    </div>
                  )}
                  {v.organ_donor && med.organ_donor !== null && med.organ_donor !== undefined && (
                    <div>
                      <p className="text-xs font-bold uppercase text-stone-500">Organ Donor</p>
                      <p className="text-lg font-bold text-stone-900">{med.organ_donor ? 'Yes' : 'No'}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Emergency Contacts */}
          {v.emergency_contacts && (data.emergency_contacts || []).length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-3">Emergency Contacts</h2>
              <div className="space-y-2">
                {data.emergency_contacts.map((c: any, i: number) => (
                  <a
                    key={i}
                    href={`tel:${c.phone}`}
                    className="flex items-center justify-between p-5 bg-white border-2 border-stone-200 rounded-2xl active:bg-stone-50"
                  >
                    <div>
                      <p className="text-lg font-bold text-stone-900">{c.name}</p>
                      {c.relationship && <p className="text-sm text-stone-500">{c.relationship}</p>}
                    </div>
                    <div className="flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold">
                      <Phone className="w-5 h-5" />
                      <span>{c.phone}</span>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Doctor */}
          {v.doctor && med.provider_name && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-3">Primary Doctor</h2>
              <a
                href={med.phone ? `tel:${med.phone}` : '#'}
                className="flex items-center justify-between p-5 bg-white border-2 border-stone-200 rounded-2xl"
              >
                <div>
                  <p className="text-lg font-bold text-stone-900">{med.provider_name}</p>
                </div>
                {med.phone && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold">
                    <Phone className="w-5 h-5" />
                    <span>{med.phone}</span>
                  </div>
                )}
              </a>
            </section>
          )}

          {/* Insurance */}
          {v.insurance && med.insurance_provider && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-3">Insurance</h2>
              <div className="bg-white border-2 border-stone-200 rounded-2xl p-5 space-y-2">
                <p className="text-lg font-bold text-stone-900">{med.insurance_provider}</p>
                {med.insurance_member_id && <p className="text-base text-stone-700">Member ID: {med.insurance_member_id}</p>}
                {med.insurance_group_number && <p className="text-base text-stone-700">Group: {med.insurance_group_number}</p>}
                {med.insurance_phone && (
                  <a href={`tel:${med.insurance_phone}`} className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold">
                    <Phone className="w-4 h-4" /> {med.insurance_phone}
                  </a>
                )}
              </div>
            </section>
          )}

          {/* Custom */}
          {v.custom_field && data.custom_field && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-3">Additional Info</h2>
              <div className="bg-white border-2 border-stone-200 rounded-2xl p-5">
                <p className="text-base text-stone-900 whitespace-pre-wrap">{data.custom_field}</p>
              </div>
            </section>
          )}

          <footer className="text-center text-xs text-stone-400 py-8 border-t border-stone-100">
            <p className="flex items-center justify-center gap-1">
              <Heart className="w-3 h-3" />
              The Survivor Packet · survivorpacket.com
            </p>
            <p className="mt-1">Accessed {new Date().toLocaleString()}</p>
          </footer>
        </div>
      </div>
    );
  }

  // PIN entry screen
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <ShieldAlert className="w-12 h-12 text-red-700 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-stone-900 mb-2">Emergency Information</h1>
          <p className="text-stone-600">
            Enter PIN to access <span className="font-bold">{hint.first_name}'s</span> emergency information
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="• • • •"
            autoFocus
            className="w-full text-center text-3xl font-bold tracking-widest p-4 border-2 border-stone-200 rounded-xl focus:border-red-700 outline-none"
          />

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800 text-center">
              {error}
            </div>
          )}

          <button
            onClick={submit}
            disabled={submitting || pin.length < 4}
            className="w-full py-4 bg-red-700 text-white font-bold rounded-xl text-lg hover:bg-red-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Access Emergency Info'}
          </button>

          {hint.hint && (
            <button
              onClick={() => setShowHint(!showHint)}
              className="w-full text-sm text-stone-500 underline"
            >
              Forgot PIN?
            </button>
          )}
          {showHint && hint.hint && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-900 text-center">
              <span className="font-bold">Hint:</span> {hint.hint}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-stone-400 mt-6">
          The Survivor Packet — Emergency information only
        </p>
      </div>
    </div>
  );
};
