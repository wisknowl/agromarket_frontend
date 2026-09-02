import { apiClient } from './client';
import { LoanProduct, LoanApplication } from '../../types';

export interface CreditScoreResponse {
  creditScore: number;
  creditTier: string;
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
  const res = await apiClient.get('/fintech/loans/products');
  return res.data;
};

export const applyForLoanApi = async (data: {
  productId: string;
  purpose: string;
  requestedAmount: number;
  durationMonths: number;
}): Promise<LoanApplication> => {
  const res = await apiClient.post('/fintech/loans/apply', data);
  return res.data;
};
