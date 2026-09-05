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

export const fetchFarmByIdApi = async (farmId: string): Promise<any> => {
  const res = await apiClient.get(`/farms/${farmId}`);
  return res.data;
};

export const updateFarmApi = async (farmId: string, farmData: Partial<Farm>): Promise<any> => {
  const res = await apiClient.put(`/farms/${farmId}`, farmData);
  return res.data.farm || res.data;
};

export const fetchFarmAnalyticsApi = async (farmId: string): Promise<any> => {
  const res = await apiClient.get(`/farms/${farmId}/analytics`);
  return res.data;
};

export const createProduceApi = async (produceData: any): Promise<any> => {
  const res = await apiClient.post('/yields', produceData);
  return res.data;
};

