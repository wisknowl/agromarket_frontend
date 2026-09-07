import { apiClient } from './client';

export interface AdminStats {
  users: number;
  farmers: number;
  verifiedFarmers: number;
  orders: number;
  yields: number;
  farms: number;
  disputes: number;
  gmv: number;
  loans: number;
  featureFlags: Record<string, boolean>;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'BUYER' | 'FARMER' | 'WHOLESALER' | 'AGRO_TRANSPORTER' | 'FINANCIAL_OFFICER' | 'ADMIN';
  isVerified: boolean;
  avatarUrl?: string;
  createdAt: string;
  farmerProfile?: {
    id: string;
    creditTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
    isIdentityVerified: boolean;
  };
  farms?: Array<{ id: string; name: string; region: string; isVerified: boolean }>;
  _count?: {
    farms: number;
    ordersBuyer: number;
    posts: number;
  };
}

export interface AdminFarm {
  id: string;
  name: string;
  category: string;
  region: string;
  city: string;
  isVerified: boolean;
  coverPhoto?: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatarUrl?: string;
    isVerified: boolean;
  };
  yields: Array<{ id: string; title: string; price: number; unit: string; status: string }>;
  _count: {
    yields: number;
    posts: number;
  };
}

export interface AdminLoan {
  id: string;
  amountRequested: number;
  currency: string;
  purpose: string;
  durationMonths: number;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'DISBURSED' | 'REPAID' | 'REJECTED' | 'DEFAULTED';
  createdAt: string;
  farmer: {
    id: string;
    creditTier: string;
    user: {
      id: string;
      name: string;
      phone: string;
      email: string;
      avatarUrl?: string;
    };
  };
  institution?: {
    name: string;
    type: string;
  };
}

export interface DisputedOrder {
  id: string;
  orderNumber?: string;
  status: string;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
  buyer: {
    id: string;
    name: string;
    phone: string;
    email: string;
    avatarUrl?: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    yield: { id: string; title: string; image?: string };
    farmer?: { user: { name: string; phone: string } };
  }>;
  escrow?: {
    id: string;
    isDisputed: boolean;
    disputeReason?: string;
    amount: number;
  };
}

export const fetchAdminStatsApi = async (): Promise<AdminStats> => {
  const res = await apiClient.get('/admin/stats');
  return res.data;
};

export const fetchAdminUsersApi = async (params?: { role?: string; search?: string }): Promise<AdminUser[]> => {
  const res = await apiClient.get('/admin/users', { params });
  return res.data;
};

export const updateUserByAdminApi = async (
  userId: string,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
    avatarUrl?: string;
    isVerified?: boolean;
    password?: string;
    creditTier?: string;
  }
): Promise<any> => {
  const res = await apiClient.put(`/admin/users/${userId}`, data);
  return res.data;
};

export const toggleUserVerificationApi = async (userId: string, isVerified?: boolean): Promise<any> => {
  const res = await apiClient.patch(`/admin/users/${userId}/verify`, { isVerified });
  return res.data;
};

export const updateFarmerTierApi = async (farmerId: string, tier: string): Promise<any> => {
  const res = await apiClient.patch(`/admin/farmers/${farmerId}/tier`, { tier });
  return res.data;
};

export const fetchAdminFarmsApi = async (): Promise<AdminFarm[]> => {
  const res = await apiClient.get('/admin/farms');
  return res.data;
};

export const toggleFarmVerificationApi = async (farmId: string, isVerified?: boolean): Promise<any> => {
  const res = await apiClient.patch(`/admin/farms/${farmId}/verify`, { isVerified });
  return res.data;
};

export interface AdminFinancialInstitution {
  id: string;
  institutionName: string;
  institutionType: string;
  licenseNumber: string;
  headquartersCity: string;
  totalDisbursed: number;
  activeLoanCount: number;
  user?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatarUrl?: string;
  };
  loanProducts?: Array<{
    id: string;
    title: string;
    description: string;
    minAmount: number;
    maxAmount: number;
    interestRatePercent: number;
    durationMonths: number;
    requiredCreditTier: string;
  }>;
}

export const fetchAdminLoansApi = async (): Promise<AdminLoan[]> => {
  const res = await apiClient.get('/admin/loans');
  return res.data;
};

export const fetchAdminFinancialInstitutionsApi = async (): Promise<AdminFinancialInstitution[]> => {
  const res = await apiClient.get('/admin/financial-institutions');
  return res.data;
};

export const updateLoanStatusApi = async (loanId: string, status: string): Promise<any> => {
  const res = await apiClient.patch(`/admin/loans/${loanId}/status`, { status });
  return res.data;
};

export const fetchDisputesApi = async (): Promise<DisputedOrder[]> => {
  const res = await apiClient.get('/admin/disputes');
  return res.data;
};

export const resolveDisputeApi = async (
  orderId: string,
  resolution: 'RELEASE_TO_FARMER' | 'REFUND_BUYER' | 'SPLIT',
  reason?: string
): Promise<any> => {
  const res = await apiClient.post(`/admin/disputes/${orderId}/resolve`, { resolution, reason });
  return res.data;
};

export const fetchFeatureFlagsApi = async (): Promise<Record<string, boolean>> => {
  const res = await apiClient.get('/admin/feature-flags');
  return res.data;
};

export const updateFeatureFlagApi = async (flagName: string, isEnabled: boolean): Promise<any> => {
  const res = await apiClient.post('/admin/feature-flags', { flagName, isEnabled });
  return res.data;
};
