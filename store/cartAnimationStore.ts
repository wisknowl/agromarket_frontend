import { create } from 'zustand';

export interface FlyEvent {
  id: string;
  startX: number;
  startY: number;
  imageUri?: string;
  timestamp: number;
}

interface CartAnimationState {
  activeFly: FlyEvent | null;
  basketCoords: { x: number; y: number } | null;
  basketBounceTimestamp: number;
  triggerFly: (startX: number, startY: number, imageUri?: string) => void;
  clearFly: () => void;
  setBasketCoords: (coords: { x: number; y: number }) => void;
  triggerBasketBounce: () => void;
}

export const useCartAnimationStore = create<CartAnimationState>((set) => ({
  activeFly: null,
  basketCoords: null,
  basketBounceTimestamp: 0,
  triggerFly: (startX: number, startY: number, imageUri?: string) => {
    set({
      activeFly: {
        id: `fly-${Date.now()}-${Math.random()}`,
        startX,
        startY,
        imageUri,
        timestamp: Date.now(),
      },
    });
  },
  clearFly: () => set({ activeFly: null }),
  setBasketCoords: (coords: { x: number; y: number }) => set({ basketCoords: coords }),
  triggerBasketBounce: () => set({ basketBounceTimestamp: Date.now() }),
}));
