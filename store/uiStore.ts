import { create } from 'zustand';

interface UIState {
  isCreatePostModalOpen: boolean;
  openCreatePostModal: () => void;
  closeCreatePostModal: () => void;
  activeFarmId: string | null;
  setActiveFarmId: (farmId: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isCreatePostModalOpen: false,
  openCreatePostModal: () => set({ isCreatePostModalOpen: true }),
  closeCreatePostModal: () => set({ isCreatePostModalOpen: false }),
  activeFarmId: null,
  setActiveFarmId: (farmId) => set({ activeFarmId: farmId }),
}));
