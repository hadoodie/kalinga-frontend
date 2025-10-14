import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  ChevronDown,
  ClipboardList,
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
  searchPlaceholder = "Search incidents, teams, or resources",
  heroBanner,
  quickActions: quickActionsProp,
  supportCard,
  timeWindowLabel = "Time window",
  autoRefreshLabel = "Auto-refresh",
  autoRefreshHint = "Every 60 seconds",
  consoleBadgeLabel = "Current View",
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [timeRange, setTimeRange] = useState("6h");
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
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
      label: "Log incident",
      description: "Capture a new field report or escalation",
      icon: AlertTriangle,
    },
    {
      label: "Resource board",
      description: "Review deployments & staging",
      icon: ClipboardList,
    },
    {
      label: "Broadcast advisory",
      description: "Push updates across channels",
      icon: Send,
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

  const quickActionItems = quickActionsProp ?? defaultQuickActions;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const shouldUseDark = storedTheme ? storedTheme === "dark" : prefersDark;

    if (shouldUseDark) {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDarkMode(false);
    }
  }, []);

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
    if (typeof window === "undefined") return;

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
                            admin.duty@kalinga.gov
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
                          Critical Alert
                        </p>
                        <p className="mt-1 text-base font-semibold text-primary">
                          River telemetry indicates surging levels in Barangays
                          San Roque & Centro.
                        </p>
                        <p className="mt-1 text-xs text-primary/70">
                          Water rise projected to reach threshold in 32 minutes.
                          Evacuation triggers prepped.
                        </p>
                      </div>
                    </div>
                    <button className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-primary transition hover:border-primary">
                      View playbook
                      <RefreshCcw className="h-4 w-4" />
                    </button>
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
                        onClick={() => setTimeRange(range.value)}
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
                    {autoRefreshHint}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {quickActionItems.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.label}
                      className="group flex h-full flex-col items-start gap-3 rounded-3xl border border-border/60 bg-background/60 p-5 text-left transition hover:border-primary/40 hover:bg-primary/5"
                    >
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:scale-105">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {action.label}
                        </p>
                        <p className="mt-1 text-xs text-foreground/60">
                          {action.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
