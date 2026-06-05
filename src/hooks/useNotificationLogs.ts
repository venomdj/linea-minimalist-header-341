// src/hooks/useNotificationLogs.ts
// Optional: surfaces Telegram notification status in your admin UI.
// Shows which orders successfully notified and which failed.

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface NotificationLog {
  id: string;
  order_id: string;
  channel: string;
  status: 'sent' | 'failed' | 'skipped';
  error_message: string | null;
  created_at: string;
}

export function useNotificationLogs(limit = 20) {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      const { data, error: dbError } = await supabase
        .from('notification_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (dbError) {
        setError(dbError.message);
      } else {
        setLogs((data as NotificationLog[]) ?? []);
      }
      setLoading(false);
    }

    fetchLogs();

    // Live-update when new logs arrive
    const channel = supabase
      .channel('notification-logs-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notification_logs' },
        (payload) => {
          setLogs((prev) => [payload.new as NotificationLog, ...prev].slice(0, limit));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [limit]);

  return { logs, loading, error };
}
