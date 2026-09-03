import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  selectedRole: UserRole;
  setSelectedRole: (role: UserRole) => void;
  login: (user: User, token?: string) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  loginAsGuest: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isGuest: false,
      selectedRole: 'BUYER',

      setSelectedRole: (role: UserRole) => {
        set({ selectedRole: role });
      },

      login: (user: User, token?: string) => {
        if (token) {
          AsyncStorage.setItem('auth_token', token).catch(console.error);
        }
        set({
          user: {
            ...user,
            isFarmer: user.role === 'FARMER',
            isAdmin: user.role === 'ADMIN',
          },
          token: token || null,
          isAuthenticated: true,
          isGuest: false,
          selectedRole: user.role,
        });
      },

      logout: () => {
        AsyncStorage.removeItem('auth_token').catch(console.error);
        set({ user: null, token: null, isAuthenticated: false, isGuest: false });
      },

      updateUser: (userData: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }));
      },

      loginAsGuest: () => {
        set({ user: null, token: null, isAuthenticated: false, isGuest: true });
      },
    }),
    {
      name: 'agromarket-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);