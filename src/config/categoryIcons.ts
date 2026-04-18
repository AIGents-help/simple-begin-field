import {
  User, Users, Baby, Crown, UserPlus, Heart,
  Car, Plane, Shield, FileText, FileX, Flag, Scroll, ScrollText,
  Building, Building2, UserCheck, FileHeart,
  Stethoscope, Pill, AlertTriangle, Activity,
  Landmark, CreditCard, TrendingUp, Lock, ArrowDownCircle,
  Home, DollarSign, Zap, Video,
  PiggyBank, Briefcase,
  Scale, Calculator,
  KeyRound, Mail, Share2,
  PawPrint,
  Flower2, BookOpen, Music,
  Image as ImageIcon, Mic, Lightbulb,
  Package, Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { SectionId } from './types';

const norm = (v: any): string => String(v || '').toLowerCase().trim();

/**
 * Resolve a contextual Lucide icon for a record card based on its section
 * and category/type. Returns a sensible default per section if no match.
 */
export function getCategoryIcon(section: SectionId | string, record: any): LucideIcon {
  const cat = norm(record?.category);
  const type = norm(record?.advisor_type || record?.account_type || record?.card_type || record?.document_type || record?.entry_type || record?.species);
  const rel = norm(record?.relationship);
  const name = norm(record?.title || record?.name || record?.item_name || record?.institution || record?.service_name || record?.provider_name);
  const all = `${cat} ${type} ${name}`;

  const has = (...needles: string[]) => needles.some((n) => all.includes(n));

  switch (section) {
    case 'info': {
      if (has('driver', 'license')) return Car;
      if (has('passport')) return Plane;
      if (has('social security')) return Shield;
      if (has('birth certificate')) return FileText;
      if (has('marriage')) return Heart;
      if (has('divorce')) return FileX;
      if (has('citizenship', 'naturalization')) return Flag;
      if (has('will') && !has('living')) return Scroll;
      if (has('living will', 'medical directive', 'hcpoa', 'healthcare')) return FileHeart;
      if (has('trust')) return Building;
      if (has('poa', 'power of attorney')) return UserCheck;
      if (has('insurance')) return Shield;
      return User;
    }
    case 'family': {
      if (has('spouse', 'partner', 'wife', 'husband') || rel.includes('spouse') || rel.includes('partner')) return Heart;
      if (rel.includes('child') || rel.includes('son') || rel.includes('daughter') || rel.includes('baby')) return Baby;
      if (rel.includes('grand')) return Crown;
      if (rel.includes('in-law') || rel.includes('in law')) return UserPlus;
      if (rel.includes('parent') || rel.includes('mother') || rel.includes('father') || rel.includes('sibling') || rel.includes('brother') || rel.includes('sister')) return Users;
      return User;
    }
    case 'medical': {
      if (has('medication', 'prescription', 'drug')) return Pill;
      if (has('insurance')) return Shield;
      if (has('allergy', 'allergies')) return AlertTriangle;
      if (has('surgery', 'procedure', 'operation')) return Activity;
      if (has('directive', 'living will', 'hcpoa')) return FileHeart;
      return Stethoscope;
    }
    case 'banking': {
      if (has('credit card', 'card')) return CreditCard;
      if (has('investment', 'brokerage')) return TrendingUp;
      if (has('safe deposit', 'safety deposit')) return Lock;
      if (has('debt', 'loan', 'mortgage')) return ArrowDownCircle;
      return Landmark;
    }
    case 'real-estate': {
      if (has('mortgage')) return DollarSign;
      if (has('insurance')) return Shield;
      if (has('utility', 'utilities')) return Zap;
      if (has('security', 'alarm')) return Lock;
      if (has('video', 'inventory')) return Video;
      return Home;
    }
    case 'investments': {
      if (has('crypto', 'bitcoin', 'ethereum', 'coinbase', 'binance', 'kraken')) return KeyRound;
      if (has('private equity', 'angel', 'startup', 'venture')) return Building2;
      if (has('hedge')) return TrendingUp;
      if (has('trust')) return Building;
      if (has('joint')) return Users;
      if (has('custodial', 'utma')) return Baby;
      if (has('managed', 'portfolio')) return Briefcase;
      return TrendingUp;
    }
    case 'retirement': {
      if (has('401', 'ira', 'roth')) return PiggyBank;
      if (has('pension')) return Briefcase;
      if (has('social security', 'benefit')) return DollarSign;
      return PiggyBank;
    }
    case 'vehicles': {
      if (has('insurance')) return Shield;
      if (has('loan', 'lease')) return CreditCard;
      if (has('title', 'registration')) return FileText;
      return Car;
    }
    case 'advisors': {
      if (has('attorney', 'lawyer', 'legal')) return Scale;
      if (has('financial', 'advisor', 'planner', 'investment')) return TrendingUp;
      if (has('cpa', 'accountant', 'tax')) return Calculator;
      if (has('doctor', 'physician', 'md')) return Stethoscope;
      if (has('insurance')) return Shield;
      if (has('realtor', 'real estate')) return Home;
      return UserCheck;
    }
    case 'passwords': {
      if (has('email', 'gmail', 'outlook', 'yahoo')) return Mail;
      if (has('bank', 'credit', 'financial')) return Landmark;
      if (has('social', 'facebook', 'instagram', 'twitter', 'tiktok', 'linkedin')) return Share2;
      return KeyRound;
    }
    case 'pets': {
      if (has('vet', 'veterinar')) return Stethoscope;
      if (has('medication', 'prescription')) return Pill;
      return PawPrint;
    }
    case 'funeral': {
      if (has('obituary')) return FileText;
      if (has('eulogy')) return BookOpen;
      if (has('music', 'song', 'hymn')) return Music;
      if (has('funeral home', 'home')) return Building;
      return Flower2;
    }
    case 'memories': {
      if (has('letter')) return Mail;
      if (has('photo', 'image', 'picture')) return ImageIcon;
      if (has('video')) return Video;
      if (has('voice', 'audio')) return Mic;
      if (has('advice', 'wisdom', 'lesson')) return Lightbulb;
      return Mail;
    }
    case 'property': {
      if (has('jewelry', 'watch', 'ring', 'necklace')) return Crown;
      if (has('art', 'paint', 'sculpture')) return ImageIcon;
      if (has('firearm', 'weapon', 'gun', 'rifle')) return Shield;
      if (has('music', 'instrument', 'guitar', 'piano')) return Music;
      if (has('sport', 'gym', 'bike', 'fitness')) return Activity;
      if (has('antique', 'furniture')) return Building;
      if (has('electronic', 'tech', 'computer', 'camera')) return Video;
      if (has('vehicle', 'atv', 'boat', 'motorcycle')) return Car;
      if (has('coin', 'currency', 'bullion')) return DollarSign;
      if (has('wine', 'spirit', 'whiskey', 'bourbon')) return Flower2;
      if (has('book', 'manuscript', 'rare')) return BookOpen;
      if (has('hobby', 'craft', 'collection', 'memorabilia')) return Sparkles;
      return Package;
    }
    default:
      return FileText;
  }
}
