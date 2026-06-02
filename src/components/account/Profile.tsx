// src/pages/account/Profile.tsx
import { useState, useEffect } from "react";
import AccountLayout from "@/components/account/AccountLayout";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { INDIAN_STATES } from "@/data/india";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";

export default function Profile() {
  const { user, refreshProfile } = useAuth();
  const { profile, loading, saving, fetchProfile, updateProfile } = useProfile();

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    address: "",
    address2: "",
    city: "",
    state: "",
    pincode: "",
  });

  useEffect(() => {
    if (user) fetchProfile(user.id);
  }, [user, fetchProfile]);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name:  profile.full_name  ?? "",
        phone:      profile.phone      ?? "",
        address:    profile.address    ?? "",
        address2:   profile.address2   ?? "",
        city:       profile.city       ?? "",
        state:      profile.state      ?? "",
        pincode:    profile.pincode    ?? "",
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    const ok = await updateProfile(user.id, form);
    if (ok) {
      toast.success("Profile updated");
      refreshProfile();
    } else {
      toast.error("Failed to save changes");
    }
  };

  const field = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  return (
    <AccountLayout title="Profile">
      <div className="space-y-6">
        <div className="border border-zinc-800 bg-zinc-950 p-6">
          <p className="text-[11px] font-mono tracking-widest text-zinc-500 uppercase mb-1">Account</p>
          <h2 className="font-display text-xl text-white">Your Profile</h2>
          <p className="text-[12px] text-zinc-500 font-mono mt-1">{user?.email}</p>
        </div>

        {loading ? (
          <div className="border border-zinc-800 bg-zinc-950 p-12 flex justify-center">
            <div className="w-5 h-5 border-2 border-zinc-700 border-t-zinc-300 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="border border-zinc-800 bg-zinc-950 p-6 space-y-5">
            <div>
              <p className="text-[11px] font-mono tracking-widest text-zinc-500 uppercase mb-4">Personal Info</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono tracking-widest text-zinc-500 uppercase mb-1.5">Full Name</label>
                  <input
                    value={form.full_name}
                    onChange={field("full_name")}
                    className="w-full h-10 bg-zinc-900 border border-zinc-700 text-white text-sm font-mono px-3 focus:outline-none focus:border-zinc-500 transition-colors"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono tracking-widest text-zinc-500 uppercase mb-1.5">Phone</label>
                  <input
                    value={form.phone}
                    onChange={field("phone")}
                    type="tel"
                    maxLength={10}
                    className="w-full h-10 bg-zinc-900 border border-zinc-700 text-white text-sm font-mono px-3 focus:outline-none focus:border-zinc-500 transition-colors"
                    placeholder="10-digit mobile"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-5">
              <p className="text-[11px] font-mono tracking-widest text-zinc-500 uppercase mb-4">Default Shipping Address</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-mono tracking-widest text-zinc-500 uppercase mb-1.5">Address Line 1</label>
                  <input
                    value={form.address}
                    onChange={field("address")}
                    className="w-full h-10 bg-zinc-900 border border-zinc-700 text-white text-sm font-mono px-3 focus:outline-none focus:border-zinc-500 transition-colors"
                    placeholder="Street address, flat, building"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono tracking-widest text-zinc-500 uppercase mb-1.5">Address Line 2 <span className="text-zinc-700">(optional)</span></label>
                  <input
                    value={form.address2}
                    onChange={field("address2")}
                    className="w-full h-10 bg-zinc-900 border border-zinc-700 text-white text-sm font-mono px-3 focus:outline-none focus:border-zinc-500 transition-colors"
                    placeholder="Landmark, area"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono tracking-widest text-zinc-500 uppercase mb-1.5">City</label>
                    <input
                      value={form.city}
                      onChange={field("city")}
                      className="w-full h-10 bg-zinc-900 border border-zinc-700 text-white text-sm font-mono px-3 focus:outline-none focus:border-zinc-500 transition-colors"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono tracking-widest text-zinc-500 uppercase mb-1.5">State</label>
                    <select
                      value={form.state}
                      onChange={field("state")}
                      className="w-full h-10 bg-zinc-900 border border-zinc-700 text-white text-sm font-mono px-3 focus:outline-none focus:border-zinc-500 transition-colors"
                    >
                      <option value="">Select state</option>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono tracking-widest text-zinc-500 uppercase mb-1.5">Pincode</label>
                    <input
                      value={form.pincode}
                      onChange={field("pincode")}
                      maxLength={6}
                      className="w-full h-10 bg-zinc-900 border border-zinc-700 text-white text-sm font-mono px-3 focus:outline-none focus:border-zinc-500 transition-colors"
                      placeholder="6-digit"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-black text-[11px] font-mono tracking-widest uppercase hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        )}
      </div>
    </AccountLayout>
  );
}
