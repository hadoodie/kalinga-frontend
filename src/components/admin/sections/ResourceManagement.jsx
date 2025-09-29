import {
  Boxes,
  ClipboardList,
  Droplet,
  PackageCheck,
  Truck,
} from "lucide-react";
import { SectionHeader } from "../SectionHeader";

const resourcePipelines = [
  {
    title: "Food packs",
    lead: "City Social Welfare",
    eta: "ETA 45m",
    status: "Rolling out",
    fill: 82,
    icon: PackageCheck,
    tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  },
  {
    title: "Potable water",
    lead: "Fire Bureau",
    eta: "ETA 1h 10m",
    status: "Refilling",
    fill: 64,
    icon: Droplet,
    tone: "bg-sky-500/10 text-sky-600 dark:text-sky-300",
  },
  {
    title: "Generator sets",
    lead: "City Engineering",
    eta: "ETA 2h",
    status: "Dispatching",
    fill: 38,
    icon: Boxes,
    tone: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
  },
  {
    title: "Medical supplies",
    lead: "City Health",
    eta: "ETA 35m",
    status: "Ready",
    fill: 95,
    icon: ClipboardList,
    tone: "bg-purple-500/10 text-purple-600 dark:text-purple-300",
  },
];

export const ResourceManagement = () => {
  return (
    <div className="space-y-8">
      <SectionHeader
        title="Resource Management"
        description="Prioritize, mobilize, and audit critical resources. Track dispatch queues, staging capacity, and supply chain resilience across the city."
        actions={
          <button className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:shadow-md">
            <Truck className="h-4 w-4" />
            Launch logistics board
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          {resourcePipelines.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-base font-semibold text-foreground">
                        {item.title}
                      </p>
                      <p className="text-xs text-foreground/60">{item.lead}</p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${item.tone}`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="mt-4 text-xs text-foreground/60">
                  {item.eta}
                </div>

                <div className="mt-3 h-2 rounded-full bg-foreground/10">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${item.fill}%` }}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between text-sm text-foreground/70">
                  <span>Completed</span>
                  <span className="font-semibold text-foreground">
                    {item.fill}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground">
              Warehouse capacity
            </h3>
            <p className="mt-1 text-sm text-foreground/60">
              Perimeter staging overview.
            </p>
            <div className="mt-5 space-y-4 text-sm text-foreground/70">
              <div className="flex items-center justify-between">
                <span>Zone A (north)</span>
                <span className="font-semibold text-foreground">76%</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Zone B (central)</span>
                <span className="font-semibold text-foreground">54%</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Zone C (south)</span>
                <span className="font-semibold text-foreground">63%</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground">
              Resource alerts
            </h3>
            <ul className="mt-4 space-y-3 text-xs leading-relaxed text-foreground/60">
              <li>• Cold storage generator testing scheduled 1800H</li>
              <li>• 12 pallets of relief packs awaiting QA release</li>
              <li>• Heavy hauler truck 2 due for maintenance (48 hours)</li>
              <li>• Marine fuel reserve at 42% — requisition filed</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
