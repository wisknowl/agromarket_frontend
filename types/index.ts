export type UserRole =
  | 'BUYER'
  | 'WHOLESALER'
  | 'FARMER'
  | 'AGRO_TRANSPORTER'
  | 'FINANCIAL_OFFICER'
  | 'ADMIN';

export type CreditTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export type ProduceUnit =
  | 'KG'
  | 'CRATE'
  | 'BAG_50KG'
  | 'BAG_100KG'
  | 'BUCKET'
  | 'BUNCH'
  | 'NET';

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'ESCROW_LOCKED'
  | 'CONFIRMED_BY_FARMER'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'CANCELLED';

export type PaymentMethod =
  | 'MTN_MOMO'
  | 'ORANGE_MONEY'
  | 'CASH_ON_DELIVERY'
  | 'BANK_TRANSFER';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  avatar?: string;
  password?: string;
  role: UserRole;
  isFarmer?: boolean;
  isAdmin?: boolean;
  isVerified?: boolean;
  farms?: any[];
  creditScore?: number | string;
  farmerProfile?: FarmerProfile;
  wholesalerProfile?: WholesalerProfile;
  transporterProfile?: TransporterProfile;
  financialProfile?: FinancialProfile;
}

export interface FarmerProfile {
  id: string;
  userId: string;
  farmName: string;
  region: string;
  division?: string;
  city: string;
  bio?: string;
  coverPhoto?: string;
  cooperativeName?: string;
  rating: number;
  totalRatings: number;
  totalFollowers: number;
  farmSizeHectares?: number;
  primaryCrops?: string[];
  creditTier: CreditTier;
  creditScore: number;
}

export interface WholesalerProfile {
  id: string;
  userId: string;
  businessName: string;
  tradeLicenseNumber?: string;
  primaryMarketCity: string;
  buyingCapacityTons?: number;
  preferredCommodities?: string[];
}

export interface TransporterProfile {
  id: string;
  userId: string;
  vehicleType: string;
  licensePlate: string;
  maxLoadKg: number;
  operatingCorridors?: string[];
  isAvailable: boolean;
}

export interface FinancialProfile {
  id: string;
  userId: string;
  institutionName: string;
  institutionType: string;
  licenseNumber: string;
  totalDisbursed: number;
  activeLoanCount: number;
}

export interface Farmer {
  id: string;
  userId: string;
  farmName: string;
  location: string;
  description: string;
  profilePhoto: string;
  coverPhoto?: string;
  followers: number;
  rating: number;
  creditScore?: number;
  creditTier?: CreditTier;
}

export interface Category {
  id: string;
  name: string;
  frenchName?: string;
  icon?: string;
  imageUrl?: string;
  description?: string;
}

export interface Yield {
  id: string;
  farmerId: string;
  categoryId?: string;
  title: string;
  frenchTitle?: string;
  description: string;
  originRegion?: string;
  pricePerUnit?: number;
  price: number;
  oldPrice?: number;
  unit: ProduceUnit | string;
  stockQuantity?: number;
  minOrderQuantity?: number;
  isWholesaleBulkAvailable?: boolean;
  bulkMinQuantity?: number;
  bulkPricePerUnit?: number;
  isOrganic?: boolean;
  available?: boolean;
  harvestDate?: string;
  mediaUrls?: string[];
  image: string;
  images?: string[];
  rating?: number;
  farmer?: FarmerProfile | Farmer | any;
  category?: Category | string;
  createdAt?: string;
}

export type AgroYield = Yield;

export interface Post {
  id: string;
  farmerId: string;
  content: string;
  mediaUrl?: string;
  media: string;
  isVideo: boolean;
  linkedYieldId?: string;
  likesCount?: number;
  likes: number;
  commentsCount?: number;
  comments: any;
  farmerName?: string;
  farmerAvatar?: string;
  farmer?: any;
  createdAt: string;
}

export interface CartItem {
  id: string;
  yieldId: string;
  quantity: number;
  yield: Yield;
  product?: Yield;
}

export interface Order {
  id: string;
  orderNumber?: string;
  buyerId: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryPhone: string;
  isEscrowReleased: boolean;
  items: any[];
  createdAt: string;
}

export interface LoanProduct {
  id: string;
  title: string;
  frenchTitle?: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  interestRatePercent: number;
  durationMonths: number;
  requiredCreditTier: CreditTier;
}

export interface LoanApplication {
  id: string;
  farmerId: string;
  productId: string;
  purpose: string;
  requestedAmount: number;
  approvedAmount?: number;
  interestRate: number;
  durationMonths: number;
  status: string;
  repaymentDeductionPct: number;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participantId?: string;
  participantName?: string;
  participantAvatar?: string;
  farmerId?: string;
  farmerName?: string;
  farmerAvatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  timestamp?: string;
  unreadCount?: number;
  messages?: Message[];
}