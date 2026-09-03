import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem, AgroYield } from '@/types';

interface CartState {
  items: CartItem[];
  addToCart: (yieldItem: AgroYield, quantity: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getTotalPrice: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addToCart: (yieldItem: AgroYield, quantity: number) => {
        const items = get().items;
        const existingItem = items.find((item) => item.yieldId === yieldItem.id);

        if (existingItem) {
          set({
            items: items.map((item) =>
              item.id === existingItem.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          });
        } else {
          set({
            items: [
              ...items,
              {
                id: Date.now().toString(),
                yieldId: yieldItem.id,
                quantity,
                yield: yieldItem,
              },
            ],
          });
        }
      },

      removeFromCart: (id: string) => {
        set({
          items: get().items.filter((item) => item.id !== id),
        });
      },

      updateQuantity: (id: string, quantity: number) => {
        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotal: () => {
        return get().items.reduce((total, item) => {
          const price = item.yield?.price || item.yield?.pricePerUnit || 0;
          return total + price * item.quantity;
        }, 0);
      },

      getTotalPrice: () => {
        return get().getTotal();
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'agromarket-cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);