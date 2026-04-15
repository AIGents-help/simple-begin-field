import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { HavenOwlSvg } from '@/components/haven/HavenOwlSvg';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '../../context/AppContext';
import { toast } from 'sonner';

export const CheckInBanner: React.FC = () => {
  const { user, profile, setView } = useAppContext();
  const [visible, setVisible] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const lastSent = profile.last_checkin_sent_at;
    const lastAcked = profile.last_checkin_acknowledged_at;
    if (!lastSent) return;
    // Show if sent but not acknowledged, or acknowledged before last sent
    if (!lastAcked || new Date(lastAcked) < new Date(lastSent)) {
      setVisible(true);
    }
  }, [profile]);

  if (!visible || !user) return null;

  const getTimeSinceText = () => {
    const lastSent = profile?.last_checkin_sent_at;
    if (!lastSent) return 'a while';
    const diff = Date.now() - new Date(lastSent).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days < 7) return `${days} day${days !== 1 ? 's' : ''}`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `${weeks} week${weeks !== 1 ? 's' : ''}`;
    const months = Math.floor(days / 30);
    return `${months} month${months !== 1 ? 's' : ''}`;
  };

  const handleDismiss = async () => {
    setDismissing(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ last_checkin_acknowledged_at: new Date().toISOString() } as any)
        .eq('id', user.id);
      if (error) throw error;
      setVisible(false);
      toast.success('Thanks for checking in!', { duration: 3000, position: 'bottom-center' });
    } catch (err: any) {
      console.error('Failed to acknowledge check-in:', err);
      toast.error(err.message || 'Failed to dismiss', { duration: 5000, position: 'bottom-center' });
    } finally {
      setDismissing(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-50 to-[#F5F0E8] border border-amber-200/60 rounded-2xl p-5 mb-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <HavenOwlSvg size={48} />
        </div>
        <div className="flex-1 space-y-2">
          <h3 className="text-sm font-serif font-bold text-navy-muted">
            Haven is checking in — is your Packet still accurate?
          </h3>
          <p className="text-xs text-stone-500 leading-relaxed">
            It's been {getTimeSinceText()} since your last review. A few minutes now means everything later.
          </p>
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => setView('sections')}
              className="px-4 py-2 bg-navy-muted text-white rounded-lg text-xs font-bold hover:bg-navy-muted/90 transition-colors"
            >
              Review My Packet
            </button>
            <button
              onClick={handleDismiss}
              disabled={dismissing}
              className="px-4 py-2 border border-stone-300 text-stone-600 rounded-lg text-xs font-bold hover:bg-stone-50 transition-colors disabled:opacity-50"
            >
              {dismissing ? 'Saving...' : 'All looks good'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
