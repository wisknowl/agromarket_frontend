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

export interface AgroVestorCampaign {
  id: string;
  farmerId: string;
  farmerName?: string;
  farmName?: string;
  avatarUrl?: string;
  region?: string;
  cropType: string;
  title: string;
  description: string;
  targetAmount: number;
  fundedAmount: number;
  minPledge: number;
  expectedRoiPercent: number;
  durationMonths: number;
  creditScore: number;
  creditTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  riskLevel?: 'LOW' | 'MODERATE' | 'ELEVATED';
  radar?: {
    salesFulfillment: number;
    listingFrequency: number;
    reviewBayesian: number;
    deliveryReliability: number;
    networkReach: number;
    engagementVelocity: number;
    repaymentIntegrity: number;
    kycCompliance: number;
  };
  backersCount: number;
  escrowSecured?: boolean;
  status?: 'ACTIVE' | 'FUNDED' | 'IN_PRODUCTION' | 'SETTLED' | string;
  createdAt?: string;
  farmer?: {
    id?: string;
    name?: string;
    avatarUrl?: string;
  };
  farm?: {
    id?: string;
    name?: string;
    location?: string;
  };
}

export interface AgroVestorInvestment {
  id: string;
  userId: string;
  userName?: string;
  campaignId: string;
  campaignTitle?: string;
  farmerName?: string;
  farmName?: string;
  amount?: number;
  amountInvested?: number;
  projectedReturnAmount: number;
  expectedRoiPercent?: number;
  durationMonths?: number;
  paymentMethod: string;
  status: 'ESCROW_HELD' | 'PRODUCING' | 'REPAID' | 'PLEDGED' | 'ESCROW_LOCKED' | 'DISBURSED_TO_FARMER' | 'HARVEST_IN_PROGRESS' | 'CANCELLED' | string;
  investedAt?: string;
  createdAt?: string;
  payoutDueDate?: string;
  campaign?: {
    id?: string;
    title?: string;
    farm?: {
      name?: string;
    };
  };
}

export const fetchAgroVestorCampaignsApi = async (): Promise<AgroVestorCampaign[]> => {
  const res = await apiClient.get('/fintech/campaigns');
  return res.data;
};

export const createAgroVestorCampaignApi = async (data: {
  title: string;
  description: string;
  cropType: string;
  targetAmount: number;
  minPledge?: number;
  expectedRoiPercent: number;
  durationMonths: number;
}): Promise<AgroVestorCampaign> => {
  const res = await apiClient.post('/fintech/campaigns', data);
  return res.data.campaign || res.data;
};

export const pledgeAgroVestorInvestmentApi = async (data: {
  campaignId: string;
  amount: number;
  paymentMethod?: string;
  paymentProvider?: string;
  currency?: string;
}): Promise<{ message: string; investment: AgroVestorInvestment }> => {
  const res = await apiClient.post('/fintech/invest', data);
  return res.data;
};

export const fetchMyAgroVestmentsApi = async (): Promise<AgroVestorInvestment[]> => {
  const res = await apiClient.get('/fintech/my-investments');
  return res.data;
};

export interface AgroPatronSubscription {
  id: string;
  userId: string;
  userName: string;
  farmerId: string;
  farmerName: string;
  farmName: string;
  plan: 'MONTHLY' | 'SEASONAL';
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentProvider?: string;
  discountRatePercent: number;
  hasEarlyHarvestAccess: boolean;
  hasPrivateStoryAccess: boolean;
  subscribedAt: string;
  expiresAt: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
}

export const patronizeFarmApi = async (data: {
  farmerId: string;
  plan?: 'MONTHLY' | 'SEASONAL';
  paymentMethod?: string;
  paymentProvider?: string;
  currency?: string;
  phoneNumber?: string;
  amount?: number;
}): Promise<{ message: string; subscription: AgroPatronSubscription }> => {
  const res = await apiClient.post('/fintech/patronize', data);
  return res.data;
};

export const fetchFarmPatronStatusApi = async (farmerId: string): Promise<{
  isPatron: boolean;
  subscription?: AgroPatronSubscription;
  discountRatePercent: number;
  hasEarlyHarvestAccess: boolean;
}> => {
  const res = await apiClient.get(`/fintech/patron-status/${farmerId}`);
  return res.data;
};

export const fetchMyPatronagesApi = async (): Promise<AgroPatronSubscription[]> => {
  const res = await apiClient.get('/fintech/my-patronages');
  return res.data;
};
