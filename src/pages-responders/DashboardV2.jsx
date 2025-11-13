import { useCallback, useEffect, useMemo, useState } from "react";
import Layout from "../layouts/Layout";
import EmergencyNotifications from "../components/responder/EmergencyNotifications";
import ResponseMap from "./pathfinding/ResponseMap";
import HospitalMap from "./pathfinding/HospitalMap";
import AssignedIncidentStatusPanel from "../components/responder/AssignedIncidentStatusPanel";
import LatestResponseMessages from "../components/responder/LatestResponseMessages";
import { fetchResponderIncidents } from "../services/incidents";
import { useAuth } from "../context/AuthContext";
import { AlertCircle, Loader2 } from "lucide-react";

const DashboardV2 = () => {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadIncidents = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetchResponderIncidents({ include_resolved: true });
      const data = response?.data?.data ?? response?.data ?? [];
      setIncidents(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      console.error("Failed to load incidents", fetchError);
      const message =
        fetchError?.response?.data?.message ||
        fetchError?.message ||
        "Unable to load incidents.";
      setError(message);
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.id) {
      loadIncidents();
    }
  }, [user, loadIncidents]);

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

  const handleIncidentUpdated = useCallback((updatedIncident) => {
    setIncidents((prev) => {
      const next = [...prev];
      const index = next.findIndex((incident) => incident.id === updatedIncident.id);
      if (index >= 0) {
        next[index] = { ...next[index], ...updatedIncident };
      } else {
        next.unshift(updatedIncident);
      }
      return next;
    });
    setRefreshKey((previous) => previous + 1);
  }, []);

  const handleRefresh = useCallback(() => {
    loadIncidents();
    setRefreshKey((previous) => previous + 1);
  }, [loadIncidents]);

  return (
    <Layout>
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="mx-auto flex w-full max-w-[1920px] flex-col gap-8 p-8">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Response Dashboard</h1>
              <p className="mt-1 text-sm text-gray-600">Monitor incidents and coordinate emergency response</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-50"
            >
              <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {error ? (
            <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          {/* Emergency Notifications - Priority Section */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Active Emergencies</h2>
            <EmergencyNotifications />
          </section>

          {/* Maps Section - Side by Side on Large Screens */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Tactical Maps</h2>
            <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
              <div className="flex flex-col">
                <h3 className="mb-3 text-sm font-medium text-gray-700">Emergency Response Map</h3>
                <div className="h-[480px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  <ResponseMap embedded className="rounded-xl" />
                </div>
              </div>
              <div className="flex flex-col">
                <h3 className="mb-3 text-sm font-medium text-gray-700">Hospital Navigation</h3>
                <div className="h-[480px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  <HospitalMap embedded className="rounded-xl" />
                </div>
              </div>
            </div>
          </section>

          {/* Action Panel Section */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Response Actions</h2>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <AssignedIncidentStatusPanel
                incidents={incidents}
                loading={loading}
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
