import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { AppState, UserScope, SectionId, View } from '../config/types';
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
  authReady: boolean;
  profileLoading: boolean;
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
  const [authReady, setAuthReady] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [state, setState] = useState<AppState>(defaultState);
  const currentPacketRef = useRef<any | null>(null);
  const hydrationRequestIdRef = useRef(0);

  useEffect(() => {
    currentPacketRef.current = currentPacket;
  }, [currentPacket]);

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

  const clearUserState = useCallback(() => {
    setProfile(null);
    setPackets([]);
    setCurrentPacket(null);
    setState(defaultState);
  }, []);

  const hydrateUserState = useCallback(async (authUser: User) => {
    const requestId = ++hydrationRequestIdRef.current;
    setLoading(true);
    setProfileLoading(true);
    setAuthReady(false);

    try {
      const [profileResult, packetResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle(),
        packetService.getPacketsForUser(authUser.id),
      ]);

      if (requestId !== hydrationRequestIdRef.current) return;

      if (profileResult.error) {
        console.error('Failed to load profile:', profileResult.error);
      }
      if (packetResult.error) {
        console.error('Failed to load packets:', packetResult.error);
      }

      const profileData = profileResult.data ?? null;
      const memberships = packetResult.data ?? [];
      setProfile(profileData);

      if (memberships.length > 0) {
        const userPackets = memberships
          .map((membership: any) => ({
            ...membership.packets,
            userRole: membership.role,
            userScope: membership.household_scope,
          }))
          .filter(Boolean);

        setPackets(userPackets);

        const existingPacket = currentPacketRef.current
          ? userPackets.find((packet: any) => packet.id === currentPacketRef.current.id)
          : null;
        const activePacket = existingPacket || userPackets[0] || null;

        setCurrentPacket(activePacket);

        if (activePacket) {
          setState((prev) => ({
            ...prev,
            onboarded: true,
            userMode: activePacket.household_mode === 'couple' ? 'couple' : 'single',
            personA: activePacket.person_a_name || profileData?.full_name || 'Person A',
            personB: activePacket.person_b_name || 'Person B',
          }));
        } else {
          setState((prev) => ({
            ...prev,
            onboarded: false,
            personA: profileData?.full_name || 'Person A',
            personB: 'Person B',
          }));
        }
      } else {
        setPackets([]);
        setCurrentPacket(null);
        setState((prev) => ({
          ...prev,
          onboarded: false,
          userMode: 'single',
          personA: profileData?.full_name || 'Person A',
          personB: 'Person B',
        }));
      }
    } catch (error) {
      if (requestId !== hydrationRequestIdRef.current) return;
      console.error('Failed to hydrate user state:', error);
      clearUserState();
    } finally {
      if (requestId !== hydrationRequestIdRef.current) return;
      setProfileLoading(false);
      setLoading(false);
      setAuthReady(true);
    }
  }, [clearUserState]);

  useEffect(() => {
    let mounted = true;

    const handleUserChange = (nextUser: User | null) => {
      if (!mounted) return;

      setUser(nextUser);

      if (!nextUser) {
        hydrationRequestIdRef.current += 1;
        clearUserState();
        setProfileLoading(false);
        setLoading(false);
        setAuthReady(true);
        return;
      }

      void hydrateUserState(nextUser);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'INITIAL_SESSION') return;
      handleUserChange(session?.user ?? null);
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      handleUserChange(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [clearUserState, hydrateUserState]);

  const refreshPackets = useCallback(async () => {
    if (user) {
      await hydrateUserState(user);
    }
  }, [user, hydrateUserState]);

  const setScope = (scope: UserScope) => setState((prev) => ({ ...prev, activeScope: scope }));
  const setTab = (tab: SectionId) => setState((prev) => ({ ...prev, activeTab: tab }));
  const setView = (view: View) => setState((prev) => ({ ...prev, view }));
  const togglePrivateLock = () => setState((prev) => ({ ...prev, isPrivateLocked: !prev.isPrivateLocked }));

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
    authReady,
    profileLoading,
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
    signOut,
  }), [
    state,
    user,
    profile,
    userDisplayName,
    userInitials,
    currentPacket,
    packets,
    loading,
    authReady,
    profileLoading,
    billingLoading,
    planKey,
    planName,
    isPaid,
    isCouple,
    isLifetime,
    currentPlan,
    refreshBilling,
    refreshPackets,
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
