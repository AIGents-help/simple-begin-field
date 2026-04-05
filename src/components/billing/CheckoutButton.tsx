import React, { useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '../../context/AppContext';

interface CheckoutButtonProps {
  stripePriceId: string;
  planKey: string;
  className?: string;
  disabled?: boolean;
  children: React.ReactNode;
}

export const CheckoutButton = ({ 
  stripePriceId, 
  planKey, 
  className = '', 
  disabled = false,
  children 
}: CheckoutButtonProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentPacket } = useAppContext();

  const handleCheckout = async () => {
    if (disabled || loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Get session directly for access token and user ID
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      
      if (!session) {
        window.location.href = '/?redirect=/pricing';
        return;
      }

      const { data: result, error: invokeError } = await supabase.functions.invoke('create-checkout', {
        body: {
          priceId: stripePriceId,
          planKey,
          userId: session.user.id,
          packetId: currentPacket?.id,
          successUrl: window.location.origin + '/checkout/success',
          cancelUrl: window.location.origin + '/'
        }
      });

      if (invokeError) {
        throw new Error(invokeError.message || 'Failed to create checkout session');
      }

      if (!result?.url) {
        throw new Error('No checkout URL returned');
      }

      // Redirect to Stripe
      window.location.href = result.url;
    } catch (err: any) {
      console.error('Checkout Error:', err);
      setError(err.message || 'Failed to initiate checkout. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        onClick={handleCheckout}
        disabled={disabled || loading}
        className={`relative flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${className}`}
      >
        {loading && <Loader2 size={18} className="animate-spin" />}
        <span>{children}</span>
      </button>
      {error && (
        <div className="mt-2 flex items-center gap-2 text-xs text-red-500 bg-red-50 p-2 rounded-lg">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
