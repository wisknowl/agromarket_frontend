import { apiClient } from './client';
import { LoanProduct, LoanApplication } from '../../types';

export interface CreditScoreResponse {
  creditScore: number;
  creditTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  rating: number;
  totalRatings: number;
  completedOrders?: number;
  loanApplications: LoanApplication[];
  tierDetails: Record<string, string>;
  // Engine 1 (Victory Eyong Tabi Model) algorithmic contracts
  ficoScore?: number;
  aggregateScore?: number;
  tier?: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  route?: 'ROUTE_A_PENDING' | 'ROUTE_B_APPROVED';
  maxLoanLimitUsd?: number;
  maxLoanLimitXaf?: number;
  autoEscrowDeductionRate?: number;
  isColdStart?: boolean;
  normalizedRadar?: {
    salesFulfillment: number;
    listingFrequency: number;
    reviewBayesian: number;
    deliveryReliability: number;
    networkReach: number;
    engagementVelocity: number;
    repaymentIntegrity: number;
    kycCompliance: number;
  };
  rawMetrics?: {
    salesFulfillment: number;
    listingFrequency: number;
    reviewBayesian: number;
    deliveryReliability: number;
    networkReach: number;
    engagementVelocity: number;
    repaymentIntegrity: number;
    kycCompliance: number;
  };
  weightsApplied?: Record<string, number>;
  roadmapToNextTier?: {
    nextTier: string;
    pointsNeeded: number;
    recommendations: Array<{
      metricKey: string;
      metricLabel: string;
      currentScore: number;
      targetScore: number;
      advice: string;
    }>;
  };
  educationalFeedback?: string[];
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
