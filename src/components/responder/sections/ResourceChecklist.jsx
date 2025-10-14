import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ClipboardCheck,
  PackageCheck,
  RefreshCcw,
  Shield,
} from "lucide-react";
import { SectionHeader } from "@/components/admin/SectionHeader";
import { cn } from "@/lib/utils";
import { useResponderData } from "@/components/responder/context/ResponderDataContext";

const ICON_CATALOG = {
  ClipboardCheck,
  Shield,
  PackageCheck,
};

const FALLBACK_CHECKLISTS = [
  {
    id: "med",
    title: "Medical kit",
    icon: "ClipboardCheck",
    items: [
      "ALS kit sealed",
      "Ventilator battery > 70%",
      "IV fluids x4 bags",
      "Trauma dressings restocked",
    ],
  },
  {
    id: "gear",
    title: "Responder gear",
    icon: "Shield",
    items: ["PPE level 3", "Rope harness", "Thermal blanket", "Floodlight"],
  },
  {
    id: "log",
    title: "Vehicle & logistics",
    icon: "PackageCheck",
    items: [
      "Fuel > 60%",
      "Generator loaded",
      "Boat trailer attached",
      "Radio spare battery",
    ],
  },
];

export const ResourceChecklist = () => {
  const { data } = useResponderData();

  const lists = useMemo(() => {
    const source = data?.resourceChecklists;
    if (Array.isArray(source) && source.length) {
      return source.map((entry) => ({
        ...entry,
        icon: entry.icon ?? "ClipboardCheck",
      }));
    }
    return FALLBACK_CHECKLISTS;
  }, [data?.resourceChecklists]);

  const [completed, setCompleted] = useState(new Set());

  useEffect(() => {
    setCompleted((prev) => {
      const validKeys = new Set();
      lists.forEach((list) => {
        (list.items ?? []).forEach((item) => {
          const label = typeof item === "string" ? item : item?.label;
          if (label) {
            validKeys.add(`${list.id}:${label}`);
          }
        });
      });
      const next = new Set();
      prev.forEach((key) => {
        if (validKeys.has(key)) {
          next.add(key);
        }
      });
      return next;
    });
  }, [lists]);

  const toggleItem = (listId, label) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      const key = `${listId}:${label}`;
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Resource Checklist"
        description="Before you roll out or switch assignments, confirm your kits are ready. Tick items as you verify or restock."
        actions={
          <button
            onClick={() => setCompleted(new Set())}
            className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary transition hover:border-primary"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Reset lists
          </button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {lists.map((list) => {
          const Icon = ICON_CATALOG[list.icon] ?? ClipboardCheck;
          const items = Array.isArray(list.items) ? list.items : [];
          return (
            <article
              key={list.id}
              className="rounded-3xl border border-border/60 bg-card/70 p-5 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-foreground/50">
                    Kit status
                  </p>
                  <h3 className="text-lg font-semibold text-foreground">
                    {list.title}
                  </h3>
                </div>
              </div>

              <ul className="mt-4 space-y-2 text-sm text-foreground/70">
                {items.map((item) => {
                  const label = typeof item === "string" ? item : item?.label;
                  if (!label) return null;
                  const key = `${list.id}:${label}`;
                  const isDone = completed.has(key);
                  return (
                    <li key={key}>
                      <button
                        onClick={() => toggleItem(list.id, label)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-2xl border px-3 py-2 text-left transition",
                          isDone
                            ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600"
                            : "border-border/60 bg-background/60 hover:border-primary/40 hover:text-primary"
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-full border",
                            isDone
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-border/60"
                          )}
                        >
                          {isDone && <Check className="h-3.5 w-3.5" />}
                        </span>
                        <span>{label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
};
