import React, { useState, useEffect, createContext, useContext } from 'react';
import apiClient from '@/components/api/client';

export interface FeatureFlags {
  agroFeedEnabled: boolean;
  directYieldsEnabled: boolean;
  basketCheckoutEnabled: boolean;
  fintechLoansEnabled: boolean;
  buyamSellamModuleEnabled: boolean;
  transporterLogisticsEnabled: boolean;
  instantEscrowAutoRelease: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  agroFeedEnabled: true,
  directYieldsEnabled: true,
  basketCheckoutEnabled: true,
  fintechLoansEnabled: true,
  buyamSellamModuleEnabled: true,
  transporterLogisticsEnabled: true,
  instantEscrowAutoRelease: false,
};

interface FeatureFlagContextType {
  flags: FeatureFlags;
  isLoading: boolean;
  isModuleActive: (moduleKey: keyof FeatureFlags) => boolean;
  refreshFlags: () => Promise<void>;
  updateFlagRemote: (flagName: keyof FeatureFlags, isEnabled: boolean) => Promise<void>;
}

const FeatureFlagContext = createContext<FeatureFlagContextType>({
  flags: DEFAULT_FLAGS,
  isLoading: false,
  isModuleActive: () => true,
  refreshFlags: async () => {},
  updateFlagRemote: async () => {},
});

export const FeatureFlagProvider = ({ children }: { children: React.ReactNode }) => {
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FLAGS);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFlags = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/admin/feature-flags');
      if (res.data) {
        setFlags((prev) => ({ ...prev, ...res.data }));
      }
    } catch {
      // Fallback to default flags if offline or backend starting up
      setFlags(DEFAULT_FLAGS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const isModuleActive = (moduleKey: keyof FeatureFlags): boolean => {
    return flags[moduleKey] ?? true;
  };

  const updateFlagRemote = async (flagName: keyof FeatureFlags, isEnabled: boolean) => {
    try {
      setFlags((prev) => ({ ...prev, [flagName]: isEnabled }));
      await apiClient.post('/admin/feature-flags', { flagName, isEnabled });
    } catch (err) {
      console.error('Failed to update remote feature flag:', err);
    }
  };

  return (
    <FeatureFlagContext.Provider
      value={{
        flags,
        isLoading,
        isModuleActive,
        refreshFlags: fetchFlags,
        updateFlagRemote,
      }}
    >
      {children}
    </FeatureFlagContext.Provider>
  );
};

export const useFeatureFlags = () => useContext(FeatureFlagContext);
