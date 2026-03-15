import { create } from "zustand";
import { getEchoInstance } from "../services/echo";

export const useSessionAllocationsStore = create((set, get) => ({
  sessionAllocations: [],
  requests: [], // Also store the parent requests here

  setSessionAllocations: (updater) =>
    set((state) => ({
      sessionAllocations:
        typeof updater === "function"
          ? updater(state.sessionAllocations)
          : updater,
    })),

  addAllocation: (alloc) =>
    set((state) => ({
      sessionAllocations: [...state.sessionAllocations, alloc],
    })),

  setRequests: (updater) =>
    set((state) => ({
      requests:
        typeof updater === "function" ? updater(state.requests) : updater,
    })),

  updateStatus: (id, newStatus) =>
    set((state) => ({
      // Update local requests
      requests: state.requests.map((req) =>
        req.id === id ? { ...req, status: newStatus } : req,
      ),
      // Update allocations if any belong to this request
      sessionAllocations: state.sessionAllocations.map((alloc) =>
        alloc.request_id === id ? { ...alloc, status: newStatus } : alloc,
      ),
    })),

  clearSession: () => set({ sessionAllocations: [], requests: [] }),

  // Listen to Reverb
  listenToLogistics: () => {
    const echo = getEchoInstance?.();
    if (!echo) return;

    echo.channel("logistics-updates").listen(".status.updated", (e) => {
      const { id, status, allocation } = e.data || e;
      if (id && status) {
        get().updateStatus(id, status);
      }

      // If allocation is pushed, maybe add or update it
      if (allocation) {
        set((state) => {
          const exists = state.sessionAllocations.find(
            (a) => a.id === allocation.id,
          );
          if (exists) {
            return {
              sessionAllocations: state.sessionAllocations.map((a) =>
                a.id === allocation.id ? allocation : a,
              ),
            };
          } else {
            return {
              sessionAllocations: [...state.sessionAllocations, allocation],
            };
          }
        });
      }
    });
  },
}));
