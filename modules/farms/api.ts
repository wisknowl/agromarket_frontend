import apiClient from '@/components/api/client';
import { Farm } from '@/types';

export const fetchMyFarmsApi = async (): Promise<Farm[]> => {
  try {
    const res = await apiClient.get('/farms/my-farms');
    return res.data;
  } catch (error) {
    console.warn('API fetchMyFarms failed, using local store data', error);
    throw error;
  }
};

export const createFarmApi = async (farmData: Partial<Farm>): Promise<Farm> => {
  const res = await apiClient.post('/farms', farmData);
  return res.data.farm || res.data;
};

export const fetchFarmByIdApi = async (farmId: string, includeAll: boolean = true): Promise<any> => {
  const url = includeAll ? `/farms/${farmId}?includeAllYields=true` : `/farms/${farmId}`;
  const res = await apiClient.get(url);
  return res.data;
};

export const updateFarmApi = async (farmId: string, farmData: Partial<Farm>): Promise<any> => {
  const res = await apiClient.put(`/farms/${farmId}`, farmData);
  return res.data.farm || res.data;
};

export const deleteFarmApi = async (
  farmId: string,
  targetFarmId?: string
): Promise<{ success: boolean; message: string; id: string; migratedTo?: string }> => {
  const res = await apiClient.delete(`/farms/${farmId}`, {
    data: targetFarmId ? { targetFarmId } : undefined,
  });
  return res.data;
};


export const fetchFarmAnalyticsApi = async (farmId: string): Promise<any> => {
  const res = await apiClient.get(`/farms/${farmId}/analytics`);
  return res.data;
};

export const createProduceApi = async (produceData: any): Promise<any> => {
  const res = await apiClient.post('/yields', produceData);
  return res.data;
};

export const updateProduceApi = async (yieldId: string, updates: any): Promise<any> => {
  const res = await apiClient.put(`/yields/${yieldId}`, updates);
  return res.data;
};

export const deleteProduceApi = async (yieldId: string): Promise<any> => {
  const res = await apiClient.delete(`/yields/${yieldId}`);
  return res.data;
};

export const patchProduceStockApi = async (
  yieldId: string,
  data: { delta?: number; stockQuantity?: number; isAvailable?: boolean }
): Promise<any> => {
  const res = await apiClient.patch(`/yields/${yieldId}/stock`, data);
  return res.data;
};

export const fetchPartnerStatusApi = async (targetUserId: string): Promise<{ isPartner: boolean; isMutual: boolean; wholesaleDiscountPercent: number }> => {
  try {
    const res = await apiClient.get(`/farms/partner-status/${targetUserId}`);
    return res.data;
  } catch {
    return { isPartner: false, isMutual: false, wholesaleDiscountPercent: 0 };
  }
};

export const requestPartnerApi = async (targetUserId: string): Promise<{ success: boolean; isMutual: boolean }> => {
  const res = await apiClient.post(`/farms/partner-request/${targetUserId}`);
  return res.data;
};

export const fetchAgroPartnersApi = async (): Promise<any[]> => {
  const res = await apiClient.get('/farms/partners');
  return res.data.partners || [];
};


