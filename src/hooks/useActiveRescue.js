/**
 * Hook to check if patient has an active rescue in progress.
 * Used to show "Track Rescue" link in sidebar when responder is en route.
 */
import useSWR from "swr";
import api from "../services/api";

const fetcher = async (url) => {
  try {
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    // Silently handle 404 (no active rescue) and auth errors
    if (error.response?.status === 404 || error.response?.status === 401) {
      return { has_active_rescue: false, data: null };
    }
    throw error;
  }
};

/**
 * Hook to get active rescue status for current patient
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether to fetch (default: true)
 * @param {number} options.refreshInterval - Refresh interval in ms (default: 30000)
 * @returns {{
 *   hasActiveRescue: boolean,
 *   activeRescue: Object | null,
 *   incident: Object | null,
 *   responder: Object | null,
 *   responderLocation: Object | null,
 *   isLoading: boolean,
 *   error: Error | null,
 *   mutate: Function
 * }}
 */
export function useActiveRescue({
  enabled = true,
  refreshInterval = 30000,
} = {}) {
  const { data, error, isLoading, mutate } = useSWR(
    enabled ? "/rescue/active" : null,
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: true,
      dedupingInterval: 10000,
      errorRetryCount: 2,
      shouldRetryOnError: (err) => {
        // Don't retry on 401/403/404
        const status = err?.response?.status;
        return status !== 401 && status !== 403 && status !== 404;
      },
    }
  );

  return {
    hasActiveRescue: data?.has_active_rescue ?? false,
    activeRescue: data?.data ?? null,
    incident: data?.data?.incident ?? null,
    responder: data?.data?.responder ?? null,
    responderLocation: data?.data?.responder_location ?? null,
    isLoading,
    error,
    mutate,
  };
}

export default useActiveRescue;
