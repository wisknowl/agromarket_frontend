import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AgroYield, Post } from '@/types';

interface FavoritesState {
  yields: string[];
  posts: string[];
  addYield: (id: string) => void;
  removeYield: (id: string) => void;
  addPost: (id: string) => void;
  removePost: (id: string) => void;
  isYieldFavorite: (id: string) => boolean;
  isPostFavorite: (id: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      yields: [],
      posts: [],
      
      addYield: (id: string) => {
        set(state => ({
          yields: [...state.yields, id]
        }));
      },
      
      removeYield: (id: string) => {
        set(state => ({
          yields: state.yields.filter(yieldId => yieldId !== id)
        }));
      },
      
      addPost: (id: string) => {
        set(state => ({
          posts: [...state.posts, id]
        }));
      },
      
      removePost: (id: string) => {
        set(state => ({
          posts: state.posts.filter(postId => postId !== id)
        }));
      },
      
      isYieldFavorite: (id: string) => {
        return get().yields.includes(id);
      },
      
      isPostFavorite: (id: string) => {
        return get().posts.includes(id);
      }
    }),
    {
      name: 'agrolink-favorites',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);