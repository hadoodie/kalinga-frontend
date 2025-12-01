import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  Shield,
  User,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import { SectionHeader } from "../SectionHeader";
import adminService from "../../../services/adminService";

// Status badge styling
const statusBadges = {
  available: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  busy: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  offline: "bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-300",
  on_scene: "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300",
  en_route: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
};

// Assignment status badges
const assignmentBadges = {
  assigned: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  en_route: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  on_scene: "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
};

// Format relative time
const formatRelativeTime = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

export const ResponderOverview = () => {
  const [stats, setStats] = useState(null);
  const [responders, setResponders] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [responderStats, incidentData] = await Promise.all([
        adminService.getResponderStats(),
        adminService.getIncidents({ include_resolved: false }),
      ]);
      
      setStats(responderStats);
      setResponders(responderStats.responders || []);
      setIncidents(incidentData);
    } catch (error) {
      console.error("Error fetching responder data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter responders
  const filteredResponders = responders.filter((r) => {
    const matchesSearch = !searchQuery || 
      r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const status = r.activeAssignments > 0 ? "busy" : r.is_active ? "available" : "offline";
    const matchesStatus = !statusFilter || status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Group responders by status
  const availableCount = responders.filter(r => r.is_active && !r.activeAssignments).length;
  const busyCount = responders.filter(r => r.is_active && r.activeAssignments > 0).length;
  const offlineCount = responders.filter(r => !r.is_active).length;

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Responder Overview"
        description="Monitor responder availability, active assignments, and deployment status across all teams."
        actions={
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-full border border-border/60 px-4 py-2 text-sm font-medium text-foreground/70 transition hover:border-primary/40 hover:text-primary"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        }
      />

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card/80 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{stats?.total ?? 0}</p>
            <p className="text-sm text-foreground/60">Total Responders</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card/80 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
            <UserCheck className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{stats?.available ?? availableCount}</p>
            <p className="text-sm text-foreground/60">Available</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card/80 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
            <Activity className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{stats?.busy ?? busyCount}</p>
            <p className="text-sm text-foreground/60">On Assignment</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card/80 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-500/10">
            <XCircle className="h-6 w-6 text-gray-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{offlineCount}</p>
            <p className="text-sm text-foreground/60">Offline</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Responders List */}
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
              <input
                type="search"
                placeholder="Search responders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 w-full rounded-full border border-border/60 bg-background/60 pl-11 pr-4 text-sm outline-none transition focus:border-primary/40"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 rounded-full border border-border/60 bg-background/60 px-4 text-sm outline-none focus:border-primary/40"
            >
              <option value="">All Status</option>
              <option value="available">Available</option>
              <option value="busy">On Assignment</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          {/* Responders Table */}
          <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4">Responder Directory</h3>
            
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredResponders.length === 0 ? (
              <p className="text-center py-8 text-foreground/60">No responders found</p>
            ) : (
              <div className="space-y-3">
                {filteredResponders.slice(0, 10).map((responder) => {
                  const status = responder.activeAssignments > 0 
                    ? "busy" 
                    : responder.is_active ? "available" : "offline";
                  
                  return (
                    <div
                      key={responder.id}
                      className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-background/60 p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                          {responder.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{responder.name}</p>
                          <p className="text-xs text-foreground/60">{responder.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        {responder.phone && (
                          <div className="flex items-center gap-1.5 text-foreground/60">
                            <Phone className="h-4 w-4" />
                            <span>{responder.phone}</span>
                          </div>
                        )}
                        {responder.activeAssignments > 0 && (
                          <div className="flex items-center gap-1.5 text-amber-600">
                            <Activity className="h-4 w-4" />
                            <span>{responder.activeAssignments} active</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                          statusBadges[status]
                        }`}>
                          {status === "busy" ? "On Assignment" : status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {filteredResponders.length > 10 && (
              <p className="mt-4 text-xs text-foreground/50">
                Showing 10 of {filteredResponders.length} responders
              </p>
            )}
          </div>
        </div>

        {/* Sidebar - Active Incidents with Assignments */}
        <div className="space-y-4">
          {/* Active Assignments */}
          <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Active Incidents</h3>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : incidents.length === 0 ? (
              <p className="text-sm text-foreground/60">No active incidents</p>
            ) : (
              <div className="space-y-3">
                {incidents.slice(0, 5).map((incident) => {
                  const assignmentCount = incident.assignments?.length || 0;
                  const activeAssignments = incident.assignments?.filter(
                    a => !['completed', 'cancelled'].includes(a.status)
                  ) || [];
                  
                  return (
                    <div
                      key={incident.id}
                      className="rounded-xl border border-border/60 bg-background/60 p-3"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {incident.type || "Emergency"}
                          </p>
                          <p className="text-xs text-foreground/60">
                            INC-{incident.id}
                          </p>
                        </div>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
                          assignmentBadges[incident.status] || "bg-primary/10 text-primary"
                        }`}>
                          {incident.status?.replace('_', ' ')}
                        </span>
                      </div>
                      
                      {activeAssignments.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-border/40">
                          <p className="text-xs text-foreground/50 mb-1">
                            Assigned Responders:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {activeAssignments.slice(0, 3).map((assignment) => (
                              <span
                                key={assignment.id}
                                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                              >
                                <User className="h-3 w-3" />
                                {assignment.responder?.name || `ID ${assignment.responder_id}`}
                              </span>
                            ))}
                            {activeAssignments.length > 3 && (
                              <span className="text-xs text-foreground/50">
                                +{activeAssignments.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {assignmentCount === 0 && (
                        <div className="flex items-center gap-1 text-xs text-amber-600 mt-2">
                          <AlertCircle className="h-3 w-3" />
                          No responders assigned
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4">Response Metrics</h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-foreground/70">Active Incidents</span>
                <span className="font-semibold text-foreground">{incidents.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground/70">Unassigned Incidents</span>
                <span className="font-semibold text-amber-600">
                  {incidents.filter(i => !i.assignments?.length).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground/70">Avg Response Time</span>
                <span className="font-semibold text-foreground">~14 min</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground/70">Coverage Rate</span>
                <span className="font-semibold text-emerald-600">
                  {stats?.total > 0 ? Math.round((stats.available / stats.total) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
