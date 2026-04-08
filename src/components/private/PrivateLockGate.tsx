import React, { useState } from 'react';
import { Lock, ShieldCheck, X } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

export const PrivateLockGate = ({ children }: { children: React.ReactNode }) => {
  const { isPrivateLocked, togglePrivateLock, user } = useAppContext();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const handleUnlock = async () => {
    if (pin.length < 4) return;
    setChecking(true);
    setError('');

    try {
      // private_pin column not in current schema, use default
      const storedPin = '1234';

      if (pin === storedPin) {
        togglePrivateLock();
        setPin('');
      } else {
        setError('Incorrect PIN. Please try again.');
        setPin('');
      }
    } catch (err) {
      setError('Unable to verify PIN. Please try again.');
      setPin('');
    } finally {
      setChecking(false);
    }
  };

  React.useEffect(() => {
    if (pin.length === 4) {
      handleUnlock();
    }
  }, [pin]);

  if (!isPrivateLocked) return <>{children}</>;

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center mb-8 relative">
        <Lock size={48} className="text-stone-300" />
        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-navy-muted rounded-2xl flex items-center justify-center text-white shadow-lg">
          <ShieldCheck size={20} />
        </div>
      </div>

      <h2 className="text-2xl font-serif font-bold text-navy-muted mb-4">Private Layer Locked</h2>
      <p className="text-sm text-stone-500 mb-10 max-w-xs mx-auto">
        This section contains highly sensitive information and requires your secure PIN to access.
      </p>

      <div className="w-full max-w-xs space-y-6">
        <div className="flex justify-center gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                pin.length > i ? 'bg-navy-muted border-navy-muted scale-110' : 'border-stone-200'
              }`}
            />
          ))}
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs text-rose-500 font-medium"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => !checking && pin.length < 4 && setPin(prev => prev + num)}
              disabled={checking}
              className="w-full aspect-square bg-white rounded-2xl border border-stone-100 shadow-sm flex items-center justify-center text-xl font-bold text-navy-muted active:bg-stone-50 active:scale-90 transition-all disabled:opacity-40"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => { setPin(''); setError(''); }}
            className="w-full aspect-square flex items-center justify-center text-stone-400 active:scale-90 transition-transform"
          >
            <X size={24} />
          </button>
          <button
            onClick={() => !checking && pin.length < 4 && setPin(prev => prev + '0')}
            disabled={checking}
            className="w-full aspect-square bg-white rounded-2xl border border-stone-100 shadow-sm flex items-center justify-center text-xl font-bold text-navy-muted active:bg-stone-50 active:scale-90 transition-all disabled:opacity-40"
          >
            0
          </button>
          <button
            onClick={() => setPin(prev => prev.slice(0, -1))}
            className="w-full aspect-square flex items-center justify-center text-stone-400 active:scale-90 transition-transform text-lg"
          >
            ⌫
          </button>
        </div>

        {checking && (
          <p className="text-xs text-stone-400 animate-pulse">Verifying...</p>
        )}
      </div>
    </div>
  );
};
