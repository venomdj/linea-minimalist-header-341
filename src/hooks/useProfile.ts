// src/hooks/useProfile.ts
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesUpdate } from '@/integrations/supabase/types';

export type Profile = Tables<'profiles'>;
export type ProfileUpdate = TablesUpdate<'profiles'>;

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [saving, setSaving]     = useState(false);

  const fetchProfile = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (err) throw err;
      setProfile(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (userId: string, updates: ProfileUpdate): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();
      if (err) throw err;
      setProfile(data);
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update profile');
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  return { profile, loading, error, saving, fetchProfile, updateProfile, setProfile };
}
