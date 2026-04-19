import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { AppState, UserScope, UserMode, SectionId, View } from '../config/types';
import { supabase } from '@/lib/supabase';
import { authService } from '../services/authService';
import { packetService } from '../services/packetService';
import { User } from '@supabase/supabase-js';
import { useBilling } from '../hooks/useBilling';
import { PricingPlan } from '../config/pricingConfig';
import { customSectionService, CustomSection } from '../services/customSectionService';
import { isDemoMode } from '../demo/demoMode';
import { DEMO_PROFILE, DEMO_PACKET, DEMO_USER_ID } from '../demo/morganFamilyData';

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
  featureTier: 'basic' | 'full';
  planCategory: 'free' | 'individual' | 'couple' | 'family' | 'corporate' | 'gift';
  isFullFeature: boolean;
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
  // Single-source-of-truth completion bus.
  // Anything that mutates packet data (saves, deletes, uploads) calls
  // bumpCompletion() so every completion display refreshes together.
  completionVersion: number;
  bumpCompletion: () => void;
  // One-shot search term consumed by the Find a Professional directory.
  // Setters across the app pre-populate this when the user taps a "Find a
  // Professional" prompt, then the directory clears it after auto-searching.
  directoryQuery: string | null;
  setDirectoryQuery: (q: string | null) => void;
  // Custom user-created sections (max 3 per packet)
  customSections: CustomSection[];
  refreshCustomSections: () => Promise<void>;
  activeCustomSectionId: string | null;
  setActiveCustomSection: (id: string | null) => void;
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

type GlobalAppContext = typeof globalThis & {
  __survivorPacketAppContext__?: React.Context<AppContextType | undefined>;
};

const globalAppContext = globalThis as GlobalAppContext;
const AppContext =
  globalAppContext.__survivorPacketAppContext__ ??
  (globalAppContext.__survivorPacketAppContext__ = createContext<AppContextType | undefined>(undefined));

AppContext.displayName = 'AppContext';

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [currentPacket, setCurrentPacket] = useState<any | null>(null);
  const [packets, setPackets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<AppState>(defaultState);
  const [completionVersion, setCompletionVersion] = useState(0);
  const bumpCompletion = React.useCallback(() => setCompletionVersion(v => v + 1), []);
  const [directoryQuery, setDirectoryQuery] = useState<string | null>(null);
  const [customSections, setCustomSections] = useState<CustomSection[]>([]);
  const [activeCustomSectionId, setActiveCustomSectionId] = useState<string | null>(null);
  const currentPacketRef = React.useRef<any | null>(null);

  const refreshCustomSections = useCallback(async () => {
    if (!currentPacketRef.current?.id) {
      setCustomSections([]);
      return;
    }
    try {
      const list = await customSectionService.list(currentPacketRef.current.id);
      setCustomSections(list);
    } catch (err) {
      console.error('[AppContext] refreshCustomSections failed', err);
    }
  }, []);

  const setActiveCustomSection = useCallback((id: string | null) => {
    setActiveCustomSectionId(id);
  }, []);

  const {
    loading: billingLoading,
    planKey,
    planName,
    isPaid,
    isCouple,
    isLifetime,
    featureTier,
    planCategory,
    isFullFeature,
    currentPlan,
    refreshBilling
  } = useBilling(user);

  const userDisplayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || state.personA;

  useEffect(() => {
    currentPacketRef.current = currentPacket;
  }, [currentPacket]);
  
  const userInitials = (() => {
    if (!userDisplayName) return '??';
    const parts = userDisplayName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return userDisplayName.substring(0, 2).toUpperCase();
  })();

  const fetchPackets = React.useCallback(async (userId: string) => {
    if (isDemoMode()) {
      setPackets([DEMO_PACKET]);
      setCurrentPacket(DEMO_PACKET);
      setState(prev => ({
        ...prev,
        onboarded: true,
        userMode: DEMO_PACKET.household_mode as UserMode,
        personA: DEMO_PACKET.person_a_name || 'Person A',
        personB: DEMO_PACKET.person_b_name || 'Person B',
      }));
      return;
    }

    const { data, error } = await packetService.getPacketsForUser(userId);

    if (error) {
      console.error('Failed to load packets:', error);
      setPackets([]);
      setCurrentPacket(null);
      setState(prev => ({ ...prev, onboarded: false }));
      return;
    }

    if (data && data.length > 0) {
      const userPackets = data.map((m: any) => ({
        ...m.packets,
        userRole: m.role,
        userScope: m.household_scope
      }));

      setPackets(userPackets);

      const firstPacket = userPackets[0];
      const activePacket = currentPacketRef.current
        ? userPackets.find((packet: any) => packet.id === currentPacketRef.current.id) || firstPacket
        : firstPacket;

      setCurrentPacket(activePacket);
      setState(prev => ({
        ...prev,
        onboarded: true,
        userMode: activePacket.household_mode,
        personA: activePacket.person_a_name || 'Person A',
        personB: activePacket.person_b_name || 'Person B',
      }));
      return;
    }

    setPackets([]);
    setCurrentPacket(null);
    setState(prev => ({ ...prev, onboarded: false }));
  }, []);

  // Reload custom sections whenever the active packet changes
  useEffect(() => {
    if (currentPacket?.id) {
      void refreshCustomSections();
    } else {
      setCustomSections([]);
    }
  }, [currentPacket?.id, refreshCustomSections]);

  const hydrateUserState = React.useCallback(async (authUser: User | null) => {
    setUser(authUser);

    if (!authUser) {
      setProfile(null);
      setPackets([]);
      setCurrentPacket(null);
      setState(prev => ({ ...prev, onboarded: false }));
      setLoading(false);
      return;
    }

    if (isDemoMode()) {
      setProfile(DEMO_PROFILE);
      await fetchPackets(DEMO_USER_ID);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError) {
      console.error('Failed to load profile:', profileError);
    }

    setProfile(profileData ?? null);
    await fetchPackets(authUser.id);
    setLoading(false);
  }, [fetchPackets]);

  useEffect(() => {
    let isMounted = true;

    // Demo mode: bypass auth entirely and inject the Morgan family packet.
    if (isDemoMode()) {
      const demoUser = { id: DEMO_USER_ID, email: DEMO_PROFILE.email } as unknown as User;
      setUser(demoUser);
      setProfile(DEMO_PROFILE);
      setPackets([DEMO_PACKET]);
      setCurrentPacket(DEMO_PACKET);
      setState(prev => ({
        ...prev,
        onboarded: true,
        userMode: 'single',
        personA: 'James Morgan',
        personB: 'Person B',
        view: 'dashboard',
      }));
      setLoading(false);
      return () => { isMounted = false; };
    }

    const initializeAuth = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Failed to restore session:', error);
      }

      if (!isMounted) return;
      await hydrateUserState(data.session?.user ?? null);
    };

    void initializeAuth();

    const { data: { subscription } } = authService.onAuthStateChange((nextUser, event) => {
      void hydrateUserState(nextUser);

      // Phase 3: bump last_login_at to power inactivity-based trusted-contact release
      if (nextUser && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        supabase.rpc('touch_last_login' as any).then(({ error }) => {
          if (error) console.error('touch_last_login failed:', error);
        });
      }

      // Enroll new signups in Loops welcome sequence
      if (event === 'SIGNED_IN' && nextUser) {
        const seenKey = `sp_loops_synced_${nextUser.id}`;
        if (!sessionStorage.getItem(seenKey)) {
          sessionStorage.setItem(seenKey, '1');
          supabase.functions.invoke('loops-sync', {
            body: {
              action: 'welcome_email',
              email: nextUser.email,
              firstName: nextUser.user_metadata?.full_name || nextUser.email?.split('@')[0] || '',
              userId: nextUser.id,
            },
          }).catch((err: any) => console.error('Loops sync failed:', err));
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [hydrateUserState]);

  const refreshPackets = async () => {
    if (!user) return;
    setLoading(true);
    await fetchPackets(user.id);
    setLoading(false);
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
    featureTier,
    planCategory,
    isFullFeature,
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
    completionVersion,
    bumpCompletion,
    directoryQuery,
    setDirectoryQuery,
    customSections,
    refreshCustomSections,
    activeCustomSectionId,
    setActiveCustomSection,
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
    featureTier,
    planCategory,
    isFullFeature,
    currentPlan,
    refreshBilling,
    completionVersion,
    bumpCompletion,
    directoryQuery,
    customSections,
    refreshCustomSections,
    activeCustomSectionId,
    setActiveCustomSection,
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
