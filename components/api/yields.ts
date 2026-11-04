import { apiClient } from './client';
import { Yield, Category } from '../../types';
import { resolveMediaUrl } from '@/utils/media';

export const normalizeYield = (item: any): Yield => {
  if (!item) return item;
  const rawPrice = item.price ?? item.pricePerUnit ?? 0;
  const price = typeof rawPrice === 'number' ? rawPrice : Number(rawPrice) || 0;
  const rawImage = item.image || (Array.isArray(item.mediaUrls) ? item.mediaUrls[0] : '') || '';
  const resolvedImage = resolveMediaUrl(rawImage) || rawImage;
  const rawMediaUrls: string[] = Array.isArray(item.mediaUrls) && item.mediaUrls.length > 0
    ? item.mediaUrls
    : (resolvedImage ? [resolvedImage] : []);
  const resolvedMediaUrls = rawMediaUrls.map((u) => resolveMediaUrl(u) || u);

  return {
    ...item,
    price,
    pricePerUnit: price,
    image: resolvedImage,
    mediaUrls: resolvedMediaUrls,
  };
};

export const fetchYieldsApi = async (params?: {
  category?: string;
  region?: string;
  search?: string;
  isWholesale?: boolean;
  farmId?: string;
  storeId?: string;
}): Promise<Yield[]> => {
  try {
    const res = await apiClient.get('/yields', { params });
    const data = Array.isArray(res.data) ? res.data : [];
    return data.map(normalizeYield);
  } catch (error) {
    console.error('Failed to fetch yields from backend:', error);
    return [];
  }
};

export const fetchCategoriesApi = async (): Promise<Category[]> => {
  try {
    const res = await apiClient.get('/yields/categories');
    return res.data;
  } catch (error) {
    console.error('Failed to fetch categories from backend:', error);
    return [];
  }
};

export const fetchYieldByIdApi = async (id: string): Promise<Yield> => {
  const res = await apiClient.get(`/yields/${id}`);
  return normalizeYield(res.data);
};

export const createYieldApi = async (data: any): Promise<Yield> => {
  const res = await apiClient.post('/yields', data);
  return normalizeYield(res.data);
};


export const fetchFarmYieldsApi = async (farmId: string): Promise<Yield[]> => {
  try {
    const res = await apiClient.get('/yields', { params: { farmId } });
    const data = Array.isArray(res.data) ? res.data : [];
    return data.map(normalizeYield);
  } catch (error) {
    return [];
  }
};

export const updateYieldApi = async (id: string, updates: any): Promise<Yield> => {
  const res = await apiClient.put(`/yields/${id}`, updates);
  return normalizeYield(res.data.yield || res.data);
};

export const patchYieldStockApi = async (
  id: string,
  params: { delta?: number; stockQuantity?: number; isAvailable?: boolean }
): Promise<Yield> => {
  const res = await apiClient.patch(`/yields/${id}/stock`, params);
  return normalizeYield(res.data.yield || res.data);
};


