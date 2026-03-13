import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  ChevronDown,
  ClipboardList,
  Map,
  Menu,
  Moon,
  RefreshCcw,
  Search,
  Settings,
  Send,
  Sun,
  UserRound,
  SlidersHorizontal,
  LifeBuoy,
  LogOut,
  X,
} from "lucide-react";
import logo from "@/assets/kalinga-logo.png";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/datetime";
import adminService from "@/services/adminService";

const COMMAND_SYNC_INTERVAL_MS = 10 * 1000;
const QUICK_ACTION_SYNC_INTERVAL_MS = 10 * 1000;

const timeWindowToMs = {
  "3h": 3 * 60 * 60 * 1000,
  "6h": 6 * 60 * 60 * 1000,
  "12h": 12 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
};

const incidentPriorityScore = (incident) => {
  const priority = (
    incident.priority ||
    incident.severity ||
    incident.status ||
    ""
  ).toLowerCase();
  if (priority.includes("critical") || priority.includes("severe")) return 4;
  if (priority.includes("high") || priority.includes("en_route")) return 3;
  if (priority.includes("moderate") || priority.includes("ack")) return 2;
  return 1;
};

const getIncidentLocation = (incident) =>
  incident.barangay ||
  incident.address ||
  incident.location?.address ||
  incident.location?.barangay ||
  incident.city ||
  incident.region ||
  "reported area";

export const AdminLayout = ({
  sections,
  activeSectionId,
  onSectionChange,
  onLogout,
  children,
  consoleLabel = "Admin Console",
  consoleSubtitle = "Kalinga Command",
  personaInitials = "AD",
  personaName = "Admin Duty",
  personaRole = "Operations Lead",
  personaEmail = "admin.duty@kalinga.gov",
  searchPlaceholder = "Search incidents, teams, or resources",
  heroBanner,
  quickActions: quickActionsProp,
  supportCard,
  timeWindowLabel = "Time window",
  autoRefreshLabel = "Auto-refresh",
  autoRefreshHint = "Every 10 seconds",
  consoleBadgeLabel = "Current View",
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage for theme preference
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "dark";
  });
  const [timeRange, setTimeRange] = useState("6h");
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [alertHighlight, setAlertHighlight] = useState(null);
  const [alertStatus, setAlertStatus] = useState("idle");
  const [alertError, setAlertError] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [quickActionMetrics, setQuickActionMetrics] = useState({
    incidents: null,
    resources: null,
    notificationCount: null,
  });
  const [quickActionStatus, setQuickActionStatus] = useState("idle");
  const [quickActionError, setQuickActionError] = useState(null);
  const [quickActionSyncedAt, setQuickActionSyncedAt] = useState(null);
  const profileMenuRef = useRef(null);
  const profileButtonRef = useRef(null);

  const activeSection = useMemo(
    () =>
      sections.find((section) => section.id === activeSectionId) ?? sections[0],
    [sections, activeSectionId]
  );

  const timeRanges = [
    { value: "3h", label: "Last 3h" },
    { value: "6h", label: "Last 6h" },
    { value: "12h", label: "Last 12h" },
    { value: "24h", label: "24 hours" },
    { value: "7d", label: "7 days" },
  ];

  const defaultQuickActions = [
    {
      id: "log-incident",
      label: "Log incident",
      description: "Capture a new field report or escalation",
      icon: AlertTriangle,
      route: "incidents",
      metric: (metrics) =>
        metrics?.incidents
          ? {
              label: "Active incidents",
              value: metrics.incidents.active ?? metrics.incidents.total ?? 0,
            }
          : null,
    },
    {
      id: "resource-board",
      label: "Resource board",
      description: "Review deployments & staging",
      icon: ClipboardList,
      route: "resources",
      metric: (metrics) =>
        metrics?.resources
          ? {
              label: "Critical stock",
              value: metrics.resources.critical ?? 0,
              helper: `${metrics.resources.lowStock ?? 0} low stock / ${
                metrics.resources.expiring ?? 0
              } expiring soon`,
            }
          : null,
    },
    {
      id: "broadcast-advisory",
      label: "Broadcast advisory",
      description: "Push updates across channels",
      icon: Send,
      route: "broadcast",
      metric: (metrics) =>
        typeof metrics?.notificationCount === "number"
          ? {
              label: "Advisories",
              value: metrics.notificationCount,
            }
          : null,
    },
  ];

  const profileOptions = [
    { value: "profile", label: "View profile", icon: UserRound },
    { value: "settings", label: "Settings", icon: Settings },
    {
      value: "preferences",
      label: "Command preferences",
      icon: SlidersHorizontal,
    },
    { value: "support", label: "Support", icon: LifeBuoy },
    { value: "logout", label: "Sign out", icon: LogOut, tone: "text-rose-500" },
  ];

  const quickActionItems = useMemo(
    () =>
      (quickActionsProp ?? defaultQuickActions).map((action) => ({
        ...action,
        metric: action.metric?.(quickActionMetrics),
      })),
    [quickActionsProp, quickActionMetrics]
  );

  const fetchCommandAlert = useCallback(
    async (windowValue = timeRange) => {
      setAlertStatus((prev) => (prev === "success" ? "refreshing" : "loading"));
      try {
        const incidents = await adminService.getIncidents({
          include_resolved: false,
        });
        const limitMs = timeWindowToMs[windowValue] ?? timeWindowToMs["6h"];
        const now = Date.now();
        const filtered = (incidents || []).filter((incident) => {
          const timestamp = new Date(
            incident.updated_at || incident.created_at || Date.now()
          ).getTime();
          if (Number.isNaN(timestamp)) return true;
          return now - timestamp <= limitMs;
        });
        const sorted = filtered.sort((a, b) => {
          const severityDiff = incidentPriorityScore(b) - incidentPriorityScore(a);
          if (severityDiff !== 0) return severityDiff;
          const bTime = new Date(b.updated_at || b.created_at || 0).getTime();
          const aTime = new Date(a.updated_at || a.created_at || 0).getTime();
          return bTime - aTime;
        });
        setAlertHighlight(sorted[0] || null);
        setAlertStatus("success");
        setAlertError(null);
        setLastSynced(new Date());
      } catch (error) {
        console.error("Failed to sync command alerts", error);
        setAlertError("Unable to sync command alerts. Showing last known state.");
        setAlertStatus("error");
      }
    },
    [timeRange]
  );

  const fetchQuickActionMetrics = useCallback(async () => {
    setQuickActionStatus((prev) => (prev === "success" ? "refreshing" : "loading"));
    try {
      const [incidentStats, resourceStats, notifications] = await Promise.all([
        adminService.getIncidentStats().catch(() => null),
        adminService.getResourceStats().catch(() => null),
        adminService.getNotifications().catch(() => []),
      ]);

      const notificationCount = Array.isArray(notifications)
        ? notifications.length
        : Array.isArray(notifications?.data)
        ? notifications.data.length
        : Number(notifications?.meta?.total ?? 0);

      setQuickActionMetrics({
        incidents: incidentStats,
        resources: resourceStats,
        notificationCount: Number.isFinite(notificationCount)
          ? notificationCount
          : 0,
      });
      setQuickActionStatus("success");
      setQuickActionError(null);
      setQuickActionSyncedAt(new Date());
    } catch (error) {
      console.error("Failed to sync quick action metrics", error);
      setQuickActionStatus("error");
      setQuickActionError("Unable to sync quick action metrics.");
    }
  }, []);

  useEffect(() => {
    fetchCommandAlert(timeRange);
  }, [fetchCommandAlert, timeRange]);

  useEffect(() => {
    if (!isAutoRefresh) return undefined;
    const id = setInterval(
      () => fetchCommandAlert(timeRange),
      COMMAND_SYNC_INTERVAL_MS
    );
    return () => clearInterval(id);
  }, [fetchCommandAlert, isAutoRefresh, timeRange]);

  useEffect(() => {
    fetchQuickActionMetrics();
    const id = setInterval(
      () => fetchQuickActionMetrics(),
      QUICK_ACTION_SYNC_INTERVAL_MS
    );
    return () => clearInterval(id);
  }, [fetchQuickActionMetrics]);

  const heroStatusLabel = useMemo(() => {
    if (alertStatus === "loading") return "Syncing alerts…";
    if (alertStatus === "refreshing") return "Refreshing feed…";
    if (alertStatus === "error") return alertError || "Using cached alerts";
    if (lastSynced) {
      return `Updated ${formatRelativeTime(lastSynced, { short: true })}`;
    }
    return "Monitoring telemetry";
  }, [alertError, alertStatus, lastSynced]);

  const quickActionStatusLabel = useMemo(() => {
    if (quickActionStatus === "loading") return "Syncing live shortcuts…";
    if (quickActionStatus === "refreshing") return "Refreshing metrics…";
    if (quickActionStatus === "error") return quickActionError || "Metrics unavailable";
    if (quickActionSyncedAt) {
      return `Updated ${formatRelativeTime(quickActionSyncedAt, { short: true })}`;
    }
    return "Awaiting telemetry";
  }, [quickActionError, quickActionStatus, quickActionSyncedAt]);

  const heroTitle = alertHighlight
    ? `${alertHighlight.type || "Incident"} in ${getIncidentLocation(alertHighlight)}.`
    : "No critical alerts in the selected window.";

  const heroSubtitle = alertHighlight && !alertError
    ? `Status ${(alertHighlight.status || alertHighlight.priority || "reported")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())} • Updated ${formatRelativeTime(
        alertHighlight.updated_at || alertHighlight.created_at || new Date()
      )}`
    : alertError || "System will surface the next telemetry event automatically.";

  const autoRefreshStatus = heroStatusLabel || autoRefreshHint;

  const handleQuickAction = useCallback(
    async (action) => {
      if (!action) return;

      if (typeof action.onClick === "function") {
        await action.onClick({
          metrics: quickActionMetrics,
          refetch: fetchQuickActionMetrics,
        });
        return;
      }

      if (action.route) {
        onSectionChange?.(action.route);
        setIsSidebarOpen(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [fetchQuickActionMetrics, onSectionChange, quickActionMetrics]
  );

  // Apply theme to document element on mount and when it changes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  useEffect(() => {
    const handleClickAway = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target) &&
        profileButtonRef.current &&
        !profileButtonRef.current.contains(event.target)
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickAway);
    return () => document.removeEventListener("mousedown", handleClickAway);
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;

      if (next) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
      return next;
    });
  };

  const handleProfileAction = (value) => {
    setIsProfileMenuOpen(false);
    switch (value) {
      case "logout":
        onLogout?.();
        break;
      case "support":
        window.open(
          "mailto:command-support@kalinga.gov?subject=Command%20Center%20Support%20Request",
          "_blank"
        );
        break;
      case "settings":
      case "profile":
      case "preferences":
      default:
        console.info(`Selected admin profile action: ${value}`);
        break;
    }
  };

  const renderNavItem = (section) => {
    const Icon = section.icon;
    const isActive = section.id === activeSection.id;

    return (
      <button
        key={section.id}
        onClick={() => {
          onSectionChange(section.id);
          setIsSidebarOpen(false);
        }}
        className={cn(
          "group flex w-full items-center gap-3 rounded-xl border border-transparent px-4 py-3 text-left transition-all",
          "hover:border-primary/40 hover:bg-primary/5",
          isActive && "border-primary/60 bg-primary/10 text-primary"
        )}
      >
        <span
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform",
            isActive && "scale-105"
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <span className="space-y-1">
          <p className="text-sm font-semibold">{section.title}</p>
          {section.description && (
            <p className="text-xs text-foreground/60 leading-relaxed">
              {section.description}
            </p>
          )}
        </span>
      </button>
    );
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        {/* Desktop Sidebar */}
        <aside className="hidden border-r border-border/60 bg-card/80 lg:flex lg:flex-col">
          <div className="flex items-center gap-3 border-b border-border/60 px-6 py-6">
            <img
              src={logo}
              alt="Kalinga"
              className="h-10 w-10 rounded-full border border-border/60"
            />
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-foreground/60">
                {consoleLabel}
              </p>
              <h1 className="text-lg font-semibold text-foreground">
                {consoleSubtitle}
              </h1>
            </div>
          </div>

          <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
            {sections.map((section) => renderNavItem(section))}
          </nav>

          <div className="px-6 py-5 border-t border-border/60">
            {supportCard ?? (
              <div className="rounded-2xl bg-primary/10 p-4 text-sm text-primary/80">
                <p className="font-semibold text-primary">Need help?</p>
                <p className="mt-1 leading-relaxed text-primary/80">
                  Reach out to the response coordination team for support or to
                  escalate incidents.
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* Mobile Sidebar Drawer */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw] border-r border-border/60 bg-background/95 backdrop-blur-lg transition-transform duration-300 lg:hidden",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
            <div className="flex items-center gap-3">
              <img
                src={logo}
                alt="Kalinga"
                className="h-8 w-8 rounded-full border border-border/60"
              />
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-foreground/60">
                  {consoleLabel}
                </p>
                <h1 className="text-base font-semibold text-foreground">
                  {consoleSubtitle}
                </h1>
              </div>
            </div>
            <button
              className="rounded-full border border-border/60 p-2 text-foreground/70"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6 pb-16">
            {sections.map((section) => renderNavItem(section))}
          </nav>
        </div>

        {/* Main */}
        <div className="relative flex min-h-screen flex-col">
          <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="flex items-center gap-3">
                <button
                  className="rounded-xl border border-border/60 p-2 text-foreground/70 transition hover:border-primary/40 hover:text-primary lg:hidden"
                  onClick={() => setIsSidebarOpen((prev) => !prev)}
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-foreground/60">
                    {consoleBadgeLabel}
                  </p>
                  <h2 className="text-lg font-semibold text-foreground">
                    {activeSection.title}
                  </h2>
                </div>
              </div>
              <div className="flex flex-1 items-center gap-3 max-w-xl">
                <div className="relative hidden flex-1 items-center lg:flex">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/60" />
                  <input
                    type="search"
                    placeholder={searchPlaceholder}
                    className="h-11 w-full rounded-full border border-border/60 bg-background/60 pl-12 pr-4 text-sm outline-none transition focus:border-primary/50 focus:ring focus:ring-primary/20"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleTheme}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-background/60 text-foreground/70 transition hover:border-primary/50 hover:text-primary"
                    aria-label="Toggle theme"
                  >
                    {isDarkMode ? (
                      <Sun className="h-5 w-5" />
                    ) : (
                      <Moon className="h-5 w-5" />
                    )}
                  </button>
                  <button className="flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-background/60 text-foreground/70 transition hover:border-primary/50 hover:text-primary">
                    <Bell className="h-5 w-5" />
                  </button>
                  <div className="relative">
                    <button
                      ref={profileButtonRef}
                      onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                      className="flex items-center gap-3 rounded-full border border-border/60 bg-background/60 px-3 py-2 transition hover:border-primary/40 hover:text-primary"
                      aria-expanded={isProfileMenuOpen}
                      aria-haspopup="menu"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary">
                        {personaInitials}
                      </div>
                      <div className="hidden text-left text-sm lg:block">
                        <p className="font-semibold text-foreground">
                          {personaName}
                        </p>
                        <p className="text-foreground/60">{personaRole}</p>
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-foreground/50 transition",
                          isProfileMenuOpen && "rotate-180"
                        )}
                      />
                    </button>

                    {isProfileMenuOpen && (
                      <div
                        ref={profileMenuRef}
                        className="absolute right-0 z-50 mt-3 w-60 origin-top-right rounded-2xl border border-border/60 bg-background/95 p-2 text-sm shadow-xl backdrop-blur"
                        role="menu"
                      >
                        <div className="border-b border-border/60 px-3 pb-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-foreground/50">
                            Signed in as
                          </p>
                          <p className="mt-1 font-semibold text-foreground">
                            {personaEmail}
                          </p>
                        </div>
                        <div className="py-1">
                          {profileOptions.map((option) => {
                            const Icon = option.icon;
                            return (
                              <button
                                key={option.value}
                                onClick={() =>
                                  handleProfileAction(option.value)
                                }
                                className={cn(
                                  "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-primary/10",
                                  option.tone
                                    ? option.tone
                                    : "text-foreground/80"
                                )}
                                role="menuitem"
                              >
                                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                  <Icon className="h-4 w-4" />
                                </span>
                                <span className="text-sm font-medium">
                                  {option.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 space-y-8 px-4 pb-12 pt-6 md:px-8 lg:px-10">
            <div className="space-y-6">
              {heroBanner ?? (
                <div className="rounded-3xl border border-primary/30 bg-primary/10 p-5 text-sm text-primary/90 shadow-sm">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                        <Activity className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-primary/70">
                          {alertHighlight ? "Critical Alert" : "Command Status"}
                        </p>
                        <p className="mt-1 text-base font-semibold text-primary">
                          {heroTitle}
                        </p>
                        <p className="mt-1 text-xs text-primary/70">{heroSubtitle}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-start gap-2 text-xs text-primary/70 lg:items-end">
                      <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 px-3 py-1">
                        <RefreshCcw className="h-3.5 w-3.5" /> {heroStatusLabel}
                      </span>
                      <button
                        onClick={() => {
                          onSectionChange?.("incidents");
                          setIsSidebarOpen(false);
                        }}
                        className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-primary transition hover:border-primary"
                      >
                        {alertHighlight ? "View incident log" : "Review incidents"}
                        <Map className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-card/80 p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/50">
                    {timeWindowLabel}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {timeRanges.map((range) => (
                      <button
                        key={range.value}
                        onClick={() => {
                          setTimeRange(range.value);
                          fetchCommandAlert(range.value);
                        }}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                          timeRange === range.value
                            ? "border-primary bg-primary text-primary-foreground shadow-sm"
                            : "border-border/60 bg-background/60 text-foreground/70 hover:border-primary/40 hover:text-primary"
                        )}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs uppercase tracking-[0.2em] text-foreground/60">
                    {autoRefreshLabel}
                  </span>
                  <button
                    onClick={() => setIsAutoRefresh((prev) => !prev)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                      isAutoRefresh
                        ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-500"
                        : "border-border/60 bg-background/60 text-foreground/60 hover:border-primary/40 hover:text-primary"
                    )}
                  >
                    <RefreshCcw className="h-3.5 w-3.5" />
                    {isAutoRefresh ? "Enabled" : "Paused"}
                  </button>
                  <span className="text-xs text-foreground/50">
                    {autoRefreshStatus}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-col gap-2 text-xs text-foreground/60 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold uppercase tracking-[0.2em] text-foreground/50">
                      Command shortcuts
                    </p>
                    <p className="text-foreground/60">{quickActionStatusLabel}</p>
                  </div>
                  <button
                    onClick={fetchQuickActionMetrics}
                    className="inline-flex items-center gap-2 rounded-full border border-border/60 px-3 py-1.5 font-semibold text-foreground/70 transition hover:border-primary/40 hover:text-primary"
                    disabled={quickActionStatus === "loading"}
                  >
                    <RefreshCcw
                      className={cn(
                        "h-3.5 w-3.5",
                        quickActionStatus === "loading" && "animate-spin"
                      )}
                    />
                    Sync data
                  </button>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {quickActionItems.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.id || action.label}
                        type="button"
                        onClick={() => handleQuickAction(action)}
                        className="group flex h-full flex-col items-start gap-3 rounded-3xl border border-border/60 bg-background/60 p-5 text-left transition hover:border-primary/40 hover:bg-primary/5"
                      >
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:scale-105">
                          <Icon className="h-5 w-5" />
                        </span>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-foreground">
                            {action.label}
                          </p>
                          <p className="text-xs text-foreground/60">
                            {action.description}
                          </p>
                          {action.metric ? (
                            <p className="text-xs text-foreground/70">
                              {action.metric.label}:
                              <span className="ml-1 font-semibold text-foreground">
                                {action.metric.value}
                              </span>
                              {action.metric.helper && (
                                <span className="ml-1 text-foreground/50">
                                  ({action.metric.helper})
                                </span>
                              )}
                            </p>
                          ) : quickActionStatus === "error" ? (
                            <p className="text-xs text-rose-500">
                              {quickActionError}
                            </p>
                          ) : (
                            <p className="text-xs text-foreground/50">
                              {quickActionStatus === "loading"
                                ? "Syncing metrics…"
                                : "Awaiting live data"}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
