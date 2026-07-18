// src/components/account/OrderTimeline.tsx
import { ORDER_STAGES, CANCELLED_STAGE, getStageIndex, type Order } from "@/types/order";

interface Props {
  order: Order;
  compact?: boolean;
}

export default function OrderTimeline({ order, compact = false }: Props) {
  const { status } = order;

  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2 px-3 py-2 border border-red-400/30 bg-red-400/5 text-[11px] font-mono tracking-wider text-red-400">
        <span>{CANCELLED_STAGE.icon}</span>
        <span>ORDER CANCELLED</span>
      </div>
    );
  }

  const currentIndex = getStageIndex(status);

  if (compact) {
    // Simple horizontal progress for order list
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 tracking-widest">
          {ORDER_STAGES.map((stage, i) => (
            <span
              key={stage.status}
              className={i <= currentIndex ? "text-zinc-200" : "text-zinc-700"}
            >
              {stage.icon}
            </span>
          ))}
        </div>
        <div className="h-px bg-zinc-800 relative">
          <div
            className="absolute left-0 top-0 h-full bg-zinc-400 transition-all duration-700"
            style={{ width: `${((currentIndex + 1) / ORDER_STAGES.length) * 100}%` }}
          />
        </div>
        <p className="text-[11px] font-mono tracking-wider text-zinc-400">
          {ORDER_STAGES[currentIndex]?.label ?? status}
        </p>
      </div>
    );
  }

  // Full vertical timeline
  return (
    <div className="space-y-0">
      {ORDER_STAGES.map((stage, i) => {
        const done    = i < currentIndex;
        const current = i === currentIndex;
        const future  = i > currentIndex;

        return (
          <div key={stage.status} className="flex gap-4">
            {/* Icon + connector line */}
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm flex-shrink-0 transition-all ${
                  done    ? "border-green-500 bg-green-500/20 text-green-400"
                  : current ? "border-zinc-300 bg-zinc-900 text-white ring-2 ring-zinc-700 ring-offset-1 ring-offset-zinc-950"
                  : "border-zinc-800 bg-zinc-950 text-zinc-700"
                }`}
              >
                {done ? "✓" : stage.icon}
              </div>
              {i < ORDER_STAGES.length - 1 && (
                <div className={`w-px flex-1 mt-1 mb-1 min-h-[28px] ${done ? "bg-green-500" : "bg-zinc-800"}`} />
              )}
            </div>

            {/* Label */}
            <div className="pb-6 min-w-0">
              <p className={`text-[13px] font-mono tracking-wider mt-1.5 ${
                done ? "text-zinc-400" : current ? "text-white" : "text-zinc-700"
              }`}>
                {stage.label}
              </p>
              {current && (
                <p className="text-[11px] text-zinc-500 mt-0.5">{stage.description}</p>
              )}
              {done && stage.status === "confirmed" && order.confirmed_at && (
                <p className="text-[10px] text-zinc-600 font-mono mt-0.5">
                  {new Date(order.confirmed_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              )}
              {done && stage.status === "shipped" && order.shipped_at && (
                <p className="text-[10px] text-zinc-600 font-mono mt-0.5">
                  {new Date(order.shipped_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              )}
              {done && stage.status === "delivered" && order.delivered_at && (
                <p className="text-[10px] text-zinc-600 font-mono mt-0.5">
                  {new Date(order.delivered_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              )}
              {current && stage.status === "shipped" && order.courier_name && order.tracking_number && (
                <p className="text-[11px] font-mono text-zinc-400 mt-1">
                  {order.courier_name} · {order.tracking_number}
                </p>
              )}
              {current && order.estimated_delivery && (
                <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
                  Est. delivery: {new Date(order.estimated_delivery).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
