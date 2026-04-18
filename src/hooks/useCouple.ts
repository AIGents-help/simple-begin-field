import { useCallback, useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import {
  coupleService,
  CoupleLink,
  CouplePermission,
  CoupleActivityEntry,
} from '../services/coupleService';

interface PartnerSummary {
  id: string;
  full_name: string | null;
  email: string | null;
  last_login_at: string | null;
}

export interface UseCoupleResult {
  loading: boolean;
  link: CoupleLink | null;
  partner: PartnerSummary | null;
  partnerPacketId: string | null;
  partnerHealthScore: number | null;
  partnerScoreChange: number | null;
  myHealthScore: number | null;
  myPermissions: CouplePermission[];     // permissions I'm granting (granting_user_id = me)
  partnerPermissions: CouplePermission[]; // permissions partner is granting to me
  activity: CoupleActivityEntry[];
  refresh: () => Promise<void>;
}

export const useCouple = (): UseCoupleResult => {
  const { user } = useAppContext();
  const [state, setState] = useState<Omit<UseCoupleResult, 'refresh'>>({
    loading: true,
    link: null,
    partner: null,
    partnerPacketId: null,
    partnerHealthScore: null,
    partnerScoreChange: null,
    myHealthScore: null,
    myPermissions: [],
    partnerPermissions: [],
    activity: [],
  });

  const load = useCallback(async () => {
    if (!user) {
      setState((s) => ({ ...s, loading: false, link: null, partner: null }));
      return;
    }
    setState((s) => ({ ...s, loading: true }));

    const link = await coupleService.getActiveLink(user.id);
    if (!link || link.status !== 'active' || !link.user_id_2) {
      setState({
        loading: false,
        link,
        partner: null,
        partnerPacketId: null,
        partnerHealthScore: null,
        partnerScoreChange: null,
        myHealthScore: null,
        myPermissions: [],
        partnerPermissions: [],
        activity: [],
      });
      return;
    }

    const partnerId = link.user_id_1 === user.id ? link.user_id_2 : link.user_id_1;

    const [partner, partnerPacket, partnerHealth, myHealth, myPerms, partnerPerms, activity] = await Promise.all([
      coupleService.getPartnerProfile(partnerId),
      coupleService.getPartnerPacket(partnerId),
      coupleService.getPartnerHealthScore(partnerId),
      coupleService.getMyHealthScore(user.id),
      coupleService.getPermissions(link.id, user.id),
      coupleService.getPermissions(link.id, partnerId),
      coupleService.getRecentActivity(link.id, 25),
    ]);

    setState({
      loading: false,
      link,
      partner: partner as PartnerSummary | null,
      partnerPacketId: partnerPacket?.id ?? null,
      partnerHealthScore: (partnerHealth as any)?.total_score ?? null,
      partnerScoreChange: (partnerHealth as any)?.score_change ?? null,
      myHealthScore: (myHealth as any)?.total_score ?? null,
      myPermissions: myPerms,
      partnerPermissions: partnerPerms,
      activity,
    });
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, refresh: load };
};
