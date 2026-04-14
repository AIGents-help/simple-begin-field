import React from 'react';

export type SectionId = 
  | 'info' 
  | 'family' 
  | 'medical'
  | 'real-estate' 
  | 'banking' 
  | 'retirement' 
  | 'vehicles' 
  | 'advisors' 
  | 'passwords' 
  | 'property' 
  | 'pets' 
  | 'funeral' 
  | 'private'
  | 'affiliate';

export type UserScope = 'personA' | 'personB' | 'shared';
export type UserMode = 'single' | 'couple';
export type View = 'dashboard' | 'sections' | 'profile' | 'search' | 'household' | 'invite' | 'security' | 'trust' | 'pricing' | 'affiliate' | 'directory';
export type OnboardingStep = 'welcome' | 'setup' | 'names' | 'trust' | 'start';

export interface Section {
  id: SectionId;
  label: string;
  icon: React.ElementType;
  description: string;
  emptyStateText: string;
  addButtonLabel: string;
}

export interface AppState {
  onboarded: boolean;
  userMode: UserMode;
  personA: string;
  personB: string;
  activeScope: UserScope;
  activeTab: SectionId;
  isPrivateLocked: boolean;
  view: View;
}

export interface Record {
  id: string;
  title: string;
  description?: string;
  scope: UserScope;
  visibility?: 'Only Me' | 'Me + Partner' | 'Release Later';
  type?: string;
  [key: string]: any;
}
