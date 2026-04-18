import React, { useEffect } from 'react';

/**
 * /checkin?token=... — branded landing page that immediately forwards
 * to the verify-checkin edge function which performs the token exchange
 * and renders the final HTML confirmation page.
 */
export const CheckInRedirect: React.FC = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') || '';
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const url = `https://${projectId}.supabase.co/functions/v1/verify-checkin?token=${encodeURIComponent(token)}`;
    window.location.replace(url);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Georgia, serif',
      color: '#57534e',
      background: '#faf7f2',
    }}>
      <div>Confirming your check-in…</div>
    </div>
  );
};

export default CheckInRedirect;
