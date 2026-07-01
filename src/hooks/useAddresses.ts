import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SavedAddress {
  id: string;
  user_id: string;
  label: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export type AddressInput = Omit<SavedAddress, "id" | "user_id" | "created_at" | "updated_at">;

export function useAddresses(userId: string | null | undefined) {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAddresses = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error: err } = await supabase
      .from("saved_addresses" as never)
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    if (err) setError(err.message);
    else setAddresses((data ?? []) as SavedAddress[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchAddresses(); }, [fetchAddresses]);

  const upsert = async (payload: Partial<AddressInput> & { id?: string }) => {
    if (!userId) return { error: "Not signed in" };
    // If setting as default, clear others first
    if (payload.is_default) {
      await supabase.from("saved_addresses" as never).update({ is_default: false } as never).eq("user_id", userId);
    }
    const row = { ...payload, user_id: userId };
    const { error: err } = payload.id
      ? await supabase.from("saved_addresses" as never).update(row as never).eq("id", payload.id)
      : await supabase.from("saved_addresses" as never).insert(row as never);
    if (err) return { error: err.message };
    await fetchAddresses();
    return {};
  };

  const remove = async (id: string) => {
    const { error: err } = await supabase.from("saved_addresses" as never).delete().eq("id", id);
    if (err) return { error: err.message };
    await fetchAddresses();
    return {};
  };

  const setDefault = async (id: string) => {
    if (!userId) return { error: "Not signed in" };
    await supabase.from("saved_addresses" as never).update({ is_default: false } as never).eq("user_id", userId);
    const { error: err } = await supabase.from("saved_addresses" as never).update({ is_default: true } as never).eq("id", id);
    if (err) return { error: err.message };
    await fetchAddresses();
    return {};
  };

  return { addresses, loading, error, refetch: fetchAddresses, upsert, remove, setDefault };
}
