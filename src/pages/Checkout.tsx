import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Minus, Plus, Trash2, Check, ShieldCheck, Lock, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import CheckoutHeader from "@/components/header/CheckoutHeader";
import Footer from "@/components/footer/Footer";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/data/products";

const buyerSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  firstName: z.string().trim().min(1, "Required").max(80),
  lastName: z.string().trim().min(1, "Required").max(80),
  phone: z
    .string()
    .trim()
    .min(6, "Enter a valid phone")
    .max(30)
    .regex(/^[+0-9()\-\s]+$/, "Invalid phone"),
  address: z.string().trim().min(3, "Required").max(160),
  address2: z.string().trim().max(160).optional().or(z.literal("")),
  city: z.string().trim().min(1, "Required").max(80),
  postalCode: z.string().trim().min(2, "Required").max(20),
  country: z.string().trim().min(2, "Required").max(80),
  shipping: z.enum(["standard", "express", "overnight"]),
});

type BuyerForm = z.infer<typeof buyerSchema>;
type FormErrors = Partial<Record<keyof BuyerForm, string>>;

const shippingOptions = [
  { id: "standard", label: "Standard · Insured", eta: "5–7 business days", price: 0 },
  { id: "express", label: "Express · Signature required", eta: "2–3 business days", price: 25 },
  { id: "overnight", label: "Overnight · White Glove", eta: "Next business day", price: 75 },
] as const;

const initial: BuyerForm = {
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
  address: "",
  address2: "",
  city: "",
  postalCode: "",
  country: "",
  shipping: "standard",
};

const Checkout = () => {
  const navigate = useNavigate();
  const { items, subtotal, setQty, remove, clear } = useCart();
  const [form, setForm] = useState<BuyerForm>(initial);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const shippingCost = shippingOptions.find((s) => s.id === form.shipping)?.price ?? 0;
  const taxes = Math.round(subtotal * 0.08);
  const total = subtotal + shippingCost + taxes;

  const update = <K extends keyof BuyerForm>(key: K, value: BuyerForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = buyerSchema.safeParse(form);
    if (!parsed.success) {
      const next: FormErrors = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof BuyerForm;
        if (!next[k]) next[k] = issue.message;
      }
      setErrors(next);
      toast.error("Please correct the highlighted fields");
      return;
    }
    if (items.length === 0) {
      toast.error("Your bag is empty");
      return;
    }
    setSubmitting(true);
    // Placeholder until Stripe is wired up
    await new Promise((r) => setTimeout(r, 1200));
    setSubmitting(false);
    setSuccess(true);
    clear();
    toast.success("Order placed");
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <CheckoutHeader />
        <main className="flex-1 flex items-center justify-center px-6 py-24">
          <div className="max-w-md text-center space-y-6">
            <div className="w-14 h-14 mx-auto rounded-full border border-verified/40 flex items-center justify-center">
              <Check size={22} className="text-verified" />
            </div>
            <p className="eyebrow">Order Received</p>
            <h1 className="font-display text-3xl text-foreground tracking-tight">
              Your vault is being prepared.
            </h1>
            <p className="text-sm text-muted-foreground">
              We've sent a confirmation to <span className="text-foreground">{form.email}</span>. Authentication
              and insured shipping begin shortly.
            </p>
            <Button
              onClick={() => navigate("/")}
              className="rounded-none bg-foreground text-background hover:bg-foreground/90 px-8 h-12 text-xs tracking-wider"
            >
              CONTINUE BROWSING
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <CheckoutHeader />

      <main className="flex-1 pt-10 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-10">
            <p className="eyebrow mb-2">Secure Checkout</p>
            <h1 className="font-display text-3xl md:text-4xl text-foreground tracking-tight">
              Complete your acquisition
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Forms */}
            <div className="lg:col-span-2 space-y-10">
              {/* Contact */}
              <section className="border border-border bg-surface-1 p-6 md:p-8">
                <header className="flex items-baseline justify-between mb-6">
                  <h2 className="font-display text-lg text-foreground tracking-tight">Contact</h2>
                  <span className="eyebrow">Step 01</span>
                </header>
                <Field label="Email *" error={errors.email}>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="you@example.com"
                    className="rounded-none bg-background border-border h-11"
                    autoComplete="email"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4 mt-5">
                  <Field label="First Name *" error={errors.firstName}>
                    <Input
                      value={form.firstName}
                      onChange={(e) => update("firstName", e.target.value)}
                      className="rounded-none bg-background border-border h-11"
                      autoComplete="given-name"
                    />
                  </Field>
                  <Field label="Last Name *" error={errors.lastName}>
                    <Input
                      value={form.lastName}
                      onChange={(e) => update("lastName", e.target.value)}
                      className="rounded-none bg-background border-border h-11"
                      autoComplete="family-name"
                    />
                  </Field>
                </div>
                <div className="mt-5">
                  <Field label="Phone *" error={errors.phone}>
                    <Input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      placeholder="+1 555 000 0000"
                      className="rounded-none bg-background border-border h-11"
                      autoComplete="tel"
                    />
                  </Field>
                </div>
              </section>

              {/* Shipping address */}
              <section className="border border-border bg-surface-1 p-6 md:p-8">
                <header className="flex items-baseline justify-between mb-6">
                  <h2 className="font-display text-lg text-foreground tracking-tight">Shipping Address</h2>
                  <span className="eyebrow">Step 02</span>
                </header>
                <Field label="Address *" error={errors.address}>
                  <Input
                    value={form.address}
                    onChange={(e) => update("address", e.target.value)}
                    placeholder="Street address"
                    className="rounded-none bg-background border-border h-11"
                    autoComplete="address-line1"
                  />
                </Field>
                <div className="mt-5">
                  <Field label="Apartment, suite, etc." error={errors.address2}>
                    <Input
                      value={form.address2 ?? ""}
                      onChange={(e) => update("address2", e.target.value)}
                      className="rounded-none bg-background border-border h-11"
                      autoComplete="address-line2"
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-5">
                  <Field label="City *" error={errors.city}>
                    <Input
                      value={form.city}
                      onChange={(e) => update("city", e.target.value)}
                      className="rounded-none bg-background border-border h-11"
                      autoComplete="address-level2"
                    />
                  </Field>
                  <Field label="Postal Code *" error={errors.postalCode}>
                    <Input
                      value={form.postalCode}
                      onChange={(e) => update("postalCode", e.target.value)}
                      className="rounded-none bg-background border-border h-11"
                      autoComplete="postal-code"
                    />
                  </Field>
                </div>
                <div className="mt-5">
                  <Field label="Country *" error={errors.country}>
                    <Input
                      value={form.country}
                      onChange={(e) => update("country", e.target.value)}
                      placeholder="United States"
                      className="rounded-none bg-background border-border h-11"
                      autoComplete="country-name"
                    />
                  </Field>
                </div>
              </section>

              {/* Shipping method */}
              <section className="border border-border bg-surface-1 p-6 md:p-8">
                <header className="flex items-baseline justify-between mb-6">
                  <h2 className="font-display text-lg text-foreground tracking-tight">Shipping Method</h2>
                  <span className="eyebrow">Step 03</span>
                </header>
                <RadioGroup
                  value={form.shipping}
                  onValueChange={(v) => update("shipping", v as BuyerForm["shipping"])}
                  className="space-y-3"
                >
                  {shippingOptions.map((opt) => (
                    <label
                      key={opt.id}
                      htmlFor={`ship-${opt.id}`}
                      className={`flex items-center justify-between gap-4 border p-4 cursor-pointer transition-colors ${
                        form.shipping === opt.id
                          ? "border-foreground/40 bg-surface-2"
                          : "border-border hover:border-foreground/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem id={`ship-${opt.id}`} value={opt.id} />
                        <div>
                          <p className="text-sm text-foreground">{opt.label}</p>
                          <p className="text-xs text-muted-foreground font-mono tracking-wider mt-0.5">{opt.eta}</p>
                        </div>
                      </div>
                      <span className="text-sm text-foreground font-mono tabular-nums">
                        {opt.price === 0 ? "FREE" : formatPrice(opt.price)}
                      </span>
                    </label>
                  ))}
                </RadioGroup>
              </section>

              {/* Payment placeholder */}
              <section className="border border-border bg-surface-1 p-6 md:p-8">
                <header className="flex items-baseline justify-between mb-6">
                  <h2 className="font-display text-lg text-foreground tracking-tight">Payment</h2>
                  <span className="eyebrow">Step 04</span>
                </header>
                <div className="flex items-start gap-3 border border-dashed border-border p-4 text-xs text-muted-foreground">
                  <Lock size={14} className="mt-0.5 text-foreground/60" />
                  <p>
                    Stripe-secured payment is wired up in the next step. For now you can submit to validate the
                    flow — no card will be charged.
                  </p>
                </div>
              </section>
            </div>

            {/* Order Summary */}
            <aside className="lg:col-span-1">
              <div className="border border-border bg-surface-1 p-6 md:p-8 sticky top-24 space-y-6">
                <div className="flex items-baseline justify-between">
                  <h2 className="font-display text-lg text-foreground tracking-tight">Order Summary</h2>
                  <span className="eyebrow">{items.length} item{items.length !== 1 ? "s" : ""}</span>
                </div>

                {items.length === 0 ? (
                  <div className="text-center py-10 space-y-4">
                    <p className="text-sm text-muted-foreground">Your bag is empty.</p>
                    <Button
                      asChild
                      variant="outline"
                      className="rounded-none border-border hover:border-foreground/40 bg-transparent text-xs tracking-wider"
                    >
                      <Link to="/category/all">BROWSE MARKETPLACE</Link>
                    </Button>
                  </div>
                ) : (
                  <>
                    <ul className="space-y-5 max-h-[360px] overflow-y-auto pr-1">
                      {items.map((item) => (
                        <li key={item.id} className="flex gap-4">
                          <div className="w-16 h-20 bg-surface-2 overflow-hidden shrink-0">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="eyebrow truncate">{item.series}</p>
                            <p className="text-sm text-foreground truncate">{item.name}</p>
                            <div className="mt-2 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setQty(item.id, item.quantity - 1)}
                                aria-label="Decrease"
                                className="w-6 h-6 border border-border hover:border-foreground/40 flex items-center justify-center"
                              >
                                <Minus size={11} />
                              </button>
                              <span className="text-xs font-mono tabular-nums min-w-[2ch] text-center">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => setQty(item.id, item.quantity + 1)}
                                aria-label="Increase"
                                className="w-6 h-6 border border-border hover:border-foreground/40 flex items-center justify-center"
                              >
                                <Plus size={11} />
                              </button>
                              <button
                                type="button"
                                onClick={() => remove(item.id)}
                                aria-label="Remove"
                                className="ml-auto text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-foreground font-mono tabular-nums whitespace-nowrap">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </li>
                      ))}
                    </ul>

                    <div className="border-t border-border pt-5 space-y-2.5 text-sm">
                      <Row label="Subtotal" value={formatPrice(subtotal)} />
                      <Row
                        label="Shipping"
                        value={shippingCost === 0 ? "Free" : formatPrice(shippingCost)}
                      />
                      <Row label="Estimated tax" value={formatPrice(taxes)} muted />
                    </div>

                    <div className="border-t border-border pt-5 flex items-baseline justify-between">
                      <span className="text-sm text-foreground">Total</span>
                      <span className="font-display text-2xl text-foreground tabular-nums">
                        {formatPrice(total)}
                      </span>
                    </div>

                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full h-12 rounded-none bg-foreground text-background hover:bg-foreground/90 text-xs tracking-[0.18em]"
                    >
                      {submitting ? "PROCESSING…" : `PLACE ORDER · ${formatPrice(total)}`}
                    </Button>

                    <ul className="space-y-2 pt-2 text-[11px] font-mono tracking-wider text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <ShieldCheck size={12} className="text-verified" /> ESCROW PROTECTED
                      </li>
                      <li className="flex items-center gap-2">
                        <Truck size={12} className="text-verified" /> INSURED WHITE-GLOVE SHIPPING
                      </li>
                      <li className="flex items-center gap-2">
                        <Lock size={12} className="text-verified" /> ENCRYPTED CHECKOUT
                      </li>
                    </ul>
                  </>
                )}
              </div>
            </aside>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

const Field = ({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) => (
  <div>
    <Label className="eyebrow block mb-2">{label}</Label>
    {children}
    {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
  </div>
);

const Row = ({ label, value, muted }: { label: string; value: string; muted?: boolean }) => (
  <div className="flex justify-between">
    <span className={muted ? "text-muted-foreground" : "text-muted-foreground"}>{label}</span>
    <span className={`tabular-nums font-mono ${muted ? "text-muted-foreground" : "text-foreground"}`}>
      {value}
    </span>
  </div>
);

export default Checkout;
