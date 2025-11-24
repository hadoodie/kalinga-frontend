import { useCallback, useMemo, useState } from "react";
import Layout from "../layouts/Layout";
import EmergencyNotifications from "../components/responder/EmergencyNotifications";
import ResponseMap from "./pathfinding/ResponseMap";
import HospitalMap from "./pathfinding/HospitalMap";
import AssignedIncidentStatusPanel from "../components/responder/AssignedIncidentStatusPanel";
import LatestResponseMessages from "../components/responder/LatestResponseMessages";
import { useAuth } from "../context/AuthContext";
import { AlertCircle, Loader2 } from "lucide-react";
import { useIncidents } from "../context/IncidentContext";

const DashboardV2 = () => {
  const { user } = useAuth();
  const { incidents, loading, refreshing, error, refresh, mergeIncident } =
    useIncidents();
  const [refreshKey, setRefreshKey] = useState(0);

  const assignedIncidents = useMemo(() => {
    if (!user?.id) return [];
    return incidents.filter((incident) =>
      Array.isArray(incident.assignments)
        ? incident.assignments.some(
            (assignment) => assignment?.responder?.id === user.id
          )
        : false
    );
  }, [incidents, user?.id]);

  const latestIncident = useMemo(() => {
    if (assignedIncidents.length === 0) return null;

    return [...assignedIncidents].sort((a, b) => {
      const timeA = a.latest_update?.created_at
        ? new Date(a.latest_update.created_at).getTime()
        : new Date(a.reported_at ?? 0).getTime();
      const timeB = b.latest_update?.created_at
        ? new Date(b.latest_update.created_at).getTime()
        : new Date(b.reported_at ?? 0).getTime();
      return timeB - timeA;
    })[0];
  }, [assignedIncidents]);

  const isBusy = loading || refreshing;
  const panelLoading = loading && incidents.length === 0;

  const handleIncidentUpdated = useCallback(
    (updatedIncident) => {
      if (!updatedIncident) return;
      mergeIncident(updatedIncident);
      setRefreshKey((previous) => previous + 1);
    },
    [mergeIncident]
  );

  const handleRefresh = useCallback(() => {
    refresh();
    setRefreshKey((previous) => previous + 1);
  }, [refresh]);

  return (
    <Layout>
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="mx-auto flex w-full max-w-[1920px] flex-col gap-8 p-8">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Response Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Monitor incidents and coordinate emergency response
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isBusy}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-50"
            >
              <Loader2 className={`h-4 w-4 ${isBusy ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {/* Status Overview */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Active Assignments
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {assignedIncidents.length}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <div className="relative flex h-5 w-5 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Shift Status
                  </p>
                  <p className="text-lg font-bold text-gray-900">On Duty</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Loader2 className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    System Status
                  </p>
                  <p className="text-lg font-bold text-gray-900">Operational</p>
                </div>
              </div>
            </div>
          </div>

          {error ? (
            <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          {/* Emergency Notifications - Priority Section */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                Active Emergencies
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                {incidents.length} Total
              </span>
            </div>
            <EmergencyNotifications />
          </section>

          {/* Maps Section - Side by Side on Large Screens */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-bold text-gray-900">Tactical Maps</h2>
              <span className="text-xs text-gray-500 font-medium px-2 py-1 bg-gray-100 rounded-md">
                Real-time Tracking
              </span>
            </div>
            <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
              <div className="flex flex-col bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                <h3 className="mb-3 text-sm font-bold text-gray-700 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Emergency Response Map
                </h3>
                <div className="h-[480px] overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                  <ResponseMap embedded className="rounded-xl" />
                </div>
              </div>
              <div className="flex flex-col bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                <h3 className="mb-3 text-sm font-bold text-gray-700 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Hospital Navigation
                </h3>
                <div className="h-[480px] overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                  <HospitalMap embedded className="rounded-xl" />
                </div>
              </div>
            </div>
          </section>

          {/* Action Panel Section */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Response Actions
            </h2>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <AssignedIncidentStatusPanel
                incidents={incidents}
                loading={panelLoading}
                error={error}
                onRefresh={handleRefresh}
                onIncidentUpdated={handleIncidentUpdated}
                currentUserId={user?.id}
              />
              <LatestResponseMessages
                incident={latestIncident}
                refreshKey={refreshKey}
                currentUserId={user?.id}
              />
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardV2;
