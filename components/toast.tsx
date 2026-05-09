"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

type ToastKind = "success" | "error" | "info";
type ToastItem = {
  id: number;
  kind: ToastKind;
  message: string;
};

type Listener = (items: ToastItem[]) => void;

const listeners = new Set<Listener>();
let store: ToastItem[] = [];
let nextId = 1;

function emit() {
  listeners.forEach((listener) => listener(store));
}

function dismiss(id: number) {
  store = store.filter((item) => item.id !== id);
  emit();
}

function push(kind: ToastKind, message: string) {
  const id = nextId;
  nextId += 1;
  store = [...store, { id, kind, message }];
  emit();
  window.setTimeout(() => dismiss(id), kind === "error" ? 6200 : 3600);
}

export const toast = {
  error: (message: string) => push("error", message),
  info: (message: string) => push("info", message),
  success: (message: string) => push("success", message)
};

const tone = {
  success: {
    icon: CheckCircle2,
    className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
  },
  error: {
    icon: AlertTriangle,
    className: "border-red-500/45 bg-red-500/10 text-red-200"
  },
  info: {
    icon: Info,
    className: "border-[#c9a84c]/45 bg-[#c9a84c]/10 text-[#f2d778]"
  }
} satisfies Record<ToastKind, { icon: typeof Info; className: string }>;

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const listener: Listener = (nextItems) => setItems(nextItems);
    listeners.add(listener);
    listener(store);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="gct-fixed pointer-events-none fixed top-[max(14px,env(safe-area-inset-top))] z-[120] flex flex-col gap-2 px-4">
      {items.map((item) => {
        const Icon = tone[item.kind].icon;
        return (
          <button
            className={`pointer-events-auto flex min-h-12 items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-bold shadow-sheet backdrop-blur-md animate-[gctFadeUp_0.2s_ease_both] ${tone[item.kind].className}`}
            key={item.id}
            onClick={() => dismiss(item.id)}
            type="button"
          >
            <Icon size={18} />
            <span className="min-w-0 flex-1">{item.message}</span>
            <X size={15} className="opacity-65" />
          </button>
        );
      })}
    </div>
  );
}
