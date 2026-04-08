import React, { useState } from 'react';
import { Check, Star, X, Zap } from 'lucide-react';
import { PRICING_PLANS, PricingPlan } from '../../config/pricingConfig';
import { useAppContext } from '../../context/AppContext';
import { CheckoutButton } from './CheckoutButton';

export const PricingPage = () => {
  const { planKey } = useAppContext();
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');

  const filteredPlans = PRICING_PLANS.filter(plan => 
    plan.id === 'free' || 
    plan.interval === billingInterval || 
    plan.interval === 'one-time'
  );

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 bg-stone-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-serif font-bold text-navy-muted sm:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-lg text-stone-500">
            Choose the plan that's right for you and your family.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex justify-center mb-12">
          <div className="relative flex p-1 bg-stone-100 rounded-2xl border border-stone-200">
            <button
              onClick={() => setBillingInterval('month')}
              className={`relative py-2 px-6 text-sm font-bold rounded-xl transition-all ${
                billingInterval === 'month' 
                  ? 'bg-white text-navy-muted shadow-sm' 
                  : 'text-stone-500 hover:text-navy-muted'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('year')}
              className={`relative py-2 px-6 text-sm font-bold rounded-xl transition-all ${
                billingInterval === 'year' 
                  ? 'bg-white text-navy-muted shadow-sm' 
                  : 'text-stone-500 hover:text-navy-muted'
              }`}
            >
              Annual
              <span className="absolute -top-2 -right-2 bg-emerald-100 text-emerald-700 text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-widest">
                Save 35%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {filteredPlans.map((plan) => (
            <PricingCard key={plan.id} plan={plan} isCurrent={planKey === plan.id} />
          ))}
        </div>
      </div>
    </div>
  );
};

const PricingCard = ({ plan, isCurrent }: { plan: PricingPlan; isCurrent: boolean }) => {
  const isLimitation = (feature: string) => feature.startsWith('No ');

  return (
    <div className={`relative flex flex-col p-8 bg-white rounded-3xl border ${plan.isPopular ? 'border-navy-muted shadow-xl scale-105 z-10' : plan.isBestValue ? 'border-emerald-200 shadow-lg' : 'border-stone-100 shadow-sm'} transition-all`}>
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
          <span className="text-4xl font-bold tracking-tight text-navy-muted">${plan.price}</span>
          {plan.interval !== 'one-time' && (
            <span className="ml-1 text-sm font-medium text-stone-500">/{plan.interval === 'month' ? 'mo' : 'yr'}</span>
          )}
          {plan.interval === 'one-time' && (
            <span className="ml-1 text-sm font-medium text-stone-500">one-time</span>
          )}
        </div>
      </div>

      <ul className="flex-1 space-y-4 mb-8">
        {plan.features.map((feature, idx) => {
          const limitation = isLimitation(feature);
          return (
            <li key={idx} className="flex items-start gap-3">
              {limitation ? (
                <X size={18} className="text-stone-300 shrink-0 mt-0.5" />
              ) : (
                <Check size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              )}
              <span className={`text-sm ${limitation ? 'text-stone-400 italic' : 'text-stone-600'}`}>
                {feature}
              </span>
            </li>
          );
        })}
      </ul>

      {plan.price === 0 ? (
        <button
          disabled={isCurrent}
          className={`w-full py-3 px-6 rounded-xl font-bold text-sm transition-all ${
            isCurrent 
              ? 'bg-stone-100 text-stone-400 cursor-default' 
              : 'bg-white text-navy-muted border-2 border-navy-muted hover:bg-stone-50'
          }`}
        >
          {isCurrent ? 'Current Plan' : 'Get Started'}
        </button>
      ) : (
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
          {isCurrent ? 'Current Plan' : 'Upgrade Now'}
        </CheckoutButton>
      )}
    </div>
  );
};
