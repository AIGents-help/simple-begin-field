import React, { useState, useMemo } from 'react';
import { ArrowLeft, ArrowRight, Check, Home, Star, Zap, Users, Building2, Gift, User as UserIcon, HeartHandshake } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PUBLIC_PLANS, getPlansByCategory, PricingPlan, PlanCategory } from '../../config/pricingConfig';
import { useAppContext } from '../../context/AppContext';
import { CheckoutButton } from './CheckoutButton';
import { GiftPurchaseModal } from './GiftPurchaseModal';

type Tab = 'individual' | 'couple' | 'family' | 'corporate' | 'gift';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'individual', label: 'Individual', icon: UserIcon },
  { id: 'couple', label: 'Couple', icon: HeartHandshake },
  { id: 'family', label: 'Family', icon: Users },
  { id: 'corporate', label: 'Corporate', icon: Building2 },
  { id: 'gift', label: 'Gift', icon: Gift },
];

export const PricingPage = () => {
  const { planKey } = useAppContext();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('individual');

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  const plans = useMemo(() => getPlansByCategory(tab as PlanCategory), [tab]);

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 bg-stone-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 min-h-[44px] px-3 -ml-3 rounded-xl text-navy-muted hover:bg-stone-100 transition-colors font-bold text-sm"
          >
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>
        </div>

        <div className="text-center mb-10">
          <h2 className="text-3xl font-serif font-bold text-navy-muted sm:text-5xl">
            Simple, Lifetime Pricing
          </h2>
          <p className="mt-4 text-lg text-stone-500 max-w-2xl mx-auto">
            Pay once. Protect your family forever. No subscriptions. No renewals.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex flex-wrap justify-center p-1 bg-stone-100 rounded-2xl border border-stone-200 gap-1">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 py-2 px-4 text-sm font-bold rounded-xl transition-all ${
                    active ? 'bg-white text-navy-muted shadow-sm' : 'text-stone-500 hover:text-navy-muted'
                  }`}
                >
                  <Icon size={16} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {tab === 'corporate' ? (
          <CorporateTab plans={plans} />
        ) : tab === 'gift' ? (
          <GiftTab plans={plans} />
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <PricingCard key={plan.id} plan={plan} isCurrent={planKey === plan.id} />
            ))}
          </div>
        )}

        {tab === 'family' && (
          <p className="text-center text-sm text-stone-500 mt-6 max-w-2xl mx-auto">
            Includes up to 6 members. Each member gets their own private, independent packet.
            Additional seats: $25 (Basic) / $40 (Full Feature).
          </p>
        )}
        {tab === 'couple' && (
          <p className="text-center text-sm text-stone-500 mt-6 max-w-2xl mx-auto">
            Each partner gets their own complete packet plus shared collaboration tools.
          </p>
        )}

        {/* Trust signals */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {[
            { title: 'Lifetime means lifetime', body: 'One payment, forever.' },
            { title: 'Bank-grade encryption', body: 'Your data stays private.' },
            { title: '30-day guarantee', body: 'Full refund, no questions.' },
            { title: 'Cancel anytime', body: 'Keep your data either way.' },
          ].map((t) => (
            <div key={t.title} className="p-5 bg-white rounded-2xl border border-stone-100 text-center">
              <div className="font-bold text-navy-muted text-sm">{t.title}</div>
              <div className="text-xs text-stone-500 mt-1">{t.body}</div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center gap-3 text-center">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 py-3 bg-white border-2 border-navy-muted text-navy-muted rounded-2xl font-bold text-sm hover:bg-navy-muted hover:text-white transition-all shadow-sm"
          >
            <Home size={16} />
            <span>Return to My Packet</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

const PricingCard = ({ plan, isCurrent }: { plan: PricingPlan; isCurrent: boolean }) => (
  <div
    className={`relative flex flex-col p-8 bg-white rounded-3xl border ${
      plan.isPopular
        ? 'border-navy-muted shadow-xl scale-[1.02] z-10'
        : plan.isBestValue
        ? 'border-emerald-200 shadow-lg'
        : 'border-stone-100 shadow-sm'
    } transition-all`}
  >
    {plan.isPopular && (
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-navy-muted text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 whitespace-nowrap">
        <Star size={10} fill="currentColor" />
        Most Popular
      </div>
    )}
    {plan.isBestValue && (
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 whitespace-nowrap">
        <Zap size={10} fill="currentColor" />
        Best Value
      </div>
    )}

    <div className="mb-6">
      <h3 className="text-xl font-bold text-navy-muted">{plan.name}</h3>
      <p className="mt-2 text-xs text-stone-500 leading-relaxed">{plan.description}</p>
      <div className="mt-6 flex items-baseline">
        <span className="text-5xl font-bold tracking-tight text-navy-muted">${plan.price}</span>
        <span className="ml-2 text-sm font-medium text-stone-500">one-time</span>
      </div>
      <div className="mt-1 text-xs text-emerald-600 font-bold uppercase tracking-widest">
        {plan.featureTier === 'full' ? 'Full Feature' : 'Basic'}
      </div>
    </div>

    <ul className="flex-1 space-y-3 mb-8">
      {plan.features.map((feature, idx) => (
        <li key={idx} className="flex items-start gap-3">
          <Check size={16} className="text-emerald-500 shrink-0 mt-1" />
          <span className="text-sm text-stone-600">{feature}</span>
        </li>
      ))}
    </ul>

    {plan.stripePriceId ? (
      <CheckoutButton
        stripePriceId={plan.stripePriceId}
        planKey={plan.id}
        disabled={isCurrent}
        className={`w-full py-3 px-6 rounded-xl font-bold text-sm transition-all ${
          isCurrent
            ? 'bg-stone-100 text-stone-400 cursor-default'
            : plan.isPopular
            ? 'bg-navy-muted text-white hover:bg-navy-muted/90 shadow-lg shadow-navy-muted/20'
            : 'bg-white text-navy-muted border-2 border-navy-muted hover:bg-stone-50'
        }`}
      >
        {isCurrent ? 'Current Plan' : 'Buy Now'}
      </CheckoutButton>
    ) : (
      <button
        disabled
        className="w-full py-3 px-6 rounded-xl font-bold text-sm bg-stone-100 text-stone-400 cursor-not-allowed"
        title="Stripe product not yet synced — admins: run stripe-product-sync"
      >
        Coming Soon
      </button>
    )}
  </div>
);

const CorporateTab = ({ plans }: { plans: PricingPlan[] }) => {
  const [seats, setSeats] = useState(10);
  const navigate = useNavigate();

  const calc = (perSeat: number) => {
    if (seats >= 100) return null;
    const discount = seats >= 50 ? 0.2 : 0;
    return Math.round(perSeat * seats * (1 - discount));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl border border-stone-100 p-6 mb-8">
        <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">
          Number of seats (min 10)
        </label>
        <input
          type="number"
          min={10}
          value={seats}
          onChange={(e) => setSeats(Math.max(10, parseInt(e.target.value || '10', 10)))}
          className="w-full text-3xl font-bold text-navy-muted bg-stone-50 rounded-xl px-4 py-3 border border-stone-200 focus:border-navy-muted outline-none"
        />
        {seats >= 50 && seats < 100 && (
          <p className="text-xs text-emerald-600 font-bold mt-2">✓ 20% volume discount applied</p>
        )}
        {seats >= 100 && (
          <p className="text-xs text-amber-600 font-bold mt-2">100+ seats — please contact us for a custom quote.</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {plans.map((plan) => {
          const total = calc(plan.price);
          return (
            <div key={plan.id} className="bg-white rounded-3xl border border-stone-100 shadow-sm p-8 flex flex-col">
              <h3 className="text-xl font-bold text-navy-muted">{plan.name}</h3>
              <div className="mt-1 text-xs text-emerald-600 font-bold uppercase tracking-widest">
                {plan.featureTier === 'full' ? 'Full Feature' : 'Basic'}
              </div>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-bold text-navy-muted">${plan.price}</span>
                <span className="ml-2 text-sm text-stone-500">/ seat</span>
              </div>
              <div className="mt-2 text-sm text-stone-500">
                {total !== null ? `${seats} seats = $${total.toLocaleString()}` : 'Contact for quote'}
              </div>
              <ul className="mt-6 space-y-2 flex-1">
                {plan.features.slice(0, 6).map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-stone-600">
                    <Check size={14} className="text-emerald-500 mt-1 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              {seats >= 100 ? (
                <button
                  onClick={() => navigate('/contact?topic=enterprise')}
                  className="mt-6 w-full py-3 rounded-xl bg-navy-muted text-white font-bold text-sm"
                >
                  Request Enterprise Quote
                </button>
              ) : plan.stripePriceId ? (
                <CheckoutButton
                  stripePriceId={plan.stripePriceId}
                  planKey={`${plan.id}_x${seats}`}
                  className="mt-6 w-full py-3 rounded-xl bg-navy-muted text-white font-bold text-sm hover:bg-navy-muted/90"
                >
                  Buy {seats} seats
                </CheckoutButton>
              ) : (
                <button disabled className="mt-6 w-full py-3 rounded-xl bg-stone-100 text-stone-400 font-bold text-sm">
                  Coming Soon
                </button>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-center text-xs text-stone-500 mt-6 max-w-xl mx-auto">
        Employee data is completely private. Employers cannot view packet contents.
      </p>
    </div>
  );
};

const GiftTab = ({ plans }: { plans: PricingPlan[] }) => {
  const [active, setActive] = useState<PricingPlan | null>(null);
  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <Gift size={32} className="mx-auto text-navy-muted mb-3" />
        <h3 className="text-2xl font-serif font-bold text-navy-muted">Give the gift of peace of mind</h3>
        <p className="text-stone-500 mt-2 text-sm max-w-xl mx-auto">
          Purchase a lifetime account for someone you love. They receive a personal note and a redemption code.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-white rounded-3xl border border-stone-100 shadow-sm p-6 flex flex-col">
            <h4 className="font-bold text-navy-muted text-sm">{plan.name.replace('Gift — ', '')}</h4>
            <div className="text-3xl font-bold text-navy-muted mt-2">${plan.price}</div>
            <div className="text-xs text-stone-500 mt-1 flex-1">
              {plan.featureTier === 'full' ? 'Full Feature' : 'Basic'} • {plan.seatLimit === 2 ? 'Couple' : 'Single'}
            </div>
            <button
              onClick={() => setActive(plan)}
              className="mt-4 w-full py-2.5 rounded-xl bg-navy-muted text-white font-bold text-xs hover:bg-navy-muted/90"
            >
              Gift it
            </button>
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-stone-500 mt-6">
        Recipient details and personal message are collected at checkout. Codes expire 1 year from purchase.
      </p>
      {active && (
        <GiftPurchaseModal plan={active} isOpen={!!active} onClose={() => setActive(null)} />
      )}
    </div>
  );
};
