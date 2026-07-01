import { useState } from "react";
import { MapPin, Plus, Star, Pencil, Trash2, X, Check } from "lucide-react";
import AccountLayout from "@/components/account/AccountLayout";
import { useAuth } from "@/context/AuthContext";
import { useAddresses, type SavedAddress, type AddressInput } from "@/hooks/useAddresses";

const EMPTY: AddressInput = {
  label: "Home",
  full_name: "",
  phone: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
  is_default: false,
};

export default function Addresses() {
  const { user } = useAuth();
  const { addresses, loading, upsert, remove, setDefault } = useAddresses(user?.id);
  const [editing, setEditing] = useState<(AddressInput & { id?: string }) | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const openNew = () => { setErr(null); setEditing({ ...EMPTY, is_default: addresses.length === 0 }); };
  const openEdit = (a: SavedAddress) => { setErr(null); setEditing({ ...a }); };
  const close = () => { setEditing(null); setErr(null); };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    const res = await upsert(editing);
    setSaving(false);
    if (res.error) setErr(res.error);
    else close();
  };

  return (
    <AccountLayout title="Addresses">
      <div className="space-y-5">
        <div className="border border-zinc-800 bg-zinc-950 p-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-mono tracking-widest text-zinc-500 uppercase mb-1">Account</p>
            <h2 className="font-display text-xl text-white">Saved Addresses</h2>
            <p className="text-[12px] text-zinc-500 font-mono mt-1">
              {addresses.length} address{addresses.length !== 1 ? "es" : ""} on file
            </p>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 text-[11px] font-mono font-semibold tracking-widest text-accent-foreground bg-accent hover:bg-accent/85 px-4 py-2.5 transition-colors uppercase"
          >
            <Plus size={13} /> Add Address
          </button>
        </div>

        {loading ? (
          <div className="border border-zinc-800 bg-zinc-950 p-12 flex justify-center">
            <div className="w-5 h-5 border-2 border-zinc-700 border-t-zinc-300 rounded-full animate-spin" />
          </div>
        ) : addresses.length === 0 ? (
          <div className="border border-zinc-800 bg-zinc-950 p-12 text-center">
            <MapPin size={32} className="mx-auto mb-4 text-zinc-700" strokeWidth={1} />
            <p className="text-[12px] font-mono text-zinc-600 tracking-wider">No addresses saved yet</p>
            <button
              onClick={openNew}
              className="inline-block mt-5 text-[11px] font-mono tracking-widest text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 px-5 py-2.5 transition-colors uppercase"
            >
              + Add Your First Address
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {addresses.map((a) => (
              <div key={a.id} className={`relative border ${a.is_default ? "border-accent/50" : "border-zinc-800"} bg-zinc-950 p-5`}>
                {a.is_default && (
                  <span className="absolute top-3 right-3 flex items-center gap-1 text-[9px] font-mono tracking-widest uppercase text-accent">
                    <Star size={10} fill="currentColor" /> Default
                  </span>
                )}
                <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2">{a.label}</p>
                <p className="text-sm text-white font-medium">{a.full_name}</p>
                <p className="text-[12px] text-zinc-400 font-mono mt-1 leading-relaxed">
                  {a.address_line1}
                  {a.address_line2 ? `, ${a.address_line2}` : ""}<br />
                  {a.city}, {a.state} — {a.pincode}<br />
                  {a.country} · {a.phone}
                </p>
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-zinc-800/60">
                  {!a.is_default && (
                    <button
                      onClick={() => setDefault(a.id)}
                      className="text-[10px] font-mono tracking-widest uppercase text-zinc-500 hover:text-accent transition-colors"
                    >
                      Set default
                    </button>
                  )}
                  <button onClick={() => openEdit(a)} className="ml-auto p-1.5 text-zinc-500 hover:text-white transition-colors" aria-label="Edit">
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => window.confirm("Delete this address?") && remove(a.id)}
                    className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                    aria-label="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={close}>
          <div className="w-full max-w-lg border border-zinc-800 bg-zinc-950 p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg text-white">{editing.id ? "Edit Address" : "New Address"}</h3>
              <button onClick={close} className="text-zinc-500 hover:text-white"><X size={18} /></button>
            </div>

            <div className="space-y-3">
              {[
                ["label", "Label (Home, Work…)"],
                ["full_name", "Full Name"],
                ["phone", "Phone"],
                ["address_line1", "Address Line 1"],
                ["address_line2", "Address Line 2 (optional)"],
                ["city", "City"],
                ["state", "State"],
                ["pincode", "Pincode"],
                ["country", "Country"],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1">{label}</label>
                  <input
                    value={(editing as Record<string, string>)[key] ?? ""}
                    onChange={(e) => setEditing({ ...editing, [key]: e.target.value })}
                    className="w-full bg-background border border-zinc-800 focus:border-accent/60 text-white text-sm font-mono px-3 py-2 outline-none transition-colors"
                  />
                </div>
              ))}
              <label className="flex items-center gap-2 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.is_default}
                  onChange={(e) => setEditing({ ...editing, is_default: e.target.checked })}
                  className="accent-accent"
                />
                <span className="text-[12px] font-mono text-zinc-400">Set as default shipping address</span>
              </label>
              {err && <p className="text-[11px] font-mono text-red-400">{err}</p>}
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={close}
                className="flex-1 py-2.5 text-[11px] font-mono tracking-widest uppercase border border-zinc-700 text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 text-[11px] font-mono font-semibold tracking-widest uppercase bg-accent text-accent-foreground hover:bg-accent/85 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {saving ? "Saving…" : (<><Check size={12} /> Save Address</>)}
              </button>
            </div>
          </div>
        </div>
      )}
    </AccountLayout>
  );
}
