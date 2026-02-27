// src/stores/useSessionAllocationsStore.js
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const useSessionAllocationsStore = create(
  devtools((set) => ({
    allocations: [],

    addSessionAllocation: (allocation) =>
      set((state) => {
        if (!allocation?.id) {
          console.warn("Tried to add allocation without ID:", allocation);
          return state;
        }
        const exists = state.allocations.find(a => a.id === allocation.id);
        if (exists) {
          return {
            allocations: state.allocations.map(a => a.id === allocation.id ? allocation : a)
          };
        }
        return { allocations: [...state.allocations, allocation] };
      }),

    replaceSessionAllocation: (allocation) =>
      set((state) => ({
        allocations: state.allocations.map((a) =>
          a.id === allocation.id ? allocation : a
        ),
      })),

    removeSessionAllocation: (id) =>
      set((state) => ({
        allocations: state.allocations.filter((a) => a.id !== id),
      })),

    clearSessionAllocations: () =>
      set({ allocations: [] }),
  }), { name: 'session-allocations' })

  
);

export default useSessionAllocationsStore;