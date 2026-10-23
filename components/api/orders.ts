import { apiClient } from './client';
import { Order, PaymentMethod } from '../../types';

export interface CheckoutResponse {
  message: string;
  order: Order;
  campayPrompt?: {
    reference: string;
    ussd_code?: string;
    operator?: string;
  };
}

export const checkoutOrderApi = async (data: {
  items: Array<{ yieldId: string; quantity: number }>;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryPhone: string;
  deliveryNotes?: string;
  paymentMethod: PaymentMethod;
  currency?: string;
}): Promise<CheckoutResponse> => {
  const res = await apiClient.post('/orders/checkout', data);
  return res.data;
};

export const checkOrderPaymentStatusApi = async (
  orderId: string
): Promise<{ status: string; isLocked: boolean; campay?: any }> => {
  const res = await apiClient.get(`/orders/${orderId}/payment-status`);
  return res.data;
};

export const fetchMyOrdersApi = async (): Promise<Order[]> => {
  const res = await apiClient.get('/orders/my-orders');
  return res.data;
};

export const fetchOrderByIdApi = async (orderId: string): Promise<Order> => {
  const res = await apiClient.get(`/orders/${orderId}`);
  return res.data;
};

export const confirmReceiptApi = async (orderId: string): Promise<{ success: boolean; message: string }> => {
  const res = await apiClient.post(`/orders/${orderId}/confirm-receipt`);
  return res.data;
};
