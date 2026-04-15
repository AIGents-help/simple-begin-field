import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { SECTIONS_CONFIG } from '../../config/sectionsConfig';
import { 
  X, 
  LayoutDashboard, 
  Search, 
  User, 
  Shield, 
  LogOut,
  ChevronRight,
  CreditCard,
  Zap,
  ArrowUpCircle,
  Share2,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { DownloadPacketButton } from '../download/DownloadPacketButton';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const navigate = useNavigate();
  const { 
    activeTab, 
    setTab, 
    view, 
    setView, 
    userDisplayName, 
    userInitials,
    planName,
    isPaid,
    profile,
    signOut 
  } = useAppContext();

  const isAdmin = profile?.role === 'admin';

  const handleNavClick = (id: string, type: string) => {
    if (id === 'pricing') {
      navigate('/pricing');
      if (window.innerWidth < 1024) onClose();
      return;
    }

    if (type === 'view') {
      setView(id as any);
    } else {
      setView('sections');
      setTab(id as any);
    }
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const isActive = (id: string, type: string) => {
    if (type === 'view') return view === id;
    return view === 'sections' && activeTab === id;
  };

  return (
    <>
      {/* Mobile/Tablet Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-navy-muted/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside 
        initial={false}
        animate={{ 
          x: isOpen || window.innerWidth >= 1024 ? 0 : -240,
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed lg:static top-0 left-0 bottom-0 w-[240px] bg-white border-r border-stone-100 z-50 flex flex-col shadow-xl lg:shadow-none"
      >
        {/* Logo / App Name */}
        <div className="p-6 border-b border-stone-50 flex items-center gap-3">
          <div className="w-10 h-10 bg-navy-muted rounded-xl flex items-center justify-center text-white shadow-lg shadow-navy-muted/20">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="font-serif font-bold text-navy-muted text-lg leading-tight">The Survivor Packet</h1>
            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Secure Vault</p>
          </div>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          {/* Main Views */}
          <div className="pb-4 mb-4 border-b border-stone-50">
            <NavItem 
              icon={LayoutDashboard} 
              label="Dashboard" 
              active={isActive('dashboard', 'view')} 
              onClick={() => handleNavClick('dashboard', 'view')} 
            />
            <NavItem 
              icon={Search} 
              label="Search" 
              active={isActive('search', 'view')} 
              onClick={() => handleNavClick('search', 'view')} 
            />
            <NavItem 
              icon={User} 
              label="Profile" 
              active={isActive('profile', 'view')} 
              onClick={() => handleNavClick('profile', 'view')} 
            />
            <NavItem 
              icon={CreditCard} 
              label="Pricing" 
              active={isActive('pricing', 'view')} 
              onClick={() => handleNavClick('pricing', 'view')} 
            />
            <NavItem 
              icon={Share2} 
              label="Affiliate" 
              active={isActive('affiliate', 'view')} 
              onClick={() => handleNavClick('affiliate', 'view')} 
            />
            {isAdmin && (
              <NavItem 
                icon={Settings} 
                label="Admin Panel" 
                active={isActive('admin', 'view')} 
                onClick={() => handleNavClick('admin', 'view')} 
              />
            )}
          </div>

          {/* Sections */}
          <div className="space-y-1">
            <p className="px-4 py-2 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Packet Sections</p>
            {SECTIONS_CONFIG.map((section) => (
              <NavItem 
                key={section.id}
                icon={section.icon} 
                label={section.label} 
                active={isActive(section.id, 'section')} 
                onClick={() => handleNavClick(section.id, 'section')} 
              />
            ))}
          </div>
        </div>

        {/* User / Sign Out */}
        <div className="p-4 border-t border-stone-50 bg-stone-50/50">
          <div className="flex items-center gap-3 p-2 mb-4">
            <div className="w-10 h-10 bg-navy-muted text-white rounded-full flex items-center justify-center font-bold shadow-sm">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-navy-muted truncate">{userDisplayName}</p>
              <div className="flex items-center gap-1.5">
                <p className="text-[10px] text-stone-400 font-medium truncate">
                  {isAdmin ? 'Admin' : planName}
                </p>
                {!isAdmin && !isPaid && (
                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-bold uppercase rounded-full flex items-center gap-0.5">
                    <Zap size={8} fill="currentColor" />
                    Free
                  </span>
                )}
              </div>
            </div>
          </div>

          {!isAdmin && !isPaid && (
            <button
              onClick={() => navigate('/pricing')}
              className="mb-4 mx-2 p-3 bg-navy-muted text-white rounded-xl flex items-center justify-center gap-2 hover:bg-navy-muted/90 transition-all shadow-lg shadow-navy-muted/20 group"
            >
              <ArrowUpCircle size={18} className="group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold uppercase tracking-wider">Upgrade Plan</span>
            </button>
          )}

          <div className="mx-2 mb-2">
            <DownloadPacketButton variant="sidebar" />
          </div>

          <button 
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-stone-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all group"
          >
            <LogOut size={18} className="group-hover:scale-110 transition-transform" />
            <span>Sign Out</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
};

interface NavItemProps {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
}

const NavItem = ({ icon: Icon, label, active, onClick }: NavItemProps) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all group ${
      active 
        ? 'bg-navy-muted text-white shadow-md shadow-navy-muted/10' 
        : 'text-stone-500 hover:bg-stone-50 hover:text-navy-muted'
    }`}
  >
    <div className="flex items-center gap-3">
      <Icon size={18} className={active ? 'text-white' : 'text-stone-400 group-hover:text-navy-muted'} />
      <span className="font-bold text-sm tracking-tight">{label}</span>
    </div>
    {active && <ChevronRight size={14} className="text-white/60" />}
  </button>
);
