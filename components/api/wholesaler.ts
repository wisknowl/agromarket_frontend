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
  user?: {
    id: string;
    name: string;
    phone: string;
    email: string;
    avatarUrl?: string;
  };
}

export const fetchWholesaleDealsApi = async (): Promise<Yield[]> => {
  const res = await apiClient.get('/yields', {
    params: { isWholesale: true },
  });
  const data = Array.isArray(res.data) ? res.data : [];
  return data.map(normalizeYield);
};

export const fetchWholesalerProfileApi = async (): Promise<WholesalerProfileData> => {
  const res = await apiClient.get('/wholesaler/me');
  return res.data;
};

export const registerWholesalerApi = async (data: {
  businessName: string;
  tradeLicenseNumber?: string;
  primaryMarketCity: string;
  buyingCapacityTons?: number;
  preferredCommodities?: string[];
}): Promise<WholesalerProfileData> => {
  const res = await apiClient.post('/wholesaler/register', data);
  return res.data;
};
