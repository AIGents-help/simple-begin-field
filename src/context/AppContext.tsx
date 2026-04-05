import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { AppState, UserScope, UserMode, SectionId, View } from '../config/types';
import { supabase } from '@/integrations/supabase/client';
import { packetService } from '../services/packetService';
import { User } from '@supabase/supabase-js';
import { useBilling } from '../hooks/useBilling';
import { PricingPlan } from '../config/pricingConfig';

interface AppContextType extends AppState {
  user: User | null;
  profile: any | null;
  userDisplayName: string;
  userInitials: string;
  currentPacket: any | null;
  packet: any | null;
  packets: any[];
  loading: boolean;
  billingLoading: boolean;
  planKey: string;
  planName: string;
  isPaid: boolean;
  isCouple: boolean;
  isLifetime: boolean;
  currentPlan: PricingPlan;
  refreshBilling: () => Promise<void>;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  setScope: (scope: UserScope) => void;
  setTab: (tab: SectionId) => void;
  setView: (view: View) => void;
  togglePrivateLock: () => void;
  setCurrentPacket: (packet: any) => void;
  refreshPackets: () => Promise<void>;
  refreshPacketData: () => Promise<void>;
  signOut: () => Promise<void>;
}

const defaultState: AppState = {
  onboarded: false,
  userMode: 'single',
  personA: 'Person A',
  personB: 'Person B',
  activeScope: 'personA',
  activeTab: 'info',
  isPrivateLocked: true,
  view: 'dashboard',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [currentPacket, setCurrentPacket] = useState<any | null>(null);
  const [packets, setPackets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<AppState>(defaultState);
  const hydrationRef = useRef(false);

  const {
    loading: billingLoading,
    planKey,
    planName,
    isPaid,
    isCouple,
    isLifetime,
    currentPlan,
    refreshBilling
  } = useBilling(user);

  const userDisplayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || state.personA;
  
  const userInitials = (() => {
    if (!userDisplayName) return '??';
    const parts = userDisplayName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return userDisplayName.substring(0, 2).toUpperCase();
  })();

  // Hydrate user state: fetch profile + packets
  const hydrateUserState = useCallback(async (authUser: User) => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
      setProfile(profileData);

      const { data: memberships } = await packetService.getPacketsForUser(authUser.id);
      if (memberships && memberships.length > 0) {
        const userPackets = memberships.map((m: any) => ({
          ...m.packets,
          userRole: m.role,
          userScope: m.household_scope
        }));
        setPackets(userPackets);

        const firstPacket = userPackets[0];
        if (!currentPacket) {
          setCurrentPacket(firstPacket);
        }
        const activePacket = currentPacket || firstPacket;

        setState(prev => ({
          ...prev,
          onboarded: true,
          userMode: activePacket.household_mode,
          personA: activePacket.person_a_name || 'Person A',
          personB: activePacket.person_b_name || 'Person B',
        }));
      } else {
        setState(prev => ({ ...prev, onboarded: false }));
      }
    } catch (err) {
      console.error('Failed to hydrate user state:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPacket]);

  // Auth initialization: restore session first, then listen for changes
  useEffect(() => {
    let mounted = true;

    // 1. Restore existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      if (sessionUser) {
        hydrateUserState(sessionUser);
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for future auth changes (sign-in, sign-out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        const newUser = session?.user ?? null;
        setUser(newUser);

        if (!newUser) {
          // Signed out — clear everything
          setProfile(null);
          setPackets([]);
          setCurrentPacket(null);
          setState(prev => ({ ...prev, onboarded: false }));
          setLoading(false);
        } else if (_event === 'SIGNED_IN') {
          // Fresh sign-in — hydrate
          hydrateUserState(newUser);
        }
        // TOKEN_REFRESHED and INITIAL_SESSION are handled by getSession above
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [hydrateUserState]);

  const refreshPackets = useCallback(async () => {
    if (user) await hydrateUserState(user);
  }, [user, hydrateUserState]);

  const setScope = (scope: UserScope) => setState(prev => ({ ...prev, activeScope: scope }));
  const setTab = (tab: SectionId) => setState(prev => ({ ...prev, activeTab: tab }));
  const setView = (view: View) => setState(prev => ({ ...prev, view }));
  const togglePrivateLock = () => setState(prev => ({ ...prev, isPrivateLocked: !prev.isPrivateLocked }));

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const contextValue = React.useMemo(() => ({ 
    ...state, 
    user,
    profile,
    userDisplayName,
    userInitials,
    currentPacket,
    packet: currentPacket,
    packets,
    loading,
    billingLoading,
    planKey,
    planName,
    isPaid,
    isCouple,
    isLifetime,
    currentPlan,
    refreshBilling,
    setState, 
    setScope, 
    setTab, 
    setView, 
    togglePrivateLock,
    setCurrentPacket,
    refreshPackets,
    refreshPacketData: refreshPackets,
    signOut
  }), [
    state, 
    user, 
    profile, 
    userDisplayName, 
    userInitials, 
    currentPacket, 
    packets, 
    loading,
    billingLoading,
    planKey,
    planName,
    isPaid,
    isCouple,
    isLifetime,
    currentPlan,
    refreshBilling,
    refreshPackets
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
