// src/stores/sessionAllocationsStore.js
import { create } from 'zustand'

export const useSessionAllocationsStore = create((set) => ({
  sessionAllocations: [],
  setSessionAllocations: (updater) => set((state) => ({
    sessionAllocations: typeof updater === 'function' ? updater(state.sessionAllocations) : updater
  })),
  addAllocation: (alloc) => set((state) => ({
    sessionAllocations: [...state.sessionAllocations, alloc]
  })),
  clearSession: () => set({ sessionAllocations: [] })
}))
