import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ImageSourcePropType } from 'react-native';

export type ContainerRegionId =
  | 'CAMEROON'
  | 'EAST_AFRICA'
  | 'GLOBAL'
  | 'NIGERIA'
  | 'LATIN_AMERICA';

export interface RegionalContainer {
  id: ContainerRegionId;
  name: string;
  shortName: string;
  frenchName: string;
  regionLabel: string;
  description: string;
  image: ImageSourcePropType;
}

export const REGIONAL_CONTAINERS: Record<ContainerRegionId, RegionalContainer> = {
  CAMEROON: {
    id: 'CAMEROON',
    name: 'Bamboo Basket',
    shortName: 'Basket',
    frenchName: 'Panier Bambou',
    regionLabel: 'Cameroon & Central Africa',
    description: 'Traditional brown handwoven bamboo agricultural harvest basket',
    image: require('@/assets/images/basket_cameroon.jpg'),
  },
  EAST_AFRICA: {
    id: 'EAST_AFRICA',
    name: 'Kiondo',
    shortName: 'Kiondo',
    frenchName: 'Kiondo',
    regionLabel: 'Kenya, Tanzania & East Africa',
    description: 'Traditional sisal & banana-bark handwoven market bag/basket',
    image: require('@/assets/images/basket_east_africa.jpg'),
  },
  GLOBAL: {
    id: 'GLOBAL',
    name: 'Harvest Crate',
    shortName: 'Crate',
    frenchName: 'Caisse de récolte',
    regionLabel: 'International & Regional Hubs',
    description: 'Rustic wooden farmer produce harvest crate',
    image: require('@/assets/images/basket_crate.jpg'),
  },
  NIGERIA: {
    id: 'NIGERIA',
    name: 'Agbá Basket',
    shortName: 'Agbá',
    frenchName: 'Panier Agbá',
    regionLabel: 'Nigeria & West Africa',
    description: 'Handwoven palm-frond and cane market harvest basket',
    image: require('@/assets/images/basket_cameroon.jpg'),
  },
  LATIN_AMERICA: {
    id: 'LATIN_AMERICA',
    name: 'Canasta',
    shortName: 'Canasta',
    frenchName: 'Canasta',
    regionLabel: 'Latin America',
    description: 'Handcrafted wicker coffee and fruit harvesting canasta',
    image: require('@/assets/images/basket_cameroon.jpg'),
  },
};

interface RegionalContainerState {
  regionId: ContainerRegionId;
  setRegion: (regionId: ContainerRegionId) => void;
  getContainer: () => RegionalContainer;
}

export const useRegionalContainerStore = create<RegionalContainerState>()(
  persist(
    (set, get) => ({
      regionId: 'CAMEROON',
      setRegion: (regionId: ContainerRegionId) => {
        set({ regionId });
      },
      getContainer: () => {
        const id = get().regionId;
        return REGIONAL_CONTAINERS[id] || REGIONAL_CONTAINERS.CAMEROON;
      },
    }),
    {
      name: 'agromarket-regional-container-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
