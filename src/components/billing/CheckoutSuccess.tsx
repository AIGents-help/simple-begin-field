import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { motion } from 'motion/react';

export const CheckoutSuccess = () => {
  const { planName, refreshBilling } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    // Refresh billing status when landing on this page
    refreshBilling();
    
    // Refresh again after a short delay to ensure webhook has processed
    const timer = setTimeout(() => {
      refreshBilling();
    }, 3000);

    return () => clearTimeout(timer);
  }, [refreshBilling]);

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center"
      >
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
            <CheckCircle size={48} />
          </div>
        </div>

        <h1 className="text-3xl font-serif font-bold text-navy-muted mb-2">
          Payment Successful!
        </h1>
        
        <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold mb-6">
          <Sparkles size={18} />
          <span>Your {planName} plan is now active</span>
        </div>

        <p className="text-stone-500 mb-8 leading-relaxed">
          Thank you for upgrading. Your account has been updated and all features are now unlocked according to your plan.
        </p>

        <button
          onClick={() => navigate('/')}
          className="w-full py-4 px-6 bg-navy-muted text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-navy-muted/90 transition-all shadow-lg shadow-navy-muted/20"
        >
          <span>Go to App</span>
          <ArrowRight size={18} />
        </button>
      </motion.div>
    </div>
  );
};
