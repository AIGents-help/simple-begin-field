import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AppState, UserScope, UserMode, SectionId, View } from '../config/types';
import { supabase } from '../lib/supabase';
import { authService } from '../services/authService';
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
  packet: any | null; // Alias for currentPacket
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
  refreshPacketData: () => Promise<void>; // Alias for refreshPackets
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

  // Auth listener
  useEffect(() => {
    const { data: { subscription } } = authService.onAuthStateChange(async (user) => {
      setUser(user);
      if (!user) {
        setProfile(null);
        setPackets([]);
        setCurrentPacket(null);
        setLoading(false);
      } else {
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(profileData);
        fetchPackets(user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchPackets = async (userId: string) => {
    setLoading(true);
    const { data, error } = await packetService.getPacketsForUser(userId);
    if (data && data.length > 0) {
      const userPackets = data.map((m: any) => ({
        ...m.packets,
        userRole: m.role,
        userScope: m.household_scope
      }));
      setPackets(userPackets);
      
      const firstPacket = userPackets[0];
      const activePacket = currentPacket || firstPacket;
      
      if (!currentPacket) {
        setCurrentPacket(firstPacket);
      }
      
      setState(prev => ({
        ...prev,
        onboarded: true,
        userMode: activePacket.household_mode,
        personA: activePacket.person_a_name || 'Person A',
        personB: activePacket.person_b_name || 'Person B',
      }));
    } else {
      // No packets found, user might need to onboard
      setState(prev => ({ ...prev, onboarded: false }));
    }
    setLoading(false);
  };

  const refreshPackets = async () => {
    if (user) await fetchPackets(user.id);
  };

  const setScope = (scope: UserScope) => setState(prev => ({ ...prev, activeScope: scope }));
  const setTab = (tab: SectionId) => setState(prev => ({ ...prev, activeTab: tab }));
  const setView = (view: View) => setState(prev => ({ ...prev, view }));
  const togglePrivateLock = () => setState(prev => ({ ...prev, isPrivateLocked: !prev.isPrivateLocked }));

  const signOut = async () => {
    await authService.signOut();
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
    refreshBilling
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
