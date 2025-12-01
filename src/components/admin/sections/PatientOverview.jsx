import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Calendar,
  Clock,
  Heart,
  Loader2,
  Phone,
  RefreshCw,
  Search,
  Shield,
  User,
  UserCheck,
  Users,
} from "lucide-react";
import { SectionHeader } from "../SectionHeader";
import adminService from "../../../services/adminService";

// Priority badges
const priorityBadges = {
  critical: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  high: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  moderate: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  low: "bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-300",
};

// Status badges
const statusBadges = {
  registered: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  in_emergency: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  resolved: "bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-300",
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

export const PatientOverview = () => {
  const [stats, setStats] = useState(null);
  const [patients, setPatients] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [patientStats, incidentData] = await Promise.all([
        adminService.getPatientStats(),
        adminService.getIncidents({ include_resolved: false }),
      ]);
      
      setStats(patientStats);
      setPatients(patientStats.patients || []);
      setIncidents(incidentData);
    } catch (error) {
      console.error("Error fetching patient data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Get patients with active emergencies
  const patientsWithEmergencies = patients.filter(p => {
    return incidents.some(i => i.patient_id === p.id && !['resolved', 'cancelled'].includes(i.status));
  });

  // Filter patients
  const filteredPatients = patients.filter((p) => {
    const matchesSearch = !searchQuery || 
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const hasEmergency = incidents.some(i => 
      i.patient_id === p.id && !['resolved', 'cancelled'].includes(i.status)
    );
    const status = hasEmergency ? "in_emergency" : p.is_active ? "active" : "registered";
    const matchesStatus = !statusFilter || status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Get critical incidents
  const criticalIncidents = incidents.filter(i => 
    i.priority === 'critical' || i.severity === 'critical'
  );

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Patient Overview"
        description="Monitor registered patients, track active emergencies, and view patient health metrics across the system."
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
            <p className="text-2xl font-bold text-foreground">{stats?.total ?? patients.length}</p>
            <p className="text-sm text-foreground/60">Total Patients</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card/80 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
            <UserCheck className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{stats?.active ?? patients.filter(p => p.is_active).length}</p>
            <p className="text-sm text-foreground/60">Active Patients</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card/80 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10">
            <AlertTriangle className="h-6 w-6 text-rose-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{patientsWithEmergencies.length}</p>
            <p className="text-sm text-foreground/60">In Emergency</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card/80 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
            <Activity className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{criticalIncidents.length}</p>
            <p className="text-sm text-foreground/60">Critical Cases</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Patients List */}
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
              <input
                type="search"
                placeholder="Search patients..."
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
              <option value="active">Active</option>
              <option value="in_emergency">In Emergency</option>
              <option value="registered">Registered</option>
            </select>
          </div>

          {/* Patients Table */}
          <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4">Patient Directory</h3>
            
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredPatients.length === 0 ? (
              <p className="text-center py-8 text-foreground/60">No patients found</p>
            ) : (
              <div className="space-y-3">
                {filteredPatients.slice(0, 10).map((patient) => {
                  const activeIncident = incidents.find(i => 
                    i.patient_id === patient.id && !['resolved', 'cancelled'].includes(i.status)
                  );
                  const hasEmergency = !!activeIncident;
                  const status = hasEmergency ? "in_emergency" : patient.is_active ? "active" : "registered";
                  
                  return (
                    <div
                      key={patient.id}
                      className={`flex flex-col gap-4 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between ${
                        hasEmergency 
                          ? "border-rose-300 bg-rose-50/50 dark:border-rose-500/30 dark:bg-rose-500/5"
                          : "border-border/60 bg-background/60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center font-semibold ${
                          hasEmergency 
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"
                            : "bg-primary/10 text-primary"
                        }`}>
                          {patient.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground">{patient.name}</p>
                            {hasEmergency && (
                              <AlertTriangle className="h-4 w-4 text-rose-500 animate-pulse" />
                            )}
                          </div>
                          <p className="text-xs text-foreground/60">{patient.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        {patient.phone && (
                          <div className="flex items-center gap-1.5 text-foreground/60">
                            <Phone className="h-4 w-4" />
                            <span>{patient.phone}</span>
                          </div>
                        )}
                        {patient.created_at && (
                          <div className="flex items-center gap-1.5 text-foreground/60">
                            <Calendar className="h-4 w-4" />
                            <span>Reg: {formatRelativeTime(patient.created_at)}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {activeIncident && (
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold capitalize ${
                            priorityBadges[activeIncident.priority || activeIncident.severity] || priorityBadges.moderate
                          }`}>
                            {activeIncident.priority || activeIncident.severity || "Active"}
                          </span>
                        )}
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                          statusBadges[status]
                        }`}>
                          {status === "in_emergency" ? "In Emergency" : status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {filteredPatients.length > 10 && (
              <p className="mt-4 text-xs text-foreground/50">
                Showing 10 of {filteredPatients.length} patients
              </p>
            )}
          </div>
        </div>

        {/* Sidebar - Active Emergencies */}
        <div className="space-y-4">
          {/* Active Emergencies */}
          <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              <h3 className="text-lg font-semibold text-foreground">Active Emergencies</h3>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : incidents.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Shield className="h-10 w-10 text-emerald-500" />
                <p className="text-sm text-foreground/60">No active emergencies</p>
                <p className="text-xs text-foreground/40">All patients are safe</p>
              </div>
            ) : (
              <div className="space-y-3">
                {incidents.slice(0, 5).map((incident) => {
                  const patient = patients.find(p => p.id === incident.patient_id);
                  
                  return (
                    <div
                      key={incident.id}
                      className="rounded-xl border border-border/60 bg-background/60 p-3"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {incident.type || "Medical Emergency"}
                          </p>
                          <p className="text-xs text-foreground/60">
                            {patient?.name || `Patient #${incident.patient_id}`}
                          </p>
                        </div>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
                          priorityBadges[incident.priority || incident.severity] || priorityBadges.moderate
                        }`}>
                          {incident.priority || incident.severity || "Unknown"}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-foreground/50 mt-2">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatRelativeTime(incident.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          <span className="capitalize">{incident.status?.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Health Metrics */}
          <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Health Metrics</h3>
            </div>
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-foreground/70">Active Patients</span>
                <span className="font-semibold text-foreground">
                  {patients.filter(p => p.is_active).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground/70">Emergency Rate</span>
                <span className="font-semibold text-amber-600">
                  {patients.length > 0 
                    ? Math.round((patientsWithEmergencies.length / patients.length) * 100) 
                    : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground/70">Critical Cases</span>
                <span className="font-semibold text-rose-600">{criticalIncidents.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground/70">Avg Response</span>
                <span className="font-semibold text-foreground">~8 min</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
