import { apiClient } from './client';
import { Yield, Category } from '../../types';
import { yields as mockYields, categories as mockCategories } from '../../mocks/data';

export const normalizeYield = (item: any): Yield => {
  if (!item) return item;
  const rawPrice = item.price ?? item.pricePerUnit ?? 0;
  const price = typeof rawPrice === 'number' ? rawPrice : Number(rawPrice) || 0;
  const image = item.image || (Array.isArray(item.mediaUrls) ? item.mediaUrls[0] : '') || '';
  return {
    ...item,
    price,
    pricePerUnit: price,
    image,
    mediaUrls: item.mediaUrls || (image ? [image] : []),
  };
};

export const fetchYieldsApi = async (params?: {
  category?: string;
  region?: string;
  search?: string;
  isWholesale?: boolean;
}): Promise<Yield[]> => {
  try {
    const res = await apiClient.get('/yields', { params });
    const data = Array.isArray(res.data) ? res.data : [];
    return data.map(normalizeYield);
  } catch (error) {
    console.warn('Backend unavailable, falling back to local Cameroonian mock yields');
    return mockYields;
  }
};

export const fetchCategoriesApi = async (): Promise<Category[]> => {
  try {
    const res = await apiClient.get('/yields/categories');
    return res.data;
  } catch (error) {
    return mockCategories;
  }
};

export const fetchYieldByIdApi = async (id: string): Promise<Yield> => {
  try {
    const res = await apiClient.get(`/yields/${id}`);
    return normalizeYield(res.data);
  } catch (error) {
    const found = mockYields.find((y) => y.id === id);
    if (!found) throw new Error('Produce not found');
    return found;
  }
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

