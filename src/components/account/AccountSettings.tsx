// src/pages/account/AccountSettings.tsx
import { useState } from "react";
import { toast } from "sonner";
import { LogOut, Trash2, Shield } from "lucide-react";
import AccountLayout from "@/components/account/AccountLayout";
import { useAuth } from "@/context/AuthContext";

export default function AccountSettings() {
  const { user, signOut } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
  };

  const handleDeleteRequest = () => {
    toast.info("To delete your account, contact support@mythicalvault.in");
  };

  return (
    <AccountLayout title="Settings">
      <div className="space-y-5">
        <div className="border border-zinc-800 bg-zinc-950 p-6">
          <p className="text-[11px] font-mono tracking-widest text-zinc-500 uppercase mb-1">Account</p>
          <h2 className="font-display text-xl text-white">Settings</h2>
        </div>

        {/* Account info */}
        <div className="border border-zinc-800 bg-zinc-950 p-6 space-y-4">
          <p className="text-[11px] font-mono tracking-widest text-zinc-500 uppercase">Account Info</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-mono tracking-widest text-zinc-600 uppercase mb-1">Email</p>
              <p className="text-sm font-mono text-zinc-300">{user?.email}</p>
            </div>
            <div>
              <p className="text-[10px] font-mono tracking-widest text-zinc-600 uppercase mb-1">Authentication</p>
              <div className="flex items-center gap-1.5">
                <Shield size={12} className="text-green-400" />
                <p className="text-sm font-mono text-zinc-300">Google OAuth</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-mono tracking-widest text-zinc-600 uppercase mb-1">User ID</p>
              <p className="text-[11px] font-mono text-zinc-600 truncate">{user?.id}</p>
            </div>
            <div>
              <p className="text-[10px] font-mono tracking-widest text-zinc-600 uppercase mb-1">Member Since</p>
              <p className="text-sm font-mono text-zinc-300">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="border border-zinc-800 bg-zinc-950 p-6 space-y-4">
          <p className="text-[11px] font-mono tracking-widest text-zinc-500 uppercase">Security</p>
          <p className="text-[12px] font-mono text-zinc-500">
            You're signed in via Google. Password management is handled through your Google account.
          </p>
        </div>

        {/* Notifications placeholder */}
        <div className="border border-zinc-800 bg-zinc-950 p-6 space-y-4">
          <p className="text-[11px] font-mono tracking-widest text-zinc-500 uppercase">Notifications</p>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-[13px] text-zinc-300 font-mono">Order Updates</p>
              <p className="text-[11px] font-mono text-zinc-600 mt-0.5">Status changes, shipping notifications</p>
            </div>
            <div className="w-8 h-4 bg-green-400/20 border border-green-400/40 rounded-full relative">
              <div className="absolute right-0.5 top-0.5 w-3 h-3 rounded-full bg-green-400" />
            </div>
          </div>
        </div>

        {/* Sign out */}
        <div className="border border-zinc-800 bg-zinc-950 p-6 space-y-4">
          <p className="text-[11px] font-mono tracking-widest text-zinc-500 uppercase">Session</p>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2.5 border border-zinc-700 text-[11px] font-mono tracking-widest text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors uppercase"
          >
            <LogOut size={13} />
            Sign Out
          </button>
        </div>

        {/* Danger zone */}
        <div className="border border-red-900/40 bg-zinc-950 p-6 space-y-4">
          <p className="text-[11px] font-mono tracking-widest text-red-400/70 uppercase">Danger Zone</p>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-2 px-4 py-2.5 border border-red-900/50 text-[11px] font-mono tracking-widest text-red-400/70 hover:text-red-400 hover:border-red-900 transition-colors uppercase"
            >
              <Trash2 size={13} />
              Delete Account
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-[12px] font-mono text-zinc-400">Are you sure? This action cannot be undone.</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDeleteRequest}
                  className="px-4 py-2 bg-red-900/30 border border-red-900/50 text-[11px] font-mono tracking-widest text-red-400 hover:bg-red-900/50 transition-colors uppercase"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-4 py-2 border border-zinc-700 text-[11px] font-mono tracking-widest text-zinc-400 hover:text-white transition-colors uppercase"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AccountLayout>
  );
}
