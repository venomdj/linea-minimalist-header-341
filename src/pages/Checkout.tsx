import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { z } from "zod";
import {
  Minus,
  Plus,
  Trash2,
  Check,
  ShieldCheck,
  Lock,
  Truck,
  Copy,
  Upload,
  MessageCircle,
  Smartphone,
  Clock,
  PackageSearch,
  X,
  BookmarkPlus,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Zap,
  Mail,
  User,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import CheckoutHeader from "@/components/header/CheckoutHeader";
import Footer from "@/components/footer/Footer";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/data/products";
import {
  INDIAN_STATES,
  ORIGIN_STATE,
  GST_RATE,
  IndianState,
  UPI_ID,
  UPI_MERCHANT_NAME,
  WHATSAPP_NUMBER,
} from "@/data/india";
import { sendNewOrderEmails } from "@/lib/emailService";

// ─── Validation schema ────────────────────────────────────────────────────────
const buyerSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  fullName: z.string().trim().min(2, "Full name is required").max(120),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  address: z.string().trim().min(3, "Required").max(160),
  address2: z.string().trim().max(160).optional().or(z.literal("")),
  city: z.string().trim().min(1, "Required").max(80),
  state: z.string().trim().refine((v) => (INDIAN_STATES as readonly string[]).includes(v), {
    message: "Select a state",
  }),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Pincode must be 6 digits"),
  shipping: z.enum(["standard", "express"]),
  paymentMethod: z.enum(["upi", "cod"]),
  screenshotName: z.string().optional().or(z.literal("")),
});

type BuyerForm = z.infer<typeof buyerSchema>;
type FormErrors = Partial<Record<keyof BuyerForm, string>>;

// ─── Shipping options ─────────────────────────────────────────────────────────
export const shippingOptions = [
  { id: "standard", label: "Standard · Insured",           eta: "5–7 business days", price: 120 },
  { id: "express",  label: "Express · Signature required", eta: "2–3 business days", price: 250 },
] as const;

type ShippingId = (typeof shippingOptions)[number]["id"];

// ─── Pricing calculator ───────────────────────────────────────────────────────
export function calcPricing(subtotal: number, shippingId: ShippingId, state: string) {
  const shippingCost = shippingOptions.find((s) => s.id === shippingId)?.price ?? 0;
  const taxableValue = Math.round(subtotal / (1 + GST_RATE));
  const totalGst     = subtotal - taxableValue;
  const sameState    = state === ORIGIN_STATE;
  const cgst = sameState ? Math.round(totalGst / 2) : 0;
  const sgst = sameState ? totalGst - cgst : 0;
  const igst = sameState ? 0 : totalGst;
  const total = subtotal + shippingCost;
  return {
    shippingCost, taxableValue, totalGst, sameState, cgst, sgst, igst,
    total, subtotal, gstAmount: totalGst,
  };
}

// ─── Form state ───────────────────────────────────────────────────────────────
const initial: BuyerForm = {
  email: "", fullName: "", phone: "", address: "", address2: "",
  city: "", state: "", pincode: "", shipping: "standard",
  paymentMethod: "upi", screenshotName: "",
};

const SAVED_DETAILS_KEY  = "mythicalvault.buyer.v1";
const RESERVATION_MINUTES = 15;
type SavedDetails = Omit<BuyerForm, "shipping" | "screenshotName">;

const generateOrderId = () => {
  const ts   = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `MVLT-${ts}-${rand}`;
};

// ─── Progress steps ───────────────────────────────────────────────────────────
const STEPS = ["Cart", "Shipping", "Payment", "Confirmation"] as const;

// ─── Trust badges ─────────────────────────────────────────────────────────────
const TRUST_BADGES = [
  { icon: ShieldCheck, label: "Secure UPI Payments" },
  { icon: Lock,        label: "Manual Verification" },
  { icon: RefreshCw,   label: "Refund Support" },
  { icon: Clock,       label: `Card Reserved ${RESERVATION_MINUTES} Min` },
] as const;

// ─── UPI apps ─────────────────────────────────────────────────────────────────
const UPI_APPS = [
  { name: "GPay",    scheme: (link: string) => link.replace("upi://", "gpay://upi/") },
  { name: "PhonePe", scheme: (link: string) => link.replace("upi://", "phonepe://pay?") },
  { name: "Paytm",   scheme: (link: string) => link.replace("upi://", "paytmmp://pay?") },
  { name: "BHIM",    scheme: (link: string) => link },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────
const Checkout = () => {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const { items, subtotal, setQty, remove, clear, hasOutOfStockItems, refreshStock } = useCart();

  useEffect(() => { refreshStock(); }, [refreshStock]);

  const [form,            setForm]            = useState<BuyerForm>(initial);
  const [errors,          setErrors]          = useState<FormErrors>({});
  const [submitting,      setSubmitting]      = useState(false);
  const [success,         setSuccess]         = useState<null | {
    orderId: string; total: number; email: string; fullName: string; phone: string;
  }>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string>("");
  const [hasSavedDetails,   setHasSavedDetails]   = useState(false);
  const [showUpiModal,      setShowUpiModal]       = useState(false);
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  const [currentStep,       setCurrentStep]        = useState<1 | 2>(1); // 1=shipping, 2=payment
  const [timeLeft,          setTimeLeft]           = useState(RESERVATION_MINUTES * 60); // seconds

  // Reservation countdown
  useEffect(() => {
    if (items.length === 0) return;
    const id = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [items.length]);

  const countdownDisplay = useMemo(() => {
    const m = Math.floor(timeLeft / 60).toString().padStart(2, "0");
    const s = (timeLeft % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [timeLeft]);

  const isExpired = timeLeft === 0;

  // Auto-load saved buyer details
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_DETAILS_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<SavedDetails>;
      setForm((prev) => ({ ...prev, ...saved }));
      setHasSavedDetails(true);
    } catch { /* ignore */ }
  }, []);

  const saveDetails = () => {
    const parsed = buyerSchema
      .pick({ email: true, fullName: true, phone: true, address: true, address2: true, city: true, state: true, pincode: true })
      .safeParse(form);
    if (!parsed.success) { toast.error("Fill contact and address fields before saving"); return; }
    try {
      localStorage.setItem(SAVED_DETAILS_KEY, JSON.stringify(parsed.data));
      setHasSavedDetails(true);
      toast.success("Address & details saved for next time");
    } catch { toast.error("Could not save details"); }
  };

  const clearSavedDetails = () => {
    try {
      localStorage.removeItem(SAVED_DETAILS_KEY);
      setHasSavedDetails(false);
      toast.success("Saved details cleared");
    } catch { /* ignore */ }
  };

  const pricing = useMemo(
    () => calcPricing(subtotal, form.shipping as ShippingId, form.state),
    [subtotal, form.shipping, form.state]
  );

  const upiLink = useMemo(() => {
    const params = new URLSearchParams({
      pa: UPI_ID,
      pn: UPI_MERCHANT_NAME,
      am: pricing.total.toFixed(2),
      cu: "INR",
      tn: `MYTHICAL VAULT Order ${form.email || "checkout"}`,
    });
    return `upi://pay?${params.toString()}`;
  }, [pricing.total, form.email]);

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=10&data=${encodeURIComponent(upiLink)}`;

  const update = <K extends keyof BuyerForm>(key: K, value: BuyerForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const copy = async (value: string, label: string) => {
    try { await navigator.clipboard.writeText(value); toast.success(`${label} copied`); }
    catch { toast.error("Copy failed"); }
  };

  const onScreenshotChange = (file: File | null) => {
    if (!file) { setScreenshotPreview(""); update("screenshotName", ""); return; }
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Max file size is 5 MB"); return; }
    const reader = new FileReader();
    reader.onload = () => setScreenshotPreview(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
    update("screenshotName", file.name);
  };

  // Validate shipping fields before proceeding to payment step
  const validateShippingStep = useCallback(() => {
    const shippingFields = buyerSchema.pick({
      email: true, fullName: true, phone: true, address: true,
      address2: true, city: true, state: true, pincode: true, shipping: true,
    });
    const parsed = shippingFields.safeParse(form);
    if (!parsed.success) {
      const next: FormErrors = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof BuyerForm;
        if (!next[k]) next[k] = issue.message;
      }
      setErrors(next);
      toast.error("Please fill all required fields");
      return false;
    }
    return true;
  }, [form]);

  const proceedToPayment = () => {
    if (!validateShippingStep()) return;
    setCurrentStep(2);
    if (form.paymentMethod === "cod") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      void submitOrder();
      return;
    }
    setShowUpiModal(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitOrder();
  };

  const submitOrder = async () => {
    if (items.length === 0) { toast.error("Your bag is empty"); return; }

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

    if (form.paymentMethod === "upi" && !form.screenshotName) {
      setErrors((e) => ({ ...e, screenshotName: "Upload your payment screenshot" }));
      toast.error("Upload your payment screenshot");
      return;
    }



    setSubmitting(true);
    const finalPricing = calcPricing(subtotal, form.shipping as ShippingId, form.state);

    if (finalPricing.total !== pricing.total) {
      toast.error("Pricing changed during checkout. Please review your order.");
      setSubmitting(false);
      return;
    }

    try {
      const cartPayload = items.map((item) => ({ product_id: String(item.id), quantity: item.quantity }));
      const { data: oosItems, error: stockErr } = await supabase.rpc("check_cart_stock", { cart: cartPayload });
      if (!stockErr && oosItems && oosItems.length > 0) {
        const names = (oosItems as { title: string; available: number }[])
          .map((i) => `"${i.title}" (${i.available > 0 ? `only ${i.available} left` : "out of stock"})`)
          .join(", ");
        toast.error(`Some items are no longer available: ${names}. Please remove them before placing your order.`);
        setSubmitting(false);
        return;
      }
    } catch (stockCheckErr) {
      console.warn("[Checkout] Stock check threw:", stockCheckErr);
    }

    const orderNumber = generateOrderId();

    try {
      const lineItems = items.map((item) => ({
        product_id: String(item.id), title: item.name,
        image_url: item.image ?? null, price: item.price, quantity: item.quantity,
      }));

      const orderPayload = {
        order_number: orderNumber,
        user_id: user?.id ?? null,
        customer_name: form.fullName,
        customer_email: form.email.toLowerCase(),
        customer_phone: form.phone,
        shipping_address: form.address,
        shipping_address2: form.address2 || null,
        shipping_city: form.city,
        shipping_state: form.state,
        shipping_pincode: form.pincode,
        line_items: lineItems as never,
        subtotal: finalPricing.subtotal,
        gst_amount: finalPricing.gstAmount,
        shipping_amount: finalPricing.shippingCost,
        total_amount: finalPricing.total,
        payment_method: "upi",
        payment_status: "pending",
        status: "pending" as const,
        order_date: new Date().toISOString(),
      };

      const { data: newOrder, error: orderErr } = await supabase
        .from("orders").insert([orderPayload]).select("id").single();

      if (orderErr) {
        console.error("[Checkout] Supabase order insert error:", JSON.stringify(orderErr, null, 2));
        if (orderErr.message?.toLowerCase().includes("insufficient stock")) {
          await refreshStock();
          toast.error("Stock changed while placing your order. Your cart has been updated — please review and try again.");
          setSubmitting(false);
          return;
        }
        const msg =
          orderErr.code === "42501"
            ? "PLEASE LOGIN BEFORE ORDERING :) ."
            : orderErr.message
            ? `Order failed: ${orderErr.message}`
            : "Failed to save order. Please try again or contact support.";
        toast.error(msg);
        setSubmitting(false);
        return;
      }

      setSubmitting(false);
      if (newOrder?.id) {
        sendNewOrderEmails(newOrder.id).catch((err) => console.error("[Checkout] email error:", err));
      }
      setSuccess({
        orderId: orderNumber, total: finalPricing.total,
        email: form.email, fullName: form.fullName, phone: form.phone,
      });
      setShowUpiModal(false);
      setShowScreenshotModal(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      clear();
      toast.success("Order received — verification pending");
    } catch (err) {
      console.error("[Checkout] Order creation error:", err);
      toast.error("Failed to save order. Please try again.");
      setSubmitting(false);
    }
  };

  // ─── Order confirmation screen ────────────────────────────────────────────
  if (success) {
    const whatsappMsg = encodeURIComponent(
      `Hi MYTHICAL VAULT, I just placed an order.\n\nOrder ID: ${success.orderId}\nName: ${success.fullName}\nAmount: ₹${success.total.toLocaleString("en-IN")}\n\nPayment screenshot attached. Please verify and confirm.`,
    );
    const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMsg}`;

    const timeline = [
      { label: "Order Placed",             done: true,  active: false, time: "Just now" },
      { label: "Verification Pending",     done: false, active: true,  time: "Within 2 hours" },
      { label: "Authentication & Packing", done: false, active: false, time: "24–48 hours" },
      { label: "Insured Dispatch",         done: false, active: false, time: "Pan-India" },
    ];

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <CheckoutHeader />
        {/* Confirmation progress bar — step 4 */}
        <ProgressBar activeIndex={3} />
        <main className="flex-1 pt-10 pb-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center space-y-5 mb-12">
              <div className="w-16 h-16 mx-auto rounded-full border border-verified/40 flex items-center justify-center bg-surface-1">
                <Check size={26} className="text-verified" />
              </div>
              <p className="eyebrow">Order Received</p>
              <h1 className="font-display text-3xl md:text-5xl text-foreground tracking-tight leading-[1.05]">
                Thank you, {success.fullName.split(" ")[0]}.
                <br />
                Your vault is being prepared.
              </h1>
              <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                We've received your payment screenshot. Our team will verify the transaction and
                send a confirmation to{" "}
                <span className="text-foreground">{success.email}</span> shortly.
              </p>
            </div>

            <div className="border border-border/60 bg-surface-1 rounded-xl shadow-card p-6 md:p-9 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="eyebrow mb-2">Order ID</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm text-foreground tracking-wider truncate">{success.orderId}</p>
                    <button type="button" onClick={() => copy(success.orderId, "Order ID")}
                      className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Copy order ID">
                      <Copy size={13} />
                    </button>
                  </div>
                </div>
                <div>
                  <p className="eyebrow mb-2">Mobile</p>
                  <p className="font-mono text-sm text-foreground tracking-wider">+91 {success.phone}</p>
                </div>
                <div>
                  <p className="eyebrow mb-2">Amount Paid</p>
                  <p className="font-display text-2xl text-foreground tabular-nums">{formatPrice(success.total)}</p>
                </div>
              </div>
            </div>

            <div className="border border-border/60 bg-surface-1 rounded-xl shadow-card p-6 md:p-9 mb-8">
              <div className="flex items-baseline justify-between mb-6">
                <h2 className="font-display text-lg text-foreground tracking-tight">Order Tracking</h2>
                <span className="eyebrow text-[hsl(38,92%,60%)] flex items-center gap-1.5">
                  <Clock size={11} /> Verification Pending
                </span>
              </div>
              <ol className="space-y-5">
                {timeline.map((step, i) => (
                  <li key={step.label} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full border flex items-center justify-center text-[10px] font-mono ${
                        step.done ? "bg-verified/20 border-verified text-verified"
                          : step.active ? "border-[hsl(38,92%,60%)] text-[hsl(38,92%,60%)] animate-pulse"
                          : "border-border text-muted-foreground"
                      }`}>
                        {step.done ? <Check size={12} /> : i + 1}
                      </div>
                      {i < timeline.length - 1 && (
                        <div className={`w-px flex-1 mt-1 ${step.done ? "bg-verified/40" : "bg-border"}`} style={{ minHeight: 28 }} />
                      )}
                    </div>
                    <div className="pb-2">
                      <p className={`text-sm ${step.done || step.active ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</p>
                      <p className="text-[11px] font-mono tracking-wider text-muted-foreground mt-0.5">{step.time}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button asChild className="h-12 rounded-lg bg-[#25D366] text-black hover:bg-[#25D366]/90 text-xs tracking-[0.18em]">
                <a href={waLink} target="_blank" rel="noreferrer">
                  <MessageCircle size={15} /> CONFIRM ON WHATSAPP
                </a>
              </Button>
              <Button onClick={() => navigate("/")} variant="outline"
                className="h-12 rounded-lg border-border/70 hover:border-accent/50 hover:bg-surface-2 bg-transparent text-xs tracking-[0.18em]">
                <PackageSearch size={15} /> CONTINUE BROWSING
              </Button>
            </div>

            <p className="text-[11px] font-mono tracking-wider text-muted-foreground text-center mt-8">
              Need help? Reach us on WhatsApp +91 {WHATSAPP_NUMBER.slice(2, 7)} {WHATSAPP_NUMBER.slice(7)}
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ─── Main checkout form ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <CheckoutHeader />

      {/* Progress bar */}
      <ProgressBar activeIndex={currentStep === 1 ? 1 : 2} />

      {/* Reservation countdown banner */}
      {items.length > 0 && (
        <div className={`border-b ${isExpired ? "border-destructive/40 bg-destructive/5" : "border-border bg-surface-1"} px-4 py-2`}>
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-[11px] font-mono tracking-wider">
            {isExpired ? (
              <>
                <AlertCircle size={11} className="text-destructive" />
                <span className="text-destructive">RESERVATION EXPIRED · REFRESH PAGE TO CONTINUE</span>
              </>
            ) : (
              <>
                <Clock size={11} className="text-muted-foreground" />
                <span className="text-muted-foreground">
                  ITEMS RESERVED FOR{" "}
                  <span className={`font-bold tabular-nums ${timeLeft < 120 ? "text-[hsl(38,92%,60%)]" : "text-foreground"}`}>
                    {countdownDisplay}
                  </span>
                  {" "}· COMPLETE YOUR ORDER TO SECURE THEM
                </span>
              </>
            )}
          </div>
        </div>
      )}

      <main className="flex-1 pt-8 pb-28 md:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-9">
            <p className="eyebrow mb-3 flex items-center gap-2">
              <span className="w-4 h-px bg-accent/60" /> Secure Checkout
            </p>
            <h1 className="font-display text-4xl md:text-5xl text-foreground tracking-tight leading-[1.05]">
              Complete your acquisition
            </h1>
            <p className="text-sm text-muted-foreground mt-3 max-w-md">
              A few details and you're set — every payment is manually verified before dispatch.
            </p>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
            {TRUST_BADGES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5 border border-border/60 bg-surface-1 rounded-lg px-4 py-3.5 shadow-card hover-lift">
                <Icon size={15} className="text-verified shrink-0" />
                <span className="text-[11px] font-mono tracking-wider text-muted-foreground leading-tight">{label}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
            {/* ── Left column: forms ── */}
            <div className="lg:col-span-2 space-y-8">

              {/* Contact */}
              <section className="border border-border/60 bg-surface-1 rounded-xl shadow-card p-6 md:p-9">
                <SectionHeader title="Contact" step="01" />
                <div className="space-y-5">
                  <Field label="Email *" error={errors.email}>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                      <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)}
                        placeholder="you@example.com"
                        className="rounded-lg bg-background/70 border-border/70 h-12 pl-10 text-base md:text-sm transition-colors hover:border-border focus-visible:border-accent/50"
                        autoComplete="email" />
                    </div>
                  </Field>
                  <Field label="Full Name *" error={errors.fullName}>
                    <div className="relative">
                      <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                      <Input value={form.fullName} onChange={(e) => update("fullName", e.target.value)}
                        placeholder="As per government ID"
                        className="rounded-lg bg-background/70 border-border/70 h-12 pl-10 text-base md:text-sm transition-colors hover:border-border focus-visible:border-accent/50"
                        autoComplete="name" />
                    </div>
                  </Field>
                  <Field label="Mobile Number *" error={errors.phone}>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 h-12 rounded-l-lg border border-r-0 border-border/70 bg-surface-2 text-sm font-mono text-muted-foreground">
                        +91
                      </span>
                      <Input type="tel" inputMode="numeric" value={form.phone}
                        onChange={(e) => update("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="98765 43210" maxLength={10}
                        className="rounded-l-none rounded-r-lg bg-background/70 border-border/70 h-12 flex-1 text-base md:text-sm transition-colors hover:border-border focus-visible:border-accent/50"
                        autoComplete="tel-national" />
                    </div>
                  </Field>
                </div>
              </section>

              {/* Shipping Address */}
              <section className="border border-border/60 bg-surface-1 rounded-xl shadow-card p-6 md:p-9">
                <SectionHeader
                  title="Shipping Address"
                  step="02"
                  actions={hasSavedDetails ? (
                    <button type="button" onClick={clearSavedDetails}
                      className="eyebrow text-muted-foreground hover:text-destructive transition-colors text-[10px]">
                      Clear saved
                    </button>
                  ) : undefined}
                />

                {hasSavedDetails && (
                  <div className="mb-5 flex items-center gap-2 border border-verified/30 bg-verified/5 rounded-lg px-3.5 py-2.5 text-[11px] font-mono tracking-wider text-verified">
                    <Check size={12} /> SAVED DETAILS LOADED · EDIT FREELY
                  </div>
                )}

                <div className="space-y-5">
                  <Field label="Address *" error={errors.address}>
                    <div className="relative">
                      <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                      <Input value={form.address} onChange={(e) => update("address", e.target.value)}
                        placeholder="House no., building, street"
                        className="rounded-lg bg-background/70 border-border/70 h-12 pl-10 text-base md:text-sm transition-colors hover:border-border focus-visible:border-accent/50"
                        autoComplete="address-line1" />
                    </div>
                  </Field>
                  <Field label="Locality, landmark (optional)" error={errors.address2}>
                    <Input value={form.address2 ?? ""} onChange={(e) => update("address2", e.target.value)}
                      className="rounded-lg bg-background/70 border-border/70 h-12 text-base md:text-sm transition-colors hover:border-border focus-visible:border-accent/50"
                      autoComplete="address-line2" />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="City *" error={errors.city}>
                      <Input value={form.city} onChange={(e) => update("city", e.target.value)}
                        className="rounded-lg bg-background/70 border-border/70 h-12 text-base md:text-sm transition-colors hover:border-border focus-visible:border-accent/50"
                        autoComplete="address-level2" />
                    </Field>
                    <Field label="Pincode *" error={errors.pincode}>
                      <Input inputMode="numeric" value={form.pincode}
                        onChange={(e) => update("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="400001" maxLength={6}
                        className="rounded-lg bg-background/70 border-border/70 h-12 text-base md:text-sm transition-colors hover:border-border focus-visible:border-accent/50"
                        autoComplete="postal-code" />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="State *" error={errors.state}>
                      <Select value={form.state} onValueChange={(v) => update("state", v as IndianState)}>
                        <SelectTrigger className="rounded-lg bg-background/70 border-border/70 h-12 text-base md:text-sm transition-colors hover:border-border focus-visible:border-accent/50">
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent className="max-h-72">
                          {INDIAN_STATES.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Country">
                      <Input value="India" disabled
                        className="rounded-lg bg-background/70 border-border/70 h-12 text-base md:text-sm transition-colors hover:border-border focus-visible:border-accent/50" />
                    </Field>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-border/70 flex items-center justify-between gap-4 flex-wrap">
                  <p className="text-[11px] font-mono tracking-wider text-muted-foreground">
                    SAVE THESE DETAILS FOR FASTER CHECKOUT NEXT TIME
                  </p>
                  <Button type="button" onClick={saveDetails} variant="outline" size="sm"
                    className="rounded-lg border-border/70 hover:border-accent/50 hover:bg-surface-2 bg-transparent text-[11px] tracking-wider">
                    <BookmarkPlus size={12} />{" "}
                    {hasSavedDetails ? "UPDATE SAVED DETAILS" : "SAVE FOR NEXT TIME"}
                  </Button>
                </div>
              </section>

              {/* Shipping Method */}
              <section className="border border-border/60 bg-surface-1 rounded-xl shadow-card p-6 md:p-9">
                <SectionHeader title="Shipping Method" step="03" />
                <RadioGroup value={form.shipping}
                  onValueChange={(v) => update("shipping", v as ShippingId)}
                  className="space-y-3">
                  {shippingOptions.map((opt) => (
                    <label key={opt.id} htmlFor={`ship-${opt.id}`}
                      className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                        form.shipping === opt.id
                          ? "border-accent/50 bg-accent/5"
                          : "border-border/70 hover:border-border hover:bg-surface-2"
                      }`}>
                      <div className="flex items-center gap-3">
                        <RadioGroupItem id={`ship-${opt.id}`} value={opt.id} />
                        <div>
                          <p className="text-sm text-foreground">{opt.label}</p>
                          <p className="text-xs text-muted-foreground font-mono tracking-wider mt-0.5">{opt.eta}</p>
                        </div>
                      </div>
                      <span className="text-sm text-foreground font-mono tabular-nums">{formatPrice(opt.price)}</span>
                    </label>
                  ))}
                </RadioGroup>
              </section>

            </div>

            {/* ── Right column: Order Summary ── */}
            <aside className="lg:col-span-1">
              <div className="border border-accent/25 bg-surface-1 rounded-xl shadow-elevated p-6 md:p-8 sticky top-24 space-y-6 relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-accent/70 to-transparent" />
                <div className="flex items-baseline justify-between">
                  <h2 className="font-display text-xl text-foreground tracking-tight">Order Summary</h2>
                  <span className="eyebrow">{items.length} item{items.length !== 1 ? "s" : ""}</span>
                </div>

                {items.length === 0 ? (
                  <div className="text-center py-10 space-y-4">
                    <p className="text-sm text-muted-foreground">Your bag is empty.</p>
                    <Button asChild variant="outline"
                      className="rounded-lg border-border/70 hover:border-accent/50 hover:bg-surface-2 bg-transparent text-xs tracking-wider">
                      <Link to="/category/all">BROWSE MARKETPLACE</Link>
                    </Button>
                  </div>
                ) : (
                  <>
                    <ul className="space-y-5 max-h-[320px] overflow-y-auto pr-1">
                      {items.map((item) => (
                        <li key={item.id} className="flex gap-4">
                          <div className="w-14 h-18 bg-surface-2 overflow-hidden shrink-0 rounded-md border border-border/50">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="eyebrow truncate">{item.series}</p>
                            <p className="text-sm text-foreground truncate">{item.name}</p>
                            <div className="mt-2 flex items-center gap-2">
                              <button type="button" onClick={() => setQty(item.id, item.quantity - 1)}
                                aria-label="Decrease"
                                className="w-7 h-7 rounded-md border border-border hover:border-accent/50 hover:bg-surface-2 flex items-center justify-center transition-colors">
                                <Minus size={11} />
                              </button>
                              <span className="text-xs font-mono tabular-nums min-w-[2ch] text-center">{item.quantity}</span>
                              <button type="button" onClick={() => setQty(item.id, item.quantity + 1)}
                                disabled={item.stock != null && item.quantity >= item.stock}
                                aria-label="Increase"
                                className="w-7 h-7 rounded-md border border-border hover:border-accent/50 hover:bg-surface-2 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:bg-transparent"
                                title={item.stock != null && item.quantity >= item.stock ? `Only ${item.stock} in stock` : undefined}>
                                <Plus size={11} />
                              </button>
                              {item.stock != null && item.quantity >= item.stock && (
                                <span className="text-[10px] text-muted-foreground ml-1">max</span>
                              )}
                              <button type="button" onClick={() => remove(item.id)} aria-label="Remove"
                                className="ml-auto text-muted-foreground hover:text-destructive transition-colors">
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

                    {/* Price breakdown */}
                    <div className="border-t border-border/70 pt-5 space-y-3 text-sm">
                      <Row label="Base price (excl. GST)" value={formatPrice(pricing.taxableValue)} />
                      {pricing.sameState ? (
                        <>
                          <Row label={`CGST @ ${(GST_RATE * 50).toFixed(0)}%`} value={formatPrice(pricing.cgst)} muted />
                          <Row label={`SGST @ ${(GST_RATE * 50).toFixed(0)}%`} value={formatPrice(pricing.sgst)} muted />
                        </>
                      ) : (
                        <Row
                          label={`IGST @ ${(GST_RATE * 100).toFixed(0)}%${form.state ? "" : " (est.)"}`}
                          value={formatPrice(pricing.igst || pricing.totalGst)}
                          muted />
                      )}
                      <Row
                        label="Shipping"
                        value={pricing.shippingCost === 0 ? "Free" : formatPrice(pricing.shippingCost)} />
                    </div>

                    {/* Total */}
                    <div className="border-t border-border/70 pt-5">
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm text-foreground">Total payable</span>
                        <span className="font-display text-4xl text-foreground tabular-nums text-glow-gold">
                          {formatPrice(pricing.total)}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono tracking-wider text-muted-foreground mt-1.5">
                        Inclusive of all taxes · GSTIN 27AAACA1234F1Z5
                      </p>
                    </div>

                    {hasOutOfStockItems && (
                      <div className="flex items-start gap-2 border border-destructive/40 bg-destructive/5 rounded-lg p-3 text-[11px] font-mono tracking-wider text-destructive">
                        <span>⚠</span>
                        <span>Some items are out of stock. Remove them before placing your order.</span>
                      </div>
                    )}

                    {/* CTA — changes based on step */}
                    {currentStep === 1 ? (
                      <Button
                        type="button"
                        onClick={proceedToPayment}
                        disabled={hasOutOfStockItems || isExpired}
                        className="w-full h-14 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 text-sm font-medium tracking-[0.08em] shadow-[0_8px_28px_-8px_hsl(var(--accent)/0.55)] hover:shadow-[0_10px_34px_-6px_hsl(var(--accent)/0.65)] transition-shadow">
                        <Zap size={16} className="mr-1.5" />
                        PAY WITH UPI · {formatPrice(pricing.total)}
                        <ChevronRight size={16} className="ml-1.5" />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={submitting || hasOutOfStockItems}
                        className="w-full h-14 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 text-sm font-medium tracking-[0.08em] shadow-[0_8px_28px_-8px_hsl(var(--accent)/0.55)] hover:shadow-[0_10px_34px_-6px_hsl(var(--accent)/0.65)] transition-shadow">
                        {submitting ? "PROCESSING…" : `CONFIRM ORDER · ${formatPrice(pricing.total)}`}
                      </Button>
                    )}

                    {currentStep === 2 && (
                      <button
                        type="button"
                        onClick={() => setShowUpiModal(true)}
                        className="w-full text-center text-[11px] font-mono tracking-wider text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4 mt-0">
                        VIEW QR CODE AGAIN
                      </button>
                    )}

                    <ul className="space-y-2.5 pt-2 text-[11px] font-mono tracking-wider text-muted-foreground">
                      <li className="flex items-center gap-2.5"><ShieldCheck size={13} className="text-verified" /> ESCROW PROTECTED</li>
                      <li className="flex items-center gap-2.5"><Truck size={13} className="text-verified" /> INSURED PAN-INDIA SHIPPING</li>
                      <li className="flex items-center gap-2.5"><Lock size={13} className="text-verified" /> MANUALLY VERIFIED UPI</li>
                    </ul>
                  </>
                )}
              </div>
            </aside>
          </form>
        </div>
      </main>

      {/* ── Sticky bottom bar (mobile only) ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm px-4 py-3 flex items-center gap-3 md:hidden">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-mono tracking-wider text-muted-foreground">TOTAL PAYABLE</p>
          <p className="font-display text-xl text-foreground tabular-nums">{formatPrice(pricing.total)}</p>
        </div>
        {currentStep === 1 ? (
          <Button
            type="button"
            onClick={proceedToPayment}
            disabled={hasOutOfStockItems || isExpired || items.length === 0}
            className="rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 text-[11px] font-medium tracking-[0.1em] h-12 px-5 shrink-0 shadow-[0_6px_20px_-6px_hsl(var(--accent)/0.6)]">
            <Zap size={13} className="mr-1" /> PAY WITH UPI
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => setShowUpiModal(true)}
            className="rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 text-[11px] font-medium tracking-[0.1em] h-12 px-5 shrink-0 shadow-[0_6px_20px_-6px_hsl(var(--accent)/0.6)]">
            VIEW QR CODE
          </Button>
        )}
      </div>

      {/* ── UPI Payment Modal ── */}
      {showUpiModal && (
        <UpiModal
          upiLink={upiLink}
          qrUrl={qrUrl}
          total={pricing.total}
          upiId={UPI_ID}
          merchantName={UPI_MERCHANT_NAME}
          onCopy={copy}
          onClose={() => setShowUpiModal(false)}
          onConfirmed={() => {
            setShowUpiModal(false);
            setCurrentStep(2);
            setShowScreenshotModal(true);
          }}
        />
      )}

      {/* ── Screenshot Confirmation Modal ── */}
      {showScreenshotModal && (
        <ScreenshotModal
          total={pricing.total}
          screenshotPreview={screenshotPreview}
          screenshotName={form.screenshotName}
          error={errors.screenshotName}
          submitting={submitting}
          onScreenshotChange={onScreenshotChange}
          onGoBack={() => { setShowScreenshotModal(false); setShowUpiModal(true); }}
          onConfirm={submitOrder}
        />
      )}
    </div>
  );
};

// ─── Progress Bar ─────────────────────────────────────────────────────────────
const ProgressBar = ({ activeIndex }: { activeIndex: number }) => (
  <div className="border-b border-border/70 bg-surface-1">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
      <ol className="flex items-center gap-0">
        {STEPS.map((step, i) => {
          const isDone   = i < activeIndex;
          const isActive = i === activeIndex;
          return (
            <li key={step} className="flex items-center">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-[9px] font-mono transition-colors ${
                  isDone   ? "bg-verified/20 border-verified text-verified"
                  : isActive ? "border-accent text-accent shadow-[0_0_0_3px_hsl(var(--accent)/0.15)]"
                  : "border-border text-muted-foreground"
                }`}>
                  {isDone ? <Check size={10} /> : i + 1}
                </div>
                <span className={`text-[11px] font-mono tracking-wider hidden sm:block ${
                  isActive ? "text-foreground" : isDone ? "text-verified" : "text-muted-foreground"
                }`}>
                  {step.toUpperCase()}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-px w-6 sm:w-12 mx-2 sm:mx-3 ${i < activeIndex ? "bg-verified/40" : "bg-border"}`} />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  </div>
);

// ─── UPI Modal ────────────────────────────────────────────────────────────────
const UpiModal = ({
  upiLink, qrUrl, total, upiId, merchantName, onCopy, onClose, onConfirmed,
}: {
  upiLink: string; qrUrl: string; total: number; upiId: string; merchantName: string;
  onCopy: (v: string, label: string) => void;
  onClose: () => void; onConfirmed: () => void;
}) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog" aria-modal="true" aria-label="UPI Payment">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet/Modal */}
      <div className="relative w-full sm:max-w-lg bg-background border border-border/70 sm:border rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[95dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border sticky top-0 bg-background z-10">
          <div>
            <p className="eyebrow mb-0.5">Step 04</p>
            <h2 className="font-display text-xl text-foreground tracking-tight">Pay via UPI</h2>
          </div>
          <button type="button" onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Amount hero */}
          <div className="border border-accent/20 bg-surface-1 rounded-xl p-5 text-center">
            <p className="eyebrow mb-2">Amount to Pay</p>
            <p className="font-display text-4xl text-foreground tabular-nums">{formatPrice(total)}</p>
            <p className="text-[11px] font-mono tracking-wider text-muted-foreground mt-1.5">EXACT AMOUNT · DO NOT CHANGE</p>
          </div>

          {/* QR code */}
          <div className="flex flex-col items-center gap-3">
            <div className="bg-white p-3 border border-border rounded-lg inline-block">
              <img src={qrUrl} alt="UPI payment QR code" className="w-[200px] h-[200px] sm:w-[240px] sm:h-[240px] block" />
            </div>
            <p className="text-[11px] font-mono tracking-wider text-muted-foreground text-center">
              SCAN WITH ANY UPI APP
            </p>
          </div>

          {/* UPI ID + copy */}
          <div className="border border-border/70 bg-surface-1 rounded-lg p-4 space-y-3">
            <div>
              <p className="eyebrow mb-1">Pay To</p>
              <p className="text-sm text-foreground">{merchantName}</p>
            </div>
            <div className="border-t border-border pt-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="eyebrow mb-1">UPI ID</p>
                <p className="font-mono text-sm text-foreground truncate">{upiId}</p>
              </div>
              <button type="button" onClick={() => onCopy(upiId, "UPI ID")}
                className="flex items-center gap-1.5 rounded-md border border-border/70 bg-transparent hover:border-accent/50 hover:bg-surface-2 transition-colors px-3 h-8 text-[11px] font-mono tracking-wider text-foreground shrink-0">
                <Copy size={11} /> COPY
              </button>
            </div>
            <div className="border-t border-border pt-3 flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow mb-1">Amount</p>
                <p className="font-display text-xl text-foreground tabular-nums">{formatPrice(total)}</p>
              </div>
              <button type="button" onClick={() => onCopy(total.toString(), "Amount")}
                className="flex items-center gap-1.5 rounded-md border border-border/70 bg-transparent hover:border-accent/50 hover:bg-surface-2 transition-colors px-3 h-8 text-[11px] font-mono tracking-wider text-foreground shrink-0">
                <Copy size={11} /> COPY
              </button>
            </div>
          </div>

          {/* UPI deep-links */}
          <div>
            <p className="eyebrow mb-3">Open in app</p>
            <div className="grid grid-cols-4 gap-2">
              {UPI_APPS.map((app) => (
                <a key={app.name} href={app.scheme(upiLink)} rel="noreferrer"
                  className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-border/70 bg-surface-1 hover:border-accent/50 hover:bg-surface-2 transition-colors py-3 text-[10px] font-mono tracking-wider text-muted-foreground hover:text-foreground">
                  <Smartphone size={16} />
                  {app.name}
                </a>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <ol className="space-y-3 text-xs text-muted-foreground">
            {[
              "Open your UPI app and scan the QR or pay to the UPI ID above.",
              `Enter the exact amount: ${formatPrice(total)}.`,
              "Complete the payment and take a screenshot of the success page.",
              'Click "I Have Paid" below and upload your screenshot to confirm.',
            ].map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="font-mono text-foreground/60 tabular-nums shrink-0">0{i + 1}</span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>

          {/* CTA */}
          <Button
            type="button"
            onClick={onConfirmed}
            className="w-full h-14 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 text-sm font-medium tracking-[0.08em] shadow-[0_8px_28px_-8px_hsl(var(--accent)/0.55)] hover:shadow-[0_10px_34px_-6px_hsl(var(--accent)/0.65)] transition-shadow">
            <Check size={14} className="mr-1.5" /> I HAVE PAID · SUBMIT SCREENSHOT
          </Button>

          <p className="text-[11px] font-mono tracking-wider text-muted-foreground text-center">
            Your order won't be confirmed until our team verifies the payment.
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Screenshot Confirmation Modal ─────────────────────────────────────────────
const ScreenshotModal = ({
  total, screenshotPreview, screenshotName, error, submitting,
  onScreenshotChange, onGoBack, onConfirm,
}: {
  total: number;
  screenshotPreview: string;
  screenshotName: string;
  error?: string;
  submitting: boolean;
  onScreenshotChange: (file: File | null) => void;
  onGoBack: () => void;
  onConfirm: () => void;
}) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog" aria-modal="true" aria-label="Confirm Payment">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Sheet/Modal */}
      <div className="relative w-full sm:max-w-lg bg-background border border-border/70 sm:border rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[95dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border sticky top-0 bg-background z-10">
          <div>
            <p className="eyebrow mb-0.5">Last Step</p>
            <h2 className="font-display text-xl text-foreground tracking-tight">Confirm Your Payment</h2>
          </div>
          <button type="button" onClick={onGoBack}
            className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-sm text-muted-foreground">
            Upload a screenshot of your successful UPI payment of{" "}
            <span className="text-foreground">{formatPrice(total)}</span> to confirm your order.
          </p>

          <Field label="Payment Screenshot *" error={error}>
            {screenshotPreview ? (
              <div className="flex items-center gap-3 rounded-lg border border-verified/30 bg-verified/5 p-3">
                <img src={screenshotPreview} alt="Payment screenshot preview"
                  className="w-16 h-16 object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground truncate">{screenshotName}</p>
                  <p className="text-[10px] font-mono tracking-wider text-verified mt-0.5">
                    UPLOADED · READY FOR VERIFICATION
                  </p>
                </div>
                <button type="button" onClick={() => onScreenshotChange(null)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-2"
                  aria-label="Remove screenshot">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 py-10 rounded-lg border border-dashed border-border bg-surface-1 hover:border-accent/50 hover:bg-surface-2 cursor-pointer transition-colors">
                <Upload size={22} className="text-muted-foreground" />
                <span className="text-xs font-mono tracking-wider text-muted-foreground">UPLOAD PAYMENT SCREENSHOT</span>
                <span className="text-[10px] font-mono tracking-wider text-muted-foreground/70">PNG / JPG · MAX 5 MB</span>
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => onScreenshotChange(e.target.files?.[0] ?? null)} />
              </label>
            )}
          </Field>

          <div className="flex items-start gap-3 rounded-lg border border-dashed border-border p-4 text-[11px] font-mono tracking-wider text-muted-foreground">
            <ShieldCheck size={14} className="mt-0.5 text-verified shrink-0" />
            <p className="leading-relaxed">
              PAYMENTS ARE MANUALLY VERIFIED WITHIN 2 HOURS. ORDER STATUS WILL REMAIN
              "VERIFICATION PENDING" UNTIL OUR TEAM CONFIRMS THE UPI TRANSACTION.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button
              type="button"
              onClick={onConfirm}
              disabled={submitting || !screenshotName}
              className="w-full h-14 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 text-sm font-medium tracking-[0.08em] shadow-[0_8px_28px_-8px_hsl(var(--accent)/0.55)] hover:shadow-[0_10px_34px_-6px_hsl(var(--accent)/0.65)] transition-shadow disabled:opacity-50 disabled:shadow-none">
              {submitting ? "PROCESSING…" : `CONFIRM ORDER · ${formatPrice(total)}`}
            </Button>
            <button
              type="button"
              onClick={onGoBack}
              className="w-full text-center text-[11px] font-mono tracking-wider text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4 py-1">
              GO BACK TO QR CODE
            </button>
          </div>

          <p className="text-[11px] font-mono tracking-wider text-muted-foreground text-center">
            Your order won't be confirmed until our team verifies the payment.
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Section header ───────────────────────────────────────────────────────────
const SectionHeader = ({
  title, step, actions,
}: { title: string; step: string; actions?: React.ReactNode }) => (
  <header className="flex items-center justify-between mb-7">
    <h2 className="font-display text-xl md:text-2xl text-foreground tracking-tight">{title}</h2>
    <div className="flex items-center gap-3">
      {actions}
      <span className="eyebrow flex items-center gap-1.5">
        <span className="w-5 h-5 rounded-full border border-accent/40 bg-accent/10 text-accent flex items-center justify-center text-[10px] font-mono not-italic">
          {step}
        </span>
      </span>
    </div>
  </header>
);

// ─── Sub-components ───────────────────────────────────────────────────────────
const Field = ({
  label, error, children,
}: { label: string; error?: string; children: React.ReactNode }) => (
  <div>
    <Label className="eyebrow block mb-2.5">{label}</Label>
    {children}
    {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
  </div>
);

const Row = ({ label, value, muted }: { label: string; value: string; muted?: boolean }) => (
  <div className="flex justify-between items-center">
    <span className="text-muted-foreground">{label}</span>
    <span className={`tabular-nums font-mono ${muted ? "text-muted-foreground" : "text-foreground"}`}>{value}</span>
  </div>
);

export default Checkout;
