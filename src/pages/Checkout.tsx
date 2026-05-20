import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  shipping: z.enum(["standard", "express", "overnight"]),
  transactionId: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{8,22}$/, "Enter a valid UPI / UTR reference (8–22 chars)"),
  screenshotName: z.string().min(1, "Upload your payment screenshot"),
});

type BuyerForm = z.infer<typeof buyerSchema>;
type FormErrors = Partial<Record<keyof BuyerForm, string>>;

const shippingOptions = [
  { id: "standard", label: "Standard · Insured", eta: "5–7 business days", price: 0 },
  { id: "express", label: "Express · Signature required", eta: "2–3 business days", price: 250 },
  { id: "overnight", label: "Overnight · White Glove", eta: "Next business day", price: 800 },
] as const;

const initial: BuyerForm = {
  email: "",
  fullName: "",
  phone: "",
  address: "",
  address2: "",
  city: "",
  state: "",
  pincode: "",
  shipping: "standard",
  transactionId: "",
  screenshotName: "",
};

const generateOrderId = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ANX-${ts}-${rand}`;
};

const Checkout = () => {
  const navigate = useNavigate();
  const { items, subtotal, setQty, remove, clear } = useCart();
  const [form, setForm] = useState<BuyerForm>(initial);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<null | {
    orderId: string;
    total: number;
    email: string;
    fullName: string;
    phone: string;
    transactionId: string;
  }>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string>("");

  const shippingCost = shippingOptions.find((s) => s.id === form.shipping)?.price ?? 0;

  // Listed prices are inclusive of GST. Back out the taxable value, then re-split.
  const taxableValue = Math.round(subtotal / (1 + GST_RATE));
  const totalGst = subtotal - taxableValue;
  const sameState = form.state === ORIGIN_STATE;
  const cgst = sameState ? Math.round(totalGst / 2) : 0;
  const sgst = sameState ? totalGst - cgst : 0;
  const igst = sameState ? 0 : totalGst;
  const total = subtotal + shippingCost;

  // Build UPI deep-link + QR
  const upiLink = useMemo(() => {
    const params = new URLSearchParams({
      pa: UPI_ID,
      pn: UPI_MERCHANT_NAME,
      am: total.toFixed(2),
      cu: "INR",
      tn: `ANIMEX Order ${form.email || "checkout"}`,
    });
    return `upi://pay?${params.toString()}`;
  }, [total, form.email]);

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=8&data=${encodeURIComponent(
    upiLink,
  )}`;

  const update = <K extends keyof BuyerForm>(key: K, value: BuyerForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Copy failed");
    }
  };

  const onScreenshotChange = (file: File | null) => {
    if (!file) {
      setScreenshotPreview("");
      update("screenshotName", "");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Max file size is 5 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setScreenshotPreview(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
    update("screenshotName", file.name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Your bag is empty");
      return;
    }
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
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1000));
    const orderId = generateOrderId();
    setSubmitting(false);
    setSuccess({
      orderId,
      total,
      email: form.email,
      fullName: form.fullName,
      phone: form.phone,
      transactionId: form.transactionId,
    });
    clear();
    toast.success("Order received — verification pending");
  };

  if (success) {
    const whatsappMsg = encodeURIComponent(
      `Hi ANIMEX, I just placed an order.\n\nOrder ID: ${success.orderId}\nName: ${success.fullName}\nAmount: ₹${success.total.toLocaleString("en-IN")}\nUPI Txn ID: ${success.transactionId}\n\nPlease verify and confirm.`,
    );
    const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMsg}`;

    const timeline = [
      { label: "Order Placed", done: true, time: "Just now" },
      { label: "Verification Pending", done: false, active: true, time: "Within 2 hours" },
      { label: "Authentication & Packing", done: false, time: "24–48 hours" },
      { label: "Insured Dispatch", done: false, time: "Pan-India" },
    ];

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <CheckoutHeader />
        <main className="flex-1 pt-10 pb-20">
          <div className="max-w-4xl mx-auto px-6">
            {/* Hero */}
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
                We've received your UPI payment reference. Our team will verify the transaction and
                send a confirmation to{" "}
                <span className="text-foreground">{success.email}</span> shortly.
              </p>
            </div>

            {/* Order meta card */}
            <div className="border border-border bg-surface-1 p-6 md:p-8 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="eyebrow mb-2">Order ID</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm text-foreground tracking-wider truncate">
                      {success.orderId}
                    </p>
                    <button
                      type="button"
                      onClick={() => copy(success.orderId, "Order ID")}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Copy order ID"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>
                <div>
                  <p className="eyebrow mb-2">UPI Txn ID</p>
                  <p className="font-mono text-sm text-foreground tracking-wider truncate">
                    {success.transactionId}
                  </p>
                </div>
                <div>
                  <p className="eyebrow mb-2">Amount Paid</p>
                  <p className="font-display text-2xl text-foreground tabular-nums">
                    {formatPrice(success.total)}
                  </p>
                </div>
              </div>
            </div>

            {/* Status timeline */}
            <div className="border border-border bg-surface-1 p-6 md:p-8 mb-8">
              <div className="flex items-baseline justify-between mb-6">
                <h2 className="font-display text-lg text-foreground tracking-tight">
                  Order Tracking
                </h2>
                <span className="eyebrow text-[hsl(38,92%,60%)] flex items-center gap-1.5">
                  <Clock size={11} /> Verification Pending
                </span>
              </div>
              <ol className="space-y-5">
                {timeline.map((step, i) => (
                  <li key={step.label} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-7 h-7 rounded-full border flex items-center justify-center text-[10px] font-mono ${
                          step.done
                            ? "bg-verified/20 border-verified text-verified"
                            : step.active
                              ? "border-[hsl(38,92%,60%)] text-[hsl(38,92%,60%)] animate-pulse"
                              : "border-border text-muted-foreground"
                        }`}
                      >
                        {step.done ? <Check size={12} /> : i + 1}
                      </div>
                      {i < timeline.length - 1 && (
                        <div
                          className={`w-px flex-1 mt-1 ${step.done ? "bg-verified/40" : "bg-border"}`}
                          style={{ minHeight: 28 }}
                        />
                      )}
                    </div>
                    <div className="pb-2">
                      <p
                        className={`text-sm ${
                          step.done || step.active ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-[11px] font-mono tracking-wider text-muted-foreground mt-0.5">
                        {step.time}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                asChild
                className="h-12 rounded-none bg-[#25D366] text-black hover:bg-[#25D366]/90 text-xs tracking-[0.18em]"
              >
                <a href={waLink} target="_blank" rel="noreferrer">
                  <MessageCircle size={15} /> CONFIRM ON WHATSAPP
                </a>
              </Button>
              <Button
                onClick={() => navigate("/")}
                variant="outline"
                className="h-12 rounded-none border-border hover:border-foreground/40 bg-transparent text-xs tracking-[0.18em]"
              >
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
                <div className="mt-5">
                  <Field label="Full Name *" error={errors.fullName}>
                    <Input
                      value={form.fullName}
                      onChange={(e) => update("fullName", e.target.value)}
                      placeholder="As per government ID"
                      className="rounded-none bg-background border-border h-11"
                      autoComplete="name"
                    />
                  </Field>
                </div>
                <div className="mt-5">
                  <Field label="Mobile Number *" error={errors.phone}>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 h-11 border border-r-0 border-border bg-surface-2 text-sm font-mono text-muted-foreground">
                        +91
                      </span>
                      <Input
                        type="tel"
                        inputMode="numeric"
                        value={form.phone}
                        onChange={(e) =>
                          update("phone", e.target.value.replace(/\D/g, "").slice(0, 10))
                        }
                        placeholder="98765 43210"
                        maxLength={10}
                        className="rounded-none bg-background border-border h-11 flex-1"
                        autoComplete="tel-national"
                      />
                    </div>
                  </Field>
                </div>
              </section>

              {/* Shipping address */}
              <section className="border border-border bg-surface-1 p-6 md:p-8">
                <header className="flex items-baseline justify-between mb-6">
                  <h2 className="font-display text-lg text-foreground tracking-tight">
                    Shipping Address
                  </h2>
                  <span className="eyebrow">Step 02</span>
                </header>
                <Field label="Address *" error={errors.address}>
                  <Input
                    value={form.address}
                    onChange={(e) => update("address", e.target.value)}
                    placeholder="House no., building, street"
                    className="rounded-none bg-background border-border h-11"
                    autoComplete="address-line1"
                  />
                </Field>
                <div className="mt-5">
                  <Field label="Locality, landmark (optional)" error={errors.address2}>
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
                  <Field label="Pincode *" error={errors.pincode}>
                    <Input
                      inputMode="numeric"
                      value={form.pincode}
                      onChange={(e) =>
                        update("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      placeholder="400001"
                      maxLength={6}
                      className="rounded-none bg-background border-border h-11"
                      autoComplete="postal-code"
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-5">
                  <Field label="State *" error={errors.state}>
                    <Select
                      value={form.state}
                      onValueChange={(v) => update("state", v as IndianState)}
                    >
                      <SelectTrigger className="rounded-none bg-background border-border h-11">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {INDIAN_STATES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Country">
                    <Input
                      value="India"
                      disabled
                      className="rounded-none bg-background border-border h-11"
                    />
                  </Field>
                </div>
              </section>

              {/* Shipping method */}
              <section className="border border-border bg-surface-1 p-6 md:p-8">
                <header className="flex items-baseline justify-between mb-6">
                  <h2 className="font-display text-lg text-foreground tracking-tight">
                    Shipping Method
                  </h2>
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
                          <p className="text-xs text-muted-foreground font-mono tracking-wider mt-0.5">
                            {opt.eta}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-foreground font-mono tabular-nums">
                        {opt.price === 0 ? "FREE" : formatPrice(opt.price)}
                      </span>
                    </label>
                  ))}
                </RadioGroup>
              </section>

              {/* UPI Payment */}
              <section className="border border-border bg-surface-1 p-6 md:p-8">
                <header className="flex items-baseline justify-between mb-6">
                  <h2 className="font-display text-lg text-foreground tracking-tight">
                    UPI Payment
                  </h2>
                  <span className="eyebrow">Step 04</span>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8">
                  {/* QR */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="bg-white p-3 border border-border">
                      <img
                        src={qrUrl}
                        alt="UPI payment QR code"
                        className="w-[220px] h-[220px] block"
                      />
                    </div>
                    <p className="text-[11px] font-mono tracking-wider text-muted-foreground text-center">
                      SCAN WITH ANY UPI APP
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] font-mono tracking-wider text-muted-foreground">
                      <span>GPay</span>·<span>PhonePe</span>·<span>Paytm</span>·<span>BHIM</span>
                    </div>
                    <a
                      href={upiLink}
                      className="md:hidden text-xs font-mono tracking-wider text-foreground underline underline-offset-4"
                    >
                      <Smartphone size={12} className="inline mr-1.5" />
                      OPEN UPI APP
                    </a>
                  </div>

                  {/* Instructions + UPI ID */}
                  <div className="space-y-5">
                    <div className="border border-border bg-background p-4">
                      <p className="eyebrow mb-2">Pay To</p>
                      <p className="text-sm text-foreground">{UPI_MERCHANT_NAME}</p>
                      <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
                        <div className="min-w-0">
                          <p className="eyebrow mb-1">UPI ID</p>
                          <p className="font-mono text-sm text-foreground truncate">{UPI_ID}</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => copy(UPI_ID, "UPI ID")}
                          className="rounded-none border-border bg-transparent text-[10px] tracking-wider"
                        >
                          <Copy size={11} /> COPY
                        </Button>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
                        <div>
                          <p className="eyebrow mb-1">Amount</p>
                          <p className="font-display text-xl text-foreground tabular-nums">
                            {formatPrice(total)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => copy(total.toString(), "Amount")}
                          className="rounded-none border-border bg-transparent text-[10px] tracking-wider"
                        >
                          <Copy size={11} /> COPY
                        </Button>
                      </div>
                    </div>

                    <ol className="space-y-2.5 text-xs text-muted-foreground">
                      {[
                        "Open your UPI app and scan the QR or pay to the UPI ID above.",
                        `Enter the exact amount: ${formatPrice(total)}.`,
                        "Complete the payment and copy the 12-digit UTR / transaction ID.",
                        "Paste the transaction ID below and upload a payment screenshot.",
                      ].map((step, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="font-mono text-foreground/60 tabular-nums">
                            0{i + 1}
                          </span>
                          <span className="leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>

                {/* Confirmation inputs */}
                <div className="mt-8 pt-8 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="UPI Transaction ID / UTR *" error={errors.transactionId}>
                    <Input
                      value={form.transactionId}
                      onChange={(e) =>
                        update("transactionId", e.target.value.replace(/\s/g, "").toUpperCase())
                      }
                      placeholder="e.g. 412345678901"
                      maxLength={22}
                      className="rounded-none bg-background border-border h-11 font-mono tracking-wider"
                    />
                  </Field>

                  <Field label="Payment Screenshot *" error={errors.screenshotName}>
                    {screenshotPreview ? (
                      <div className="flex items-center gap-3 border border-border bg-background p-2">
                        <img
                          src={screenshotPreview}
                          alt="Payment screenshot preview"
                          className="w-12 h-12 object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-foreground truncate">{form.screenshotName}</p>
                          <p className="text-[10px] font-mono tracking-wider text-verified">
                            UPLOADED
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onScreenshotChange(null)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-2"
                          aria-label="Remove screenshot"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 h-11 border border-dashed border-border bg-background hover:border-foreground/40 cursor-pointer transition-colors text-xs text-muted-foreground">
                        <Upload size={14} />
                        <span className="font-mono tracking-wider">UPLOAD SCREENSHOT (PNG/JPG, ≤5 MB)</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => onScreenshotChange(e.target.files?.[0] ?? null)}
                        />
                      </label>
                    )}
                  </Field>
                </div>

                <div className="mt-6 flex items-start gap-3 border border-dashed border-border p-4 text-[11px] font-mono tracking-wider text-muted-foreground">
                  <ShieldCheck size={14} className="mt-0.5 text-verified shrink-0" />
                  <p className="leading-relaxed">
                    PAYMENTS ARE MANUALLY VERIFIED WITHIN 2 HOURS. ORDER STATUS WILL REMAIN
                    “VERIFICATION PENDING” UNTIL OUR TEAM CONFIRMS THE UPI TRANSACTION.
                  </p>
                </div>
              </section>
            </div>

            {/* Order Summary */}
            <aside className="lg:col-span-1">
              <div className="border border-border bg-surface-1 p-6 md:p-8 sticky top-24 space-y-6">
                <div className="flex items-baseline justify-between">
                  <h2 className="font-display text-lg text-foreground tracking-tight">
                    Order Summary
                  </h2>
                  <span className="eyebrow">
                    {items.length} item{items.length !== 1 ? "s" : ""}
                  </span>
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
                      <Row label="Base price (excl. GST)" value={formatPrice(taxableValue)} />
                      {sameState ? (
                        <>
                          <Row label={`CGST @ ${(GST_RATE * 50).toFixed(0)}%`} value={formatPrice(cgst)} muted />
                          <Row label={`SGST @ ${(GST_RATE * 50).toFixed(0)}%`} value={formatPrice(sgst)} muted />
                        </>
                      ) : (
                        <Row
                          label={`IGST @ ${(GST_RATE * 100).toFixed(0)}%${form.state ? "" : " (est.)"}`}
                          value={formatPrice(igst || totalGst)}
                          muted
                        />
                      )}
                      <Row
                        label="Shipping"
                        value={shippingCost === 0 ? "Free" : formatPrice(shippingCost)}
                      />
                    </div>

                    <div className="border-t border-border pt-5 flex items-baseline justify-between">
                      <span className="text-sm text-foreground">Total payable</span>
                      <span className="font-display text-2xl text-foreground tabular-nums">
                        {formatPrice(total)}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono tracking-wider text-muted-foreground -mt-2">
                      Inclusive of all taxes · GSTIN 27AAACA1234F1Z5
                    </p>

                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full h-12 rounded-none bg-foreground text-background hover:bg-foreground/90 text-xs tracking-[0.18em]"
                    >
                      {submitting ? "PROCESSING…" : `SUBMIT PAYMENT · ${formatPrice(total)}`}
                    </Button>

                    <ul className="space-y-2 pt-2 text-[11px] font-mono tracking-wider text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <ShieldCheck size={12} className="text-verified" /> ESCROW PROTECTED
                      </li>
                      <li className="flex items-center gap-2">
                        <Truck size={12} className="text-verified" /> INSURED PAN-INDIA SHIPPING
                      </li>
                      <li className="flex items-center gap-2">
                        <Lock size={12} className="text-verified" /> MANUALLY VERIFIED UPI
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
