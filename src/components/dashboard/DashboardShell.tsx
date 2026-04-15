import React from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Package, 
  CreditCard, 
  Mail, 
  Share2, 
  Settings, 
  LayoutDashboard, 
  FileText, 
  Activity,
  LogOut,
  ChevronRight,
  Link as LinkIcon,
  DollarSign,
  Scale,
  User
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavItem {
  label: string;
  icon: any;
  path: string;
  roles: ('admin' | 'professional')[];
}

const NAV_ITEMS: NavItem[] = [
  // Admin Nav
  { label: 'Overview', icon: LayoutDashboard, path: '/dashboard', roles: ['admin'] },
  { label: 'Customers', icon: Users, path: '/dashboard/customers', roles: ['admin'] },
  { label: 'Packets', icon: Package, path: '/dashboard/packets', roles: ['admin'] },
  { label: 'Billing', icon: CreditCard, path: '/dashboard/billing', roles: ['admin'] },
  { label: 'Invites', icon: Mail, path: '/dashboard/invites', roles: ['admin'] },
  { label: 'Affiliates', icon: Share2, path: '/dashboard/affiliates', roles: ['admin'] },
  { label: 'Plans', icon: FileText, path: '/dashboard/plans', roles: ['admin'] },
  { label: 'Activity', icon: Activity, path: '/dashboard/activity', roles: ['admin'] },
  { label: 'Settings', icon: Settings, path: '/dashboard/settings', roles: ['admin'] },

  // Professional Nav
  { label: 'Overview', icon: LayoutDashboard, path: '/dashboard', roles: ['professional'] },
  { label: 'My Referrals', icon: Users, path: '/dashboard/referrals', roles: ['professional'] },
  { label: 'My Links', icon: LinkIcon, path: '/dashboard/links', roles: ['professional'] },
  { label: 'My Conversions', icon: Activity, path: '/dashboard/conversions', roles: ['professional'] },
  { label: 'Payouts', icon: DollarSign, path: '/dashboard/payouts', roles: ['professional'] },
  { label: 'Profile', icon: User, path: '/dashboard/profile', roles: ['professional'] },
  { label: 'Attorney Portal', icon: Scale, path: '/dashboard/attorney-portal', roles: ['professional'] },
];

export const DashboardShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, signOut } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  const userRole = profile?.role as 'admin' | 'professional' | 'user';
  const filteredNav = NAV_ITEMS.filter(item => item.roles.includes(userRole as any));

  if (userRole === 'user') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-serif text-stone-900 mb-4 italic">Access Restricted</h1>
          <p className="text-stone-600 mb-8">
            This area is for administrators and professional partners only.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-stone-900 text-white rounded-full text-sm font-medium hover:bg-stone-800 transition-colors"
          >
            Return to Packet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-stone-200 flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-stone-100">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="font-serif italic text-lg text-stone-900">Survivor Packet</span>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold">
            {userRole === 'admin' ? 'Admin Operations' : 'Professional Partner'}
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {filteredNav.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
                  isActive 
                    ? 'bg-stone-900 text-white shadow-sm' 
                    : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900'
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-stone-400 group-hover:text-stone-600'}`} />
                {item.label}
                {isActive && <ChevronRight className="w-3 h-3 ml-auto opacity-50" />}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-stone-100">
          <div className="flex items-center gap-3 px-3 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 font-medium text-xs">
              {profile?.full_name?.charAt(0) || user?.email?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-stone-900 truncate">{profile?.full_name || 'User'}</p>
              <p className="text-[10px] text-stone-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-16 bg-white border-b border-stone-200 px-8 flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-sm font-medium text-stone-500 uppercase tracking-wider">
            {filteredNav.find(item => item.path === location.pathname)?.label || 'Dashboard'}
          </h2>
          <div className="flex items-center gap-4">
            <button className="p-2 text-stone-400 hover:text-stone-600 transition-colors">
              <Activity className="w-5 h-5" />
            </button>
            <div className="h-6 w-px bg-stone-200" />
            <button 
              onClick={() => navigate('/')}
              className="text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors"
            >
              View Site
            </button>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
