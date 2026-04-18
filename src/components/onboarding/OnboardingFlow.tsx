import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Users, User, CheckCircle2, Package, ShieldCheck, Lock, Eye } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { OnboardingStep } from '../../config/types';
import { authService } from '../../services/authService';
import { supabase } from '@/integrations/supabase/client';
import { packetService } from '../../services/packetService';
import { ConsentCheckbox } from '../trust/TrustComponents';
import { useLocation, Link } from 'react-router-dom';

const OnboardingFlowComponent = () => {
  const { setState, user, setCurrentPacket } = useAppContext();
  const location = useLocation();
  const [step, setStep] = useState<OnboardingStep | 'auth'>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [userMode, setUserMode] = useState<'single' | 'couple'>('single');
  const [personA, setPersonA] = useState(user?.user_metadata?.full_name || '');
  const [personB, setPersonB] = useState('');
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState('');
  const userId = user?.id ?? '';
  const userFullName = typeof user?.user_metadata?.full_name === 'string'
    ? user.user_metadata.full_name
    : '';

  // Capture ?ref=CODE on load
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const refCode = searchParams.get('ref');
    if (refCode) {
      localStorage.setItem('affiliate_code', refCode);
    }
  }, []);

  // Handle redirect from pricing or other pages
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const redirect = searchParams.get('redirect');
    if (redirect && !userId) {
      setStep('auth');
      setIsSignUp(false);
    }
  }, [location.search, userId]);

  // Sync personA with user metadata if available
  useEffect(() => {
    if (!userId || !userFullName) return;

    setPersonA((currentName) => currentName || userFullName);
  }, [userId, userFullName]);

  // Handle automatic step transition when user logs in
  useEffect(() => {
    if (!userId) return;

    setStep((currentStep) => (
      currentStep === 'auth' || currentStep === 'welcome' ? 'setup' : currentStep
    ));
  }, [userId]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      if (isSignUp) {
        const { data: signUpData, error } = await authService.signUp(email, password);
        if (error) throw error;
        toast.success("Check your email for a confirmation link!", { duration: 5000, position: "bottom-center" });

        // Send welcome email + sync contact to Loops
        if (signUpData?.user?.id) {
          try {
            await supabase.functions.invoke('loops-sync', {
              body: {
                action: 'welcome_email',
                email,
                firstName: email.split('@')[0],
                userId: signUpData.user.id,
              },
            });
          } catch (e) {
            console.error('Loops welcome email failed:', e);
          }
        }

        // Track affiliate signup
        const affiliateCode = localStorage.getItem('affiliate_code');
        if (affiliateCode && signUpData?.user?.id) {
          try {
            await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-affiliate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'record_signup',
                affiliate_code: affiliateCode,
                user_id: signUpData.user.id,
              }),
            });
            localStorage.removeItem('affiliate_code');
          } catch (e) {
            console.error('Affiliate tracking failed:', e);
          }
        }
      } else {
        const { error } = await authService.signIn(email, password);
        if (error) throw error;
        
        // Check for redirect param
        const searchParams = new URLSearchParams(location.search);
        const redirect = searchParams.get('redirect');
        if (redirect) {
          window.location.href = redirect;
          return;
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed", { duration: 5000, position: "bottom-center" });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleFinish = async () => {
    if (!user) {
      setStep('auth');
      return;
    }

    try {
      // Update profile with name and consent
      await authService.updateProfile(user.id, {
        full_name: personA,
        consent_timestamp: new Date().toISOString(),
        legal_version_accepted: '2026-03-26'
      });

      const { data, error } = await packetService.createPacket({
        household_mode: userMode,
        person_a_name: personA || 'Person A',
        person_b_name: userMode === 'couple' ? (personB || 'Person B') : null,
      });

      if (error) throw error;

      if (data) {
        setCurrentPacket(data);
        setState(prev => ({
          ...prev,
          onboarded: true,
          userMode,
          personA: personA || 'Person A',
          personB: personB || 'Person B',
          view: 'dashboard'
        }));
      }
    } catch (err: any) {
      console.error("Error creating packet:", err);
      toast.error("Failed to create packet: " + err.message, { duration: 5000, position: "bottom-center" });
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'auth':
        return (
          <motion.div 
            key="auth"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8 w-full"
          >
            <div className="space-y-2">
              <h2 className="text-3xl font-serif font-bold text-navy-muted">{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
              <p className="text-stone-500">Sign in to save your packet securely.</p>
            </div>
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-stone-500">Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full p-4 bg-white rounded-2xl border border-stone-200 focus:border-navy-muted outline-none shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-stone-500">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full p-4 bg-white rounded-2xl border border-stone-200 focus:border-navy-muted outline-none shadow-sm"
                />
              </div>
              <button 
                type="submit"
                disabled={authLoading}
                className="w-full py-4 bg-navy-muted text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all disabled:opacity-50"
              >
                {authLoading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                <ArrowRight size={20} />
              </button>
            </form>
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full text-sm text-navy-muted font-medium hover:underline"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </motion.div>
        );
      case 'welcome':
        return (
          <motion.div 
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center text-center space-y-8"
          >
            <div className="w-24 h-24 bg-manila rounded-3xl flex items-center justify-center shadow-xl border-4 border-folder-edge rotate-3">
              <Package size={48} className="text-navy-muted" />
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-serif font-bold text-navy-muted">The Survivor Packet</h1>
              <p className="text-stone-500 max-w-xs mx-auto">A warm, tactile way to organize your family's most critical information.</p>
            </div>
            
            <div className="w-full space-y-4">
              <button 
                onClick={() => {
                  if (userId) {
                    setStep('setup');
                    return;
                  }

                  setIsSignUp(true);
                  setStep('auth');
                }}
                className="w-full py-4 bg-navy-muted text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
              >
                Create Account
                <ArrowRight size={20} />
              </button>
              
              <button 
                onClick={() => {
                  setStep('auth');
                  setIsSignUp(false);
                }}
                className="w-full py-4 bg-white text-navy-muted border-2 border-stone-100 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
              >
                Sign In
              </button>
            </div>
          </motion.div>
        );

      case 'setup':
        return (
          <motion.div 
            key="setup"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="space-y-2">
              <h2 className="text-3xl font-serif font-bold text-navy-muted">Household Setup</h2>
              <p className="text-stone-500">How will you be using the packet?</p>
            </div>
            <div className="space-y-4">
              <button 
                onClick={() => setUserMode('single')}
                className={`w-full p-6 rounded-3xl border-2 text-left transition-all flex items-center gap-6 ${userMode === 'single' ? 'border-navy-muted bg-white shadow-md' : 'border-stone-100 bg-stone-50'}`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${userMode === 'single' ? 'bg-navy-muted text-white' : 'bg-stone-200 text-stone-400'}`}>
                  <User size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-navy-muted">Single Mode</h3>
                  <p className="text-xs text-stone-500">Just for me and my personal records.</p>
                </div>
                {userMode === 'single' && <CheckCircle2 className="ml-auto text-navy-muted" size={24} />}
              </button>
              <button 
                onClick={() => setUserMode('couple')}
                className={`w-full p-6 rounded-3xl border-2 text-left transition-all flex items-center gap-6 ${userMode === 'couple' ? 'border-navy-muted bg-white shadow-md' : 'border-stone-100 bg-stone-50'}`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${userMode === 'couple' ? 'bg-navy-muted text-white' : 'bg-stone-200 text-stone-400'}`}>
                  <Users size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-navy-muted">Couple Mode</h3>
                  <p className="text-xs text-stone-500">Shared access for me and my partner.</p>
                </div>
                {userMode === 'couple' && <CheckCircle2 className="ml-auto text-navy-muted" size={24} />}
              </button>
            </div>
            <button 
              onClick={() => setStep('names')}
              className="w-full py-4 bg-navy-muted text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
            >
              Continue
              <ArrowRight size={20} />
            </button>
          </motion.div>
        );

      case 'names':
        return (
          <motion.div 
            key="names"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="space-y-2">
              <h2 className="text-3xl font-serif font-bold text-navy-muted">Almost There</h2>
              <p className="text-stone-500">Let's personalize your packet.</p>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-stone-500">Your Name</label>
                <input 
                  type="text" 
                  value={personA}
                  onChange={(e) => setPersonA(e.target.value)}
                  placeholder="Enter your name..."
                  className="w-full p-4 bg-white rounded-2xl border border-stone-200 focus:border-navy-muted outline-none shadow-sm"
                />
              </div>
              {userMode === 'couple' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-stone-500">Partner's Name</label>
                  <input 
                    type="text" 
                    value={personB}
                    onChange={(e) => setPersonB(e.target.value)}
                    placeholder="Enter partner's name..."
                    className="w-full p-4 bg-white rounded-2xl border border-stone-200 focus:border-navy-muted outline-none shadow-sm"
                  />
                </div>
              )}
            </div>
            <button 
              onClick={() => setStep('trust')}
              disabled={!personA || (userMode === 'couple' && !personB)}
              className="w-full py-4 bg-navy-muted text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all disabled:opacity-50"
            >
              Continue
              <ArrowRight size={20} />
            </button>
          </motion.div>
        );

      case 'trust':
        return (
          <motion.div 
            key="trust"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="space-y-2">
              <h2 className="text-3xl font-serif font-bold text-navy-muted">Before You Begin</h2>
              <p className="text-stone-500">Your trust is our priority. Here's how we handle your data.</p>
            </div>
            
            <div className="space-y-4 bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 flex-shrink-0">
                  <Lock size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-navy-muted text-sm">Your information stays private</h4>
                  <p className="text-xs text-stone-500">Stored securely and only accessible through your account.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 flex-shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-navy-muted text-sm">You control who has access</h4>
                  <p className="text-xs text-stone-500">You decide who can see your packet and can revoke access anytime.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 flex-shrink-0">
                  <Eye size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-navy-muted text-sm">Update or remove data anytime</h4>
                  <p className="text-xs text-stone-500">You are the owner of your data. You can update or delete it at any time.</p>
                </div>
              </div>
            </div>

            <ConsentCheckbox
              checked={consent}
              onChange={(val) => {
                setConsent(val);
                if (val) setConsentError('');
              }}
              error={consentError}
              label={
                <span>
                  I understand and agree to the <Link to="/legal/terms" className="text-indigo-600 underline">Terms of Service</Link> and <Link to="/legal/privacy" className="text-indigo-600 underline">Privacy Policy</Link>.
                </span>
              }
            />

            <button 
              onClick={() => {
                if (!consent) {
                  setConsentError('Please agree to the terms to continue');
                  return;
                }
                setStep('start');
              }}
              className="w-full py-4 bg-navy-muted text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
            >
              Final Step
              <ArrowRight size={20} />
            </button>
          </motion.div>
        );

      case 'start':
        return (
          <motion.div 
            key="start"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center text-center space-y-8"
          >
            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shadow-inner">
              <CheckCircle2 size={48} />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-serif font-bold text-navy-muted">Ready to Start</h2>
              <p className="text-stone-500 max-w-xs mx-auto">Your packet is ready. Start by adding your most critical information first.</p>
            </div>
            <button 
              onClick={handleFinish}
              className="w-full py-4 bg-navy-muted text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
            >
              Enter My Packet
              <ArrowRight size={20} />
            </button>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfaf3] flex flex-col items-center justify-center p-8 max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {renderStep()}
      </AnimatePresence>
    </div>
  );
};

export const OnboardingFlow = React.memo(OnboardingFlowComponent);
OnboardingFlow.displayName = 'OnboardingFlow';
