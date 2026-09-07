import { apiClient } from './client';
import { LoanProduct, LoanApplication } from '../../types';

export interface CreditScoreResponse {
  creditScore: number;
  creditTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  rating: number;
  totalRatings: number;
  completedOrders: number;
  loanApplications: LoanApplication[];
  tierDetails: Record<string, string>;
}

export const fetchFarmerCreditScoreApi = async (): Promise<CreditScoreResponse> => {
  const res = await apiClient.get('/fintech/credit-score');
  return res.data;
};

export const fetchLoanProductsApi = async (): Promise<LoanProduct[]> => {
  const res = await apiClient.get('/fintech/products');
  return res.data;
};

export const fetchMyLoanApplicationsApi = async (): Promise<LoanApplication[]> => {
  const res = await apiClient.get('/fintech/my-loans');
  return res.data;
};

export const applyForLoanApi = async (data: {
  productId: string;
  purpose: string;
  requestedAmount: number;
  durationMonths: number;
}): Promise<{ message: string; application: LoanApplication }> => {
  const res = await apiClient.post('/fintech/apply', data);
  return res.data;
};
