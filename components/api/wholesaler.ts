import { apiClient } from './client';
import { Yield } from '../../types';
import { normalizeYield } from './yields';

export interface WholesalerProfileData {
  id: string;
  userId: string;
  businessName: string;
  tradeLicenseNumber?: string;
  primaryMarketCity: string;
  buyingCapacityTons: number;
  preferredCommodities: string[];
  linkedFarmId?: string;
  sites?: any[];
  user?: {
    id: string;
    name: string;
    phone: string;
    email: string;
    avatarUrl?: string;
  };
}

export const fetchWholesaleDealsApi = async (params?: { storeId?: string }): Promise<Yield[]> => {
  const res = await apiClient.get('/yields', {
    params: { isWholesale: true, ...params },
  });
  const data = Array.isArray(res.data) ? res.data : [];
  return data.map(normalizeYield);
};

export const fetchWholesalerProfileApi = async (): Promise<WholesalerProfileData> => {
  const res = await apiClient.get('/wholesaler/me');
  return res.data;
};

export const fetchMyStoresApi = async (): Promise<any[]> => {
  try {
    const res = await apiClient.get('/wholesaler/my-stores');
    return Array.isArray(res.data) ? res.data : [];
  } catch {
    return [];
  }
};

export const checkStoreSlugApi = async (
  name: string,
  excludeId?: string
): Promise<{ slug: string; available: boolean; candidate: string }> => {
  const res = await apiClient.get('/wholesaler/check-slug', { params: { name, excludeId } });
  return res.data;
};

export const createStoreApi = async (data: any): Promise<any> => {
  const res = await apiClient.post('/wholesaler', data);
  return res.data?.store || res.data;
};

export const fetchStoreByIdApi = async (id: string): Promise<any> => {
  const res = await apiClient.get(`/wholesaler/${id}`);
  return res.data;
};

export const updateStoreApi = async (id: string, data: any): Promise<any> => {
  const res = await apiClient.put(`/wholesaler/${id}`, data);
  return res.data?.store || res.data;
};

export const registerWholesalerApi = async (data: {
  businessName: string;
  tradeLicenseNumber?: string;
  primaryMarketCity: string;
  buyingCapacityTons?: number;
  preferredCommodities?: string[];
  linkedFarmId?: string;
}): Promise<WholesalerProfileData> => {
  const res = await apiClient.post('/wholesaler/register', data);
  return res.data;
};
