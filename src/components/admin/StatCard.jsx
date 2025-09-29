import { cn } from "@/lib/utils";

export const StatCard = ({
  icon: Icon,
  label,
  value,
  change,
  trend = "up",
  tone = "primary",
  className,
}) => {
  const toneStyles = {
    primary: "bg-primary/10 text-primary",
    success:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    warning:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    danger: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
    neutral: "bg-foreground/5 text-foreground/80",
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-card/60 p-5 shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground/70">{label}</span>
        {Icon && (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </span>
        )}
      </div>
      <div className="mt-4 flex items-baseline gap-3">
        <p className="text-3xl font-semibold text-foreground">{value}</p>
        {change && (
          <span
            className={cn(
              "flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium",
              trend === "up"
                ? toneStyles[tone]
                : "bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-200"
            )}
          >
            <span>{trend === "up" ? "▲" : "▼"}</span>
            {change}
          </span>
        )}
      </div>
    </div>
  );
};
