import { apiClient } from './client';
import { NotificationItem, AgroPartner } from '../../types';

export const fetchNotificationsApi = async (
  category?: string
): Promise<NotificationItem[]> => {
  try {
    const res = await apiClient.get('/notifications', {
      params: category ? { category } : undefined,
    });
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.warn(`[NOTIFICATIONS] Could not fetch notifications (category: ${category}):`, error);
    return [];
  }
};

export const markNotificationReadApi = async (id: string): Promise<boolean> => {
  try {
    const res = await apiClient.patch(`/notifications/${id}/read`);
    return res.data?.success ?? true;
  } catch (error) {
    return false;
  }
};

export const markAllNotificationsReadApi = async (): Promise<boolean> => {
  try {
    const res = await apiClient.post('/notifications/read-all');
    return res.data?.success ?? true;
  } catch (error) {
    return false;
  }
};

export const fetchAgroPartnersApi = async (): Promise<AgroPartner[]> => {
  try {
    const res = await apiClient.get('/farms/partners');
    const data = Array.isArray(res.data) ? res.data : [];
    return data.map((p: any) => ({
      id: p.id || p.userId,
      userId: p.userId || p.id,
      name: p.user?.name || p.name || 'AgroPartner',
      farmName: p.farmName || p.farm?.name || undefined,
      avatarUrl:
        p.user?.avatarUrl ||
        p.avatarUrl ||
        'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=500&auto=format&fit=crop&q=60',
      role: p.user?.role || p.role || 'FARMER',
      region: p.region || p.farm?.region || 'Cameroon',
      isVerified: Boolean(p.isVerified || p.user?.isVerified),
      isMutualPartner: true,
      hasNewStory: Boolean(p.hasNewStory),
      connectedSince: p.connectedSince || '2026',
    }));
  } catch (error) {
    console.warn('[PARTNERS] Could not fetch mutual partners:', error);
    return [];
  }
};
