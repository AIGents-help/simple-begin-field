import React from 'react';
import { Shield, Lock, Eye, LogOut, FileText, Trash2, Download, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

export const SecuritySettings: React.FC = () => {
  const navigate = useNavigate();
  const { signOut } = useAppContext();

  const settingsItems = [
    {
      id: 'password',
      label: 'Change Password',
      description: 'Update your login credentials',
      icon: <Lock className="w-5 h-5" />,
      action: () => alert('Password change would be handled via Supabase Auth UI or a dedicated form.')
    },
    {
      id: 'sessions',
      label: 'Active Sessions',
      description: 'Log out of all other devices',
      icon: <LogOut className="w-5 h-5" />,
      action: () => alert('Placeholder for managing active sessions.')
    },
    {
      id: 'policy',
      label: 'View Data Policy',
      description: 'Read how we handle your information',
      icon: <FileText className="w-5 h-5" />,
      action: () => navigate('/legal/usage')
    },
    {
      id: 'download',
      label: 'Download My Data',
      description: 'Get a copy of all your stored records',
      icon: <Download className="w-5 h-5" />,
      action: () => alert('Placeholder for data export feature.')
    },
    {
      id: 'delete',
      label: 'Delete Account',
      description: 'Permanently remove all your data',
      icon: <Trash2 className="w-5 h-5" />,
      action: () => alert('Placeholder for account deletion flow.'),
      danger: true
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Security & Privacy</h2>
            <p className="text-sm text-slate-500">Manage your account protection and data rights</p>
          </div>
        </div>

        <div className="divide-y divide-slate-50">
          {settingsItems.map((item) => (
            <button
              key={item.id}
              onClick={item.action}
              className="w-full flex items-center justify-between py-4 group transition-colors"
            >
              <div className="flex items-center gap-4 text-left">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  item.danger 
                    ? 'bg-rose-50 text-rose-500 group-hover:bg-rose-100' 
                    : 'bg-slate-50 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                }`}>
                  {item.icon}
                </div>
                <div>
                  <h3 className={`font-semibold ${item.danger ? 'text-rose-600' : 'text-slate-900'}`}>
                    {item.label}
                  </h3>
                  <p className="text-xs text-slate-500">{item.description}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-400 group-hover:translate-x-1 transition-all" />
            </button>
          ))}
        </div>
      </div>

      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex items-start gap-3">
        <Lock className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>Tip:</strong> Private items are unlocked temporarily for your active session. 
          Closing the app or logging out will automatically re-lock sensitive sections.
        </p>
      </div>
    </div>
  );
};
