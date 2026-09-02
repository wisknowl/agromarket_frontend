import { apiClient } from './client';
import { User, UserRole } from '../../types';

export interface LoginResponse {
  user: User;
  token: string;
}

export const loginApi = async (email: string, password: string): Promise<LoginResponse> => {
  const res = await apiClient.post('/auth/login', { email, password });
  return res.data;
};

export const registerApi = async (data: {
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: UserRole;
  farmName?: string;
  region?: string;
  city?: string;
  businessName?: string;
  primaryMarketCity?: string;
  vehicleType?: string;
  licensePlate?: string;
}): Promise<LoginResponse> => {
  const res = await apiClient.post('/auth/register', data);
  return res.data;
};

export const fetchCurrentUserApi = async (): Promise<User> => {
  const res = await apiClient.get('/auth/me');
  return res.data.user;
};
