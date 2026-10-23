import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRegionalContainerStore, ContainerRegionId } from '@/store/regionalContainerStore';
import { PaymentMethod } from '@/types';

export type AppLanguage = 'en' | 'fr' | 'sw' | 'ha' | 'pt' | 'es' | 'ja';

export type TradeBlocId =
  | 'CEMAC'
  | 'ECOWAS_FR'
  | 'ECOWAS_EN'
  | 'EAC'
  | 'SADC'
  | 'COMESA'
  | 'GLOBAL';

export type MarketRegion = string;

export interface TradeMemberCountry {
  code: MarketRegion;
  name: string;
  flag: string;
  dialCode: string;
  majorCity: string;
  commodities: string[];
}

export interface LocalPaymentMethod {
  id: PaymentMethod;
  name: string;
  sub: string;
  badge: string;
  tagColor: string;
  tagBg: string;
  providerRail: 'campay_momo' | 'campay_orange' | 'paystack' | 'wave' | 'mpesa' | 'stripe' | 'cash';
}

export interface TradeBlocConfig {
  id: TradeBlocId;
  name: string;
  shortName: string;
  flag: string;
  primaryCurrency: string;
  currencySymbol: string;
  rateFromXaf: number; // Ledger multiplier against base XAF
  centralBank: string;
  regulatoryEscrowAuthority: string;
  majorCorridors: string[];
  memberCountries: TradeMemberCountry[];
  defaultCountry: TradeMemberCountry;
  containerId: ContainerRegionId;
  methods: LocalPaymentMethod[];
  supportedLanguages: AppLanguage[];
}

export interface MarketRegionConfig {
  code: MarketRegion;
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  rateFromXaf: number;
  containerId: ContainerRegionId;
  methods: LocalPaymentMethod[];
  blocId: TradeBlocId;
}

export interface CulturalGlossary {
  wholesalerLabel: string;
  bulkUnitLabel: string;
  coopCreditLabel: string;
  escrowBadgeText: string;
  makeOfferButtonText: string;
  freshReactionText: string;
  highDemandReactionText: string;
  readyToShipReactionText: string;
  partnerUpReactionText: string;
}

export const SUPPORTED_LANGUAGES: Array<{ code: AppLanguage; name: string; nativeName: string; flag: string }> = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪' },
  { code: 'ha', name: 'Hausa', nativeName: 'Harshen Hausa', flag: '🇳🇬' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
];

export const TRADE_BLOCS: Record<TradeBlocId, TradeBlocConfig> = {
  CEMAC: {
    id: 'CEMAC',
    name: 'CEMAC (Central African Economic Community)',
    shortName: 'CEMAC',
    flag: '🇨🇲',
    primaryCurrency: 'XAF',
    currencySymbol: 'FCFA',
    rateFromXaf: 1.0,
    centralBank: "BEAC (Banque des États de l'Afrique Centrale)",
    regulatoryEscrowAuthority: 'BEAC Escrow Clearing Layer (Campay Rail)',
    majorCorridors: ["Douala – N'Djamena Corridor", 'Kribi – Bangui Freight Link', 'Yaoundé – Libreville Highway'],
    containerId: 'CAMEROON',
    memberCountries: [
      { code: 'CM', name: 'Cameroon', flag: '🇨🇲', dialCode: '+237', majorCity: 'Douala', commodities: ['Cocoa', 'Plantains', 'Coffee', 'Cassava', 'Tomatoes'] },
      { code: 'GA', name: 'Gabon', flag: '🇬🇦', dialCode: '+241', majorCity: 'Libreville', commodities: ['Timber', 'Cassava', 'Plantains'] },
      { code: 'TD', name: 'Chad', flag: '🇹🇩', dialCode: '+235', majorCity: "N'Djamena", commodities: ['Sesame', 'Gum Arabic', 'Groundnuts', 'Livestock'] },
      { code: 'CG', name: 'Congo', flag: '🇨🇬', dialCode: '+242', majorCity: 'Brazzaville', commodities: ['Cassava', 'Palm Oil', 'Timber'] },
    ],
    defaultCountry: { code: 'CM', name: 'Cameroon', flag: '🇨🇲', dialCode: '+237', majorCity: 'Douala', commodities: ['Cocoa', 'Plantains', 'Coffee', 'Cassava', 'Tomatoes'] },
    methods: [
      {
        id: 'MTN_MOMO',
        name: 'MTN Mobile Money (Campay)',
        sub: 'Instant MoMo Escrow (*126# USSD Prompt)',
        badge: 'Campay Rail',
        tagColor: '#B45309',
        tagBg: '#FEF3C7',
        providerRail: 'campay_momo',
      },
      {
        id: 'ORANGE_MONEY',
        name: 'Orange Money (Campay)',
        sub: 'Orange Money Escrow (#150# Secure PIN)',
        badge: 'Campay Rail',
        tagColor: '#C2410C',
        tagBg: '#FFEDD5',
        providerRail: 'campay_orange',
      },
      {
        id: 'CASH_ON_DELIVERY',
        name: 'Cash on Harvest Delivery',
        sub: 'Direct payment to transporter upon crate inspection',
        badge: 'Inspection First',
        tagColor: '#173A20',
        tagBg: '#E8F5E9',
        providerRail: 'cash',
      },
    ],
    supportedLanguages: ['fr', 'en'],
  },
  ECOWAS_FR: {
    id: 'ECOWAS_FR',
    name: 'ECOWAS Francophone (UEMOA Zone)',
    shortName: 'UEMOA',
    flag: '🇨🇮',
    primaryCurrency: 'XOF',
    currencySymbol: 'CFA',
    rateFromXaf: 1.0, // Fixed 1:1 treasury peg between Central & West African CFA
    centralBank: "BCEAO (Banque Centrale des États de l'Afrique de l'Ouest)",
    regulatoryEscrowAuthority: 'BCEAO Inter-bank Settlement',
    majorCorridors: ['Abidjan – Ouagadougou Corridor', 'Dakar – Bamako Agricultural Axis', 'Cotonou – Niamey Corridor'],
    containerId: 'NIGERIA',
    memberCountries: [
      { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮', dialCode: '+225', majorCity: 'Abidjan', commodities: ['Cocoa', 'Cashew', 'Coffee', 'Rubber', 'Yams'] },
      { code: 'SN', name: 'Senegal', flag: '🇸🇳', dialCode: '+221', majorCity: 'Dakar', commodities: ['Groundnuts', 'Mangoes', 'Millet', 'Fish'] },
    ],
    defaultCountry: { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮', dialCode: '+225', majorCity: 'Abidjan', commodities: ['Cocoa', 'Cashew', 'Coffee', 'Rubber', 'Yams'] },
    methods: [
      {
        id: 'ORANGE_MONEY',
        name: 'Wave / Orange Money UEMOA',
        sub: 'Direct UEMOA QR & Mobile Money Settlement',
        badge: 'Wave/Orange',
        tagColor: '#0284C7',
        tagBg: '#E0F2FE',
        providerRail: 'wave',
      },
      {
        id: 'CASH_ON_DELIVERY',
        name: 'Cash on Delivery',
        sub: 'Direct Transporter Cash Settlement',
        badge: 'Cash Rail',
        tagColor: '#173A20',
        tagBg: '#E8F5E9',
        providerRail: 'cash',
      },
    ],
    supportedLanguages: ['fr', 'en'],
  },
  ECOWAS_EN: {
    id: 'ECOWAS_EN',
    name: 'ECOWAS Anglophone (WAMZ Zone)',
    shortName: 'ECOWAS Anglophone',
    flag: '🇳🇬',
    primaryCurrency: 'NGN',
    currencySymbol: '₦',
    rateFromXaf: 2.45,
    centralBank: 'CBN (Central Bank of Nigeria) & Bank of Ghana',
    regulatoryEscrowAuthority: 'CBN NIP Secured Escrow Gateway',
    majorCorridors: ['Abidjan – Lagos Trade Corridor', 'Lagos – Kano Food Highway', 'Calabar – Mamfe Border Rail'],
    containerId: 'NIGERIA',
    memberCountries: [
      { code: 'NG', name: 'Nigeria', flag: '🇳🇬', dialCode: '+234', majorCity: 'Lagos', commodities: ['Cassava', 'Yam', 'Oil Palm', 'Sorghum', 'Maize'] },
      { code: 'GH', name: 'Ghana', flag: '🇬🇭', dialCode: '+233', majorCity: 'Accra', commodities: ['Cocoa', 'Cassava', 'Yam', 'Shea Butter'] },
    ],
    defaultCountry: { code: 'NG', name: 'Nigeria', flag: '🇳🇬', dialCode: '+234', majorCity: 'Lagos', commodities: ['Cassava', 'Yam', 'Oil Palm', 'Sorghum', 'Maize'] },
    methods: [
      {
        id: 'PAYSTACK',
        name: 'Paystack Instant Bank Transfer',
        sub: 'Direct NIP Transfer to Escrow Vault',
        badge: 'Paystack Rail',
        tagColor: '#00875A',
        tagBg: '#E3FCEF',
        providerRail: 'paystack',
      },
      {
        id: 'PAYSTACK',
        name: 'Debit Card / USSD Banking',
        sub: 'Mastercard, Visa, Verve & USSD Banking',
        badge: 'Instant Rail',
        tagColor: '#0747A6',
        tagBg: '#DEEBFF',
        providerRail: 'paystack',
      },
    ],
    supportedLanguages: ['en', 'ha', 'fr'],
  },
  EAC: {
    id: 'EAC',
    name: 'EAC (East African Community)',
    shortName: 'EAC',
    flag: '🇰🇪',
    primaryCurrency: 'KES',
    currencySymbol: 'KSh',
    rateFromXaf: 0.21,
    centralBank: 'Central Bank of Kenya & EAC Monetary Council',
    regulatoryEscrowAuthority: 'EAC M-Pesa Interoperable Settlement',
    majorCorridors: ['Northern Corridor (Mombasa – Nairobi – Kampala – Kigali)', 'Central Corridor (Dar es Salaam – Kigoma)'],
    containerId: 'EAST_AFRICA',
    memberCountries: [
      { code: 'KE', name: 'Kenya', flag: '🇰🇪', dialCode: '+254', majorCity: 'Nairobi', commodities: ['Tea', 'Coffee', 'Cut Flowers', 'Horticulture', 'Maize'] },
      { code: 'UG', name: 'Uganda', flag: '🇺🇬', dialCode: '+256', majorCity: 'Kampala', commodities: ['Coffee', 'Matooke Bananas', 'Dairy', 'Tea'] },
      { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', dialCode: '+255', majorCity: 'Dar es Salaam', commodities: ['Cashew', 'Coffee', 'Cotton', 'Cloves'] },
    ],
    defaultCountry: { code: 'KE', name: 'Kenya', flag: '🇰🇪', dialCode: '+254', majorCity: 'Nairobi', commodities: ['Tea', 'Coffee', 'Cut Flowers', 'Horticulture', 'Maize'] },
    methods: [
      {
        id: 'PAYSTACK',
        name: 'M-Pesa Mobile Money',
        sub: 'Direct Safaricom STK Push to Phone',
        badge: 'M-Pesa Rail',
        tagColor: '#00875A',
        tagBg: '#E3FCEF',
        providerRail: 'mpesa',
      },
      {
        id: 'STRIPE_CARD',
        name: 'East African Card Escrow',
        sub: 'Visa, Mastercard & Local Bank Cards',
        badge: 'Card Rail',
        tagColor: '#4F46E5',
        tagBg: '#EEF2FF',
        providerRail: 'stripe',
      },
    ],
    supportedLanguages: ['en', 'sw'],
  },
  SADC: {
    id: 'SADC',
    name: 'SADC (Southern African Community)',
    shortName: 'SADC',
    flag: '🇿🇦',
    primaryCurrency: 'ZAR',
    currencySymbol: 'R',
    rateFromXaf: 0.030,
    centralBank: 'SARB (South African Reserve Bank)',
    regulatoryEscrowAuthority: 'SARB Commercial Clearing & Settlement',
    majorCorridors: ['Durban – Johannesburg – Gaborone Agro Link', 'Trans-Kalahari Highway', 'Beira Freight Corridor'],
    containerId: 'GLOBAL',
    memberCountries: [
      { code: 'ZA', name: 'South Africa', flag: '🇿🇦', dialCode: '+27', majorCity: 'Johannesburg', commodities: ['Citrus', 'Wine Grapes', 'Maize', 'Apples', 'Beef'] },
    ],
    defaultCountry: { code: 'ZA', name: 'South Africa', flag: '🇿🇦', dialCode: '+27', majorCity: 'Johannesburg', commodities: ['Citrus', 'Wine Grapes', 'Maize', 'Apples', 'Beef'] },
    methods: [
      {
        id: 'STRIPE_CARD',
        name: 'EFT Commercial Bank Settlement',
        sub: 'Direct Clearing through SARB Banking Layer',
        badge: 'Bank Rail',
        tagColor: '#0F172A',
        tagBg: '#F1F5F9',
        providerRail: 'stripe',
      },
    ],
    supportedLanguages: ['en', 'pt'],
  },
  COMESA: {
    id: 'COMESA',
    name: 'COMESA / Horn of Africa',
    shortName: 'COMESA',
    flag: '🇪🇹',
    primaryCurrency: 'ETB',
    currencySymbol: 'Br',
    rateFromXaf: 0.19,
    centralBank: 'National Bank of Ethiopia & Central Bank of Egypt',
    regulatoryEscrowAuthority: 'COMESA Regional Trade Settlement',
    majorCorridors: ['Addis Ababa – Djibouti Port Freight Corridor', 'Cairo – Khartoum Nile Agricultural Highway'],
    containerId: 'GLOBAL',
    memberCountries: [
      { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', dialCode: '+251', majorCity: 'Addis Ababa', commodities: ['Arabica Coffee', 'Sesame', 'Teff', 'Oilseeds', 'Livestock'] },
    ],
    defaultCountry: { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', dialCode: '+251', majorCity: 'Addis Ababa', commodities: ['Arabica Coffee', 'Sesame', 'Teff', 'Oilseeds', 'Livestock'] },
    methods: [
      {
        id: 'STRIPE_CARD',
        name: 'Telebirr / USD Trade Escrow',
        sub: 'Regulated Foreign Exchange Settlement',
        badge: 'Trade Rail',
        tagColor: '#B45309',
        tagBg: '#FEF3C7',
        providerRail: 'stripe',
      },
    ],
    supportedLanguages: ['en'],
  },
  GLOBAL: {
    id: 'GLOBAL',
    name: 'Global Diaspora & Intercontinental Export',
    shortName: 'Global Export',
    flag: '🌍',
    primaryCurrency: 'USD',
    currencySymbol: '$',
    rateFromXaf: 0.00163,
    centralBank: 'Federal Reserve / Bank of England',
    regulatoryEscrowAuthority: 'International 256-bit Stripe Vault',
    majorCorridors: ['African Diaspora Freight Airlink (London / Paris / New York)', 'AfCFTA Intercontinental Export'],
    containerId: 'GLOBAL',
    memberCountries: [
      { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1', majorCity: 'New York', commodities: ['African Produce Imports', 'Wholesale Cassava & Plantains'] },
      { code: 'UK', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44', majorCity: 'London', commodities: ['Exotic Produce Wholesale', 'Fair-Trade Cocoa & Coffee'] },
    ],
    defaultCountry: { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1', majorCity: 'New York', commodities: ['African Produce Imports', 'Wholesale Cassava & Plantains'] },
    methods: [
      {
        id: 'STRIPE_CARD',
        name: 'Apple Pay / Google Pay',
        sub: 'Biometric 1-Tap Escrow Authorization',
        badge: 'Stripe Vault',
        tagColor: '#4F46E5',
        tagBg: '#EEF2FF',
        providerRail: 'stripe',
      },
      {
        id: 'STRIPE_CARD',
        name: 'Credit / Debit Card',
        sub: 'Visa, Mastercard, Amex (256-bit encrypted)',
        badge: 'Global Rail',
        tagColor: '#0F172A',
        tagBg: '#F1F5F9',
        providerRail: 'stripe',
      },
    ],
    supportedLanguages: ['en', 'fr'],
  },
};

// Flat list of all supported regions for backward compatibility with checkout & UI screens
export const SUPPORTED_REGIONS: MarketRegionConfig[] = [
  {
    code: 'CM',
    name: 'Cameroon (CEMAC)',
    flag: '🇨🇲',
    currency: 'XAF',
    currencySymbol: 'FCFA',
    rateFromXaf: 1.0,
    containerId: 'CAMEROON',
    blocId: 'CEMAC',
    methods: TRADE_BLOCS.CEMAC.methods,
  },
  {
    code: 'CI',
    name: "Côte d'Ivoire (UEMOA)",
    flag: '🇨🇮',
    currency: 'XOF',
    currencySymbol: 'CFA',
    rateFromXaf: 1.0,
    containerId: 'NIGERIA',
    blocId: 'ECOWAS_FR',
    methods: TRADE_BLOCS.ECOWAS_FR.methods,
  },
  {
    code: 'NG',
    name: 'Nigeria (ECOWAS)',
    flag: '🇳🇬',
    currency: 'NGN',
    currencySymbol: '₦',
    rateFromXaf: 2.45,
    containerId: 'NIGERIA',
    blocId: 'ECOWAS_EN',
    methods: TRADE_BLOCS.ECOWAS_EN.methods,
  },
  {
    code: 'KE',
    name: 'Kenya (EAC)',
    flag: '🇰🇪',
    currency: 'KES',
    currencySymbol: 'KSh',
    rateFromXaf: 0.21,
    containerId: 'EAST_AFRICA',
    blocId: 'EAC',
    methods: TRADE_BLOCS.EAC.methods,
  },
  {
    code: 'UG',
    name: 'Uganda (EAC)',
    flag: '🇺🇬',
    currency: 'UGX',
    currencySymbol: 'USh',
    rateFromXaf: 6.1,
    containerId: 'EAST_AFRICA',
    blocId: 'EAC',
    methods: TRADE_BLOCS.EAC.methods,
  },
  {
    code: 'ZA',
    name: 'South Africa (SADC)',
    flag: '🇿🇦',
    currency: 'ZAR',
    currencySymbol: 'R',
    rateFromXaf: 0.030,
    containerId: 'GLOBAL',
    blocId: 'SADC',
    methods: TRADE_BLOCS.SADC.methods,
  },
  {
    code: 'ET',
    name: 'Ethiopia (COMESA)',
    flag: '🇪🇹',
    currency: 'ETB',
    currencySymbol: 'Br',
    rateFromXaf: 0.19,
    containerId: 'GLOBAL',
    blocId: 'COMESA',
    methods: TRADE_BLOCS.COMESA.methods,
  },
  {
    code: 'US',
    name: 'United States & Global',
    flag: '🇺🇸',
    currency: 'USD',
    currencySymbol: '$',
    rateFromXaf: 0.00163,
    containerId: 'GLOBAL',
    blocId: 'GLOBAL',
    methods: TRADE_BLOCS.GLOBAL.methods,
  },
  {
    code: 'UK',
    name: 'United Kingdom',
    flag: '🇬🇧',
    currency: 'GBP',
    currencySymbol: '£',
    rateFromXaf: 0.00128,
    containerId: 'GLOBAL',
    blocId: 'GLOBAL',
    methods: TRADE_BLOCS.GLOBAL.methods,
  },
];

export interface FormattedPriceResult {
  primary: string;
  dual?: string;
  fullLabel: string;
  rawConverted: number;
  symbol: string;
}

interface LocaleContextType {
  language: AppLanguage;
  marketRegion: MarketRegion;
  currentRegion: MarketRegionConfig;
  activeBloc: TradeBlocId;
  activeBlocConfig: TradeBlocConfig;
  showDualCurrency: boolean;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
  supportedRegions: MarketRegionConfig[];
  supportedBlocs: TradeBlocConfig[];
  glossary: CulturalGlossary;
  setLanguage: (lang: AppLanguage) => Promise<void>;
  setMarketRegion: (region: MarketRegion) => Promise<void>;
  setTradeBloc: (blocId: TradeBlocId) => Promise<void>;
  toggleDualCurrency: () => void;
  autoDetectRegionFromPhone: (phone: string) => void;
  formatCurrency: (amountInXaf: number) => string;
  formatPrice: (
    amountInXaf: number,
    options?: { showDual?: boolean; targetCurrency?: string }
  ) => FormattedPriceResult;
  t: (key: string) => string;
}

const GLOSSARY_DICTIONARY: Record<TradeBlocId, Record<AppLanguage, CulturalGlossary>> = {
  CEMAC: {
    en: {
      wholesalerLabel: 'Bayam-Sellam (Wholesaler)',
      bulkUnitLabel: 'Crate / Casier',
      coopCreditLabel: 'Njangi Credit Line',
      escrowBadgeText: 'BEAC AgroShield (Campay MoMo)',
      makeOfferButtonText: 'Make Direct Deal Offer',
      freshReactionText: '🌱 Fresh Harvest',
      highDemandReactionText: '🔥 High Demand',
      readyToShipReactionText: '📦 Ready to Dispatch',
      partnerUpReactionText: '🤝 Trade Partner',
    },
    fr: {
      wholesalerLabel: 'Bayam-Sellam',
      bulkUnitLabel: 'Casier / Caisse',
      coopCreditLabel: 'Crédit Tontine / Njangi',
      escrowBadgeText: 'Garantie Escrow BEAC (Campay)',
      makeOfferButtonText: 'Proposer une Offre P2P',
      freshReactionText: '🌱 Récolte Fraîche',
      highDemandReactionText: '🔥 Forte Demande',
      readyToShipReactionText: '📦 Prêt pour Expédition',
      partnerUpReactionText: '🤝 Devenir Partenaire',
    },
    sw: {
      wholesalerLabel: 'Mfanyabiashara Mkubwa',
      bulkUnitLabel: 'Kareti / Sanduku',
      coopCreditLabel: 'Mkopo wa Njangi',
      escrowBadgeText: 'Ulinzi wa Escrow ya BEAC',
      makeOfferButtonText: 'Tuma Ofa ya Moja kwa Moja',
      freshReactionText: '🌱 Mavuno Mapya',
      highDemandReactionText: '🔥 Mahitaji Makubwa',
      readyToShipReactionText: '📦 Tayari Kusafirishwa',
      partnerUpReactionText: '🤝 Mshirika wa Biashara',
    },
    ha: {
      wholesalerLabel: 'Dan Kasuwa / Wholesaler',
      bulkUnitLabel: 'Akwati / Crate',
      coopCreditLabel: 'Layin Kudi na Njangi',
      escrowBadgeText: 'Kariyar Escrow ta BEAC',
      makeOfferButtonText: 'Aika Tayin Kai Tsaye',
      freshReactionText: '🌱 Sabon Girbi',
      highDemandReactionText: '🔥 Babban Buƙata',
      readyToShipReactionText: '📦 Shirye Don Aika',
      partnerUpReactionText: '🤝 Abokin Ciniki',
    },
    pt: {
      wholesalerLabel: 'Bayam-Sellam (Comerciante)',
      bulkUnitLabel: 'Caixa / Cesta',
      coopCreditLabel: 'Linha de Crédito Njangi',
      escrowBadgeText: 'Garantia AgroShield BEAC',
      makeOfferButtonText: 'Fazer Oferta Direta',
      freshReactionText: '🌱 Colheita Fresca',
      highDemandReactionText: '🔥 Alta Demanda',
      readyToShipReactionText: '📦 Pronto para Envio',
      partnerUpReactionText: '🤝 Parceiro Comercial',
    },
    es: {
      wholesalerLabel: 'Comerciante Mayorista',
      bulkUnitLabel: 'Caja / Cesta',
      coopCreditLabel: 'Crédito Njangi Cooperativo',
      escrowBadgeText: 'Garantía AgroShield BEAC',
      makeOfferButtonText: 'Hacer Oferta Directa',
      freshReactionText: '🌱 Cosecha Fresca',
      highDemandReactionText: '🔥 Alta Demanda',
      readyToShipReactionText: '📦 Listo para Envío',
      partnerUpReactionText: '🤝 Socio Comercial',
    },
    ja: {
      wholesalerLabel: 'バヤム・セラム（卸売業者）',
      bulkUnitLabel: '木箱 / コンテナ',
      coopCreditLabel: 'ンジャンギ協同信用',
      escrowBadgeText: 'BEAC 保証エスクロー',
      makeOfferButtonText: '直接取引の提案を送る',
      freshReactionText: '🌱 新鮮な収穫',
      highDemandReactionText: '🔥 需要急増',
      readyToShipReactionText: '📦 発送準備完了',
      partnerUpReactionText: '🤝 取引パートナー',
    },
  },
  ECOWAS_FR: {
    en: {
      wholesalerLabel: 'UEMOA Wholesale Aggregator',
      bulkUnitLabel: 'Crate / Sack',
      coopCreditLabel: 'Tontine Credit Facility',
      escrowBadgeText: 'BCEAO Secured Escrow (Wave/Orange)',
      makeOfferButtonText: 'Submit Purchase Offer',
      freshReactionText: '🌱 Farm Fresh Produce',
      highDemandReactionText: '🔥 Fast Moving',
      readyToShipReactionText: '📦 Ready for Trucking',
      partnerUpReactionText: '🤝 Trade Partner',
    },
    fr: {
      wholesalerLabel: 'Grossiste Répartiteur UEMOA',
      bulkUnitLabel: 'Sac / Casier',
      coopCreditLabel: 'Crédit Tontine Agricole',
      escrowBadgeText: 'Escrow Garanti BCEAO (Wave/Orange)',
      makeOfferButtonText: 'Faire une Offre Ferme',
      freshReactionText: '🌱 Récolte Primeur',
      highDemandReactionText: '🔥 Forte Rotation',
      readyToShipReactionText: '📦 Prêt pour Chargement',
      partnerUpReactionText: '🤝 Partenaire d’Affaires',
    },
    sw: {
      wholesalerLabel: 'Mfanyabiashara wa UEMOA',
      bulkUnitLabel: 'Gunia / Sanduku',
      coopCreditLabel: 'Mkopo wa Tontine',
      escrowBadgeText: 'Ulinzi wa Escrow ya BCEAO',
      makeOfferButtonText: 'Wasilisha Ofa',
      freshReactionText: '🌱 Mazao Mapya',
      highDemandReactionText: '🔥 Mahitaji Mengi',
      readyToShipReactionText: '📦 Tayari Kupakiwa',
      partnerUpReactionText: '🤝 Mshirika wa Biashara',
    },
    ha: {
      wholesalerLabel: 'Babban Dillalin UEMOA',
      bulkUnitLabel: 'Buhu / Crate',
      coopCreditLabel: 'Kudin Tontine',
      escrowBadgeText: 'Kariyar Escrow ta BCEAO',
      makeOfferButtonText: 'Aika Tayi',
      freshReactionText: '🌱 Sabon Kaya',
      highDemandReactionText: '🔥 Yana Tafiya Da Sauri',
      readyToShipReactionText: '📦 Shirye Don Lodi',
      partnerUpReactionText: '🤝 Abokin Ciniki',
    },
    pt: {
      wholesalerLabel: 'Comerciante Atacadista UEMOA',
      bulkUnitLabel: 'Saco / Caixa',
      coopCreditLabel: 'Crédito Tontine',
      escrowBadgeText: 'Garantia Escrow BCEAO',
      makeOfferButtonText: 'Submeter Proposta',
      freshReactionText: '🌱 Fresco da Fazenda',
      highDemandReactionText: '🔥 Alta Demanda',
      readyToShipReactionText: '📦 Pronto para Carga',
      partnerUpReactionText: '🤝 Parceiro Comercial',
    },
    es: {
      wholesalerLabel: 'Distribuidor Mayorista UEMOA',
      bulkUnitLabel: 'Saco / Caja',
      coopCreditLabel: 'Crédito Tontine',
      escrowBadgeText: 'Garantía Escrow BCEAO',
      makeOfferButtonText: 'Presentar Oferta',
      freshReactionText: '🌱 Cosecha Fresca',
      highDemandReactionText: '🔥 Gran Demanda',
      readyToShipReactionText: '📦 Listo para Carga',
      partnerUpReactionText: '🤝 Socio Comercial',
    },
    ja: {
      wholesalerLabel: '西アフリカ卸売流通業者',
      bulkUnitLabel: '大袋 / クレート',
      coopCreditLabel: 'トンチン信用融資',
      escrowBadgeText: 'BCEAO 保証エスクロー',
      makeOfferButtonText: '購入提案書を提出',
      freshReactionText: '🌱 新鮮農産物',
      highDemandReactionText: '🔥 売れ筋',
      readyToShipReactionText: '📦 積載準備完了',
      partnerUpReactionText: '🤝 ビジネスパートナー',
    },
  },
  ECOWAS_EN: {
    en: {
      wholesalerLabel: 'Major Market Trader / Wholesaler',
      bulkUnitLabel: 'Bag / Crate',
      coopCreditLabel: 'Esusu / Ajo Credit',
      escrowBadgeText: 'CBN Secured Escrow (Paystack)',
      makeOfferButtonText: 'Make Direct Deal Offer',
      freshReactionText: '🌱 Direct Farm Harvest',
      highDemandReactionText: '🔥 Fast Moving',
      readyToShipReactionText: '📦 Ready for Trucking',
      partnerUpReactionText: '🤝 Trade Partner',
    },
    fr: {
      wholesalerLabel: 'Grand Commerçant de Marché',
      bulkUnitLabel: 'Sac / Caisse',
      coopCreditLabel: 'Crédit Esusu / Ajo',
      escrowBadgeText: 'Escrow Sécurisé CBN (Paystack)',
      makeOfferButtonText: 'Faire une Offre Directe',
      freshReactionText: '🌱 Récolte Directe',
      highDemandReactionText: '🔥 Forte Rotation',
      readyToShipReactionText: '📦 Prêt pour Chargement',
      partnerUpReactionText: '🤝 Partenaire Commercial',
    },
    sw: {
      wholesalerLabel: 'Mfanyabiashara wa Soko Kuu',
      bulkUnitLabel: 'Begi / Kareti',
      coopCreditLabel: 'Mkopo wa Esusu / Ajo',
      escrowBadgeText: 'Escrow Iliyolindwa ya CBN',
      makeOfferButtonText: 'Fanya Ofa ya Moja kwa Moja',
      freshReactionText: '🌱 Mavuno ya Moja kwa Moja',
      highDemandReactionText: '🔥 Inauzika Sana',
      readyToShipReactionText: '📦 Tayari Kupakiwa',
      partnerUpReactionText: '🤝 Mshirika wa Biashara',
    },
    ha: {
      wholesalerLabel: 'Babban Dillalin Kasuwa',
      bulkUnitLabel: 'Buhu / Akwati',
      coopCreditLabel: 'Asusu / Ajo Credit',
      escrowBadgeText: 'Kariyar Escrow ta CBN (Paystack)',
      makeOfferButtonText: 'Kulla Ciniki Kai Tsaye',
      freshReactionText: '🌱 Daga Gona Kai Tsaye',
      highDemandReactionText: '🔥 Ana Nema Sosai',
      readyToShipReactionText: '📦 Shirye Don Lodi a Mota',
      partnerUpReactionText: '🤝 Abokin Hulɗa',
    },
    pt: {
      wholesalerLabel: 'Comerciante Atacadista',
      bulkUnitLabel: 'Saco / Caixa',
      coopCreditLabel: 'Crédito Esusu',
      escrowBadgeText: 'Custódia CBN Paystack',
      makeOfferButtonText: 'Fazer Oferta Direta',
      freshReactionText: '🌱 Colheita Direta',
      highDemandReactionText: '🔥 Rápida Rotação',
      readyToShipReactionText: '📦 Pronto para Caminhão',
      partnerUpReactionText: '🤝 Parceiro Comercial',
    },
    es: {
      wholesalerLabel: 'Comerciante Mayorista',
      bulkUnitLabel: 'Saco / Caja',
      coopCreditLabel: 'Crédito Esusu',
      escrowBadgeText: 'Custodia CBN Paystack',
      makeOfferButtonText: 'Hacer Oferta Directa',
      freshReactionText: '🌱 Cosecha Directa',
      highDemandReactionText: '🔥 Alta Demanda',
      readyToShipReactionText: '📦 Listo para Transporte',
      partnerUpReactionText: '🤝 Socio Comercial',
    },
    ja: {
      wholesalerLabel: '市場大口商人・卸売業者',
      bulkUnitLabel: '大袋 / クレート',
      coopCreditLabel: 'エスス協同信用',
      escrowBadgeText: 'CBN 保証エスクロー',
      makeOfferButtonText: '直接オファーを送信',
      freshReactionText: '🌱 農場直送',
      highDemandReactionText: '🔥 売れ筋商品',
      readyToShipReactionText: '📦 トラック積み込み可能',
      partnerUpReactionText: '🤝 ビジネス提携',
    },
  },
  EAC: {
    en: {
      wholesalerLabel: 'Mama Mboga / Wholesale Aggregator',
      bulkUnitLabel: 'Debe / Gunia / Crate',
      coopCreditLabel: 'Chama Micro-Credit',
      escrowBadgeText: 'M-Pesa Escrow Protection',
      makeOfferButtonText: 'Send Trade Offer',
      freshReactionText: '🌱 Shamba Fresh',
      highDemandReactionText: '🔥 Hot Commodity',
      readyToShipReactionText: '📦 Ready for Transit',
      partnerUpReactionText: '🤝 AgroPartner',
    },
    fr: {
      wholesalerLabel: 'Agrégateur / Mama Mboga',
      bulkUnitLabel: 'Sac / Caisse / Debe',
      coopCreditLabel: 'Micro-Crédit Chama',
      escrowBadgeText: 'Protection Escrow M-Pesa',
      makeOfferButtonText: 'Envoyer une Offre',
      freshReactionText: '🌱 Frais du Shamba',
      highDemandReactionText: '🔥 Produit Tendance',
      readyToShipReactionText: '📦 Prêt pour Transit',
      partnerUpReactionText: '🤝 Partenaire Agricole',
    },
    sw: {
      wholesalerLabel: 'Mama Mboga / Mkusanyaji wa Jumla',
      bulkUnitLabel: 'Debe / Gunia / Kareti',
      coopCreditLabel: 'Mkopo wa Chama',
      escrowBadgeText: 'Ulinzi wa Escrow ya M-Pesa',
      makeOfferButtonText: 'Tuma Ofa ya Biashara',
      freshReactionText: '🌱 Mbichi Kutoka Shambani',
      highDemandReactionText: '🔥 Bidhaa Inayohitajika Sana',
      readyToShipReactionText: '📦 Tayari kwa Usafiri',
      partnerUpReactionText: '🤝 Mshirika wa Kilimo',
    },
    ha: {
      wholesalerLabel: 'Mama Mboga / Dillali',
      bulkUnitLabel: 'Debe / Gunia / Crate',
      coopCreditLabel: 'Kudin Chama',
      escrowBadgeText: 'Kariyar M-Pesa Escrow',
      makeOfferButtonText: 'Aika Tayi',
      freshReactionText: '🌱 Daga Shamba',
      highDemandReactionText: '🔥 Yana Da Kyau',
      readyToShipReactionText: '📦 Shirye Don Tafiya',
      partnerUpReactionText: '🤝 Abokin Ciniki',
    },
    pt: {
      wholesalerLabel: 'Mama Mboga / Agregador',
      bulkUnitLabel: 'Saco / Debe / Caixa',
      coopCreditLabel: 'Microcrédito Chama',
      escrowBadgeText: 'Proteção Escrow M-Pesa',
      makeOfferButtonText: 'Enviar Oferta',
      freshReactionText: '🌱 Fresco da Shamba',
      highDemandReactionText: '🔥 Alta Demanda',
      readyToShipReactionText: '📦 Pronto para Trânsito',
      partnerUpReactionText: '🤝 Parceiro Comercial',
    },
    es: {
      wholesalerLabel: 'Distribuidor Mama Mboga',
      bulkUnitLabel: 'Saco / Debe / Caja',
      coopCreditLabel: 'Microcrédito Chama',
      escrowBadgeText: 'Protección Escrow M-Pesa',
      makeOfferButtonText: 'Enviar Oferta',
      freshReactionText: '🌱 Fresco de la Granja',
      highDemandReactionText: '🔥 Alta Demanda',
      readyToShipReactionText: '📦 Listo para Tránsito',
      partnerUpReactionText: '🤝 Socio Comercial',
    },
    ja: {
      wholesalerLabel: 'ママ・ンボガ（東アフリカ卸売業者）',
      bulkUnitLabel: 'デベ / グニア / クレート',
      coopCreditLabel: 'チャマ協同融資',
      escrowBadgeText: 'M-Pesa エスクロー保護',
      makeOfferButtonText: '取引カードを送る',
      freshReactionText: '🌱 農場直送の新鮮さ',
      highDemandReactionText: '🔥 注文殺到中',
      readyToShipReactionText: '📦 輸送手配完了',
      partnerUpReactionText: '🤝 ビジネス提携',
    },
  },
  SADC: {
    en: {
      wholesalerLabel: 'Produce Wholesaler / Commercial Broker',
      bulkUnitLabel: 'Bin / Pallet / Crate',
      coopCreditLabel: 'Land Bank Facility',
      escrowBadgeText: 'SARB Commercial Trust Escrow',
      makeOfferButtonText: 'Submit Purchase Bid',
      freshReactionText: '🌱 Farmgate Fresh',
      highDemandReactionText: '🔥 Prime Export Grade',
      readyToShipReactionText: '📦 Ready for Freight',
      partnerUpReactionText: '🤝 Commercial Partner',
    },
    fr: {
      wholesalerLabel: 'Grossiste Répartiteur Commercial',
      bulkUnitLabel: 'Palette / Caisse / Bac',
      coopCreditLabel: 'Crédit Foncier Agricole',
      escrowBadgeText: 'Fiducie Escrow SARB',
      makeOfferButtonText: 'Soumettre une Offre',
      freshReactionText: '🌱 Primeur Agricole',
      highDemandReactionText: '🔥 Qualité Export',
      readyToShipReactionText: '📦 Prêt pour Fret',
      partnerUpReactionText: '🤝 Partenaire Commercial',
    },
    sw: {
      wholesalerLabel: 'Mfanyabiashara wa Kibiashara',
      bulkUnitLabel: 'Paleti / Sanduku',
      coopCreditLabel: 'Mkopo wa Benki ya Ardhi',
      escrowBadgeText: 'Escrow ya Biashara ya SARB',
      makeOfferButtonText: 'Wasilisha Zabuni',
      freshReactionText: '🌱 Mazao Bora',
      highDemandReactionText: '🔥 Daraja la Usafirishaji',
      readyToShipReactionText: '📦 Tayari Kusafirishwa',
      partnerUpReactionText: '🤝 Mshirika wa Biashara',
    },
    ha: {
      wholesalerLabel: 'Babban Dillalin Kasuwanci',
      bulkUnitLabel: 'Pallet / Crate',
      coopCreditLabel: 'Kudin Bankin Kasa',
      escrowBadgeText: 'Kariyar SARB Escrow',
      makeOfferButtonText: 'Aika Farashi',
      freshReactionText: '🌱 Kaya Mai Kyau',
      highDemandReactionText: '🔥 Matakin Fitarwa',
      readyToShipReactionText: '📦 Shirye Don Jirgi',
      partnerUpReactionText: '🤝 Abokin Hulɗa',
    },
    pt: {
      wholesalerLabel: 'Distribuidor Comercial',
      bulkUnitLabel: 'Palete / Caixa',
      coopCreditLabel: 'Crédito Land Bank',
      escrowBadgeText: 'Custódia Comercial SARB',
      makeOfferButtonText: 'Submeter Proposta',
      freshReactionText: '🌱 Fresco da Fazenda',
      highDemandReactionText: '🔥 Grau de Exportação',
      readyToShipReactionText: '📦 Pronto para Carga',
      partnerUpReactionText: '🤝 Parceiro Comercial',
    },
    es: {
      wholesalerLabel: 'Distribuidor Mayorista Comercial',
      bulkUnitLabel: 'Palé / Caja',
      coopCreditLabel: 'Crédito Agrícola Land Bank',
      escrowBadgeText: 'Custodia Comercial SARB',
      makeOfferButtonText: 'Presentar Oferta',
      freshReactionText: '🌱 Cosecha Fresca',
      highDemandReactionText: '🔥 Calidad de Exportación',
      readyToShipReactionText: '📦 Listo para Flete',
      partnerUpReactionText: '🤝 Socio Comercial',
    },
    ja: {
      wholesalerLabel: '南部アフリカ商業農産物卸売商',
      bulkUnitLabel: 'パレット / クレート',
      coopCreditLabel: '農業開発銀行融資',
      escrowBadgeText: 'SARB 商業エスクロー信託',
      makeOfferButtonText: '入札オファーを提出',
      freshReactionText: '🌱 厳選農産物',
      highDemandReactionText: '🔥 輸出用プレミアム',
      readyToShipReactionText: '📦 貨物輸送可能',
      partnerUpReactionText: '🤝 商業パートナー',
    },
  },
  COMESA: {
    en: {
      wholesalerLabel: 'Regional Agri-Commodity Trader',
      bulkUnitLabel: 'Standard Export Bag',
      coopCreditLabel: 'Regional Trade Facility',
      escrowBadgeText: 'COMESA Regulated Escrow',
      makeOfferButtonText: 'Initiate Cross-Border Trade',
      freshReactionText: '🌱 Prime Origin Harvest',
      highDemandReactionText: '🔥 High Export Demand',
      readyToShipReactionText: '📦 Port Transit Ready',
      partnerUpReactionText: '🤝 Trade Partner',
    },
    fr: {
      wholesalerLabel: 'Négociant Régional en Matières Premières',
      bulkUnitLabel: 'Sac Export Standard',
      coopCreditLabel: 'Facilité de Crédit Régionale',
      escrowBadgeText: 'Escrow Régulé COMESA',
      makeOfferButtonText: 'Initier un Échange Transfrontalier',
      freshReactionText: '🌱 Récolte d’Origine Primeur',
      highDemandReactionText: '🔥 Forte Demande Export',
      readyToShipReactionText: '📦 Prêt pour Transit Portuaire',
      partnerUpReactionText: '🤝 Partenaire d’Affaires',
    },
    sw: {
      wholesalerLabel: 'Mfanyabiashara wa Mazao wa COMESA',
      bulkUnitLabel: 'Begi la Usafirishaji',
      coopCreditLabel: 'Mkopo wa Biashara wa Eneo',
      escrowBadgeText: 'Ulinzi wa Escrow wa COMESA',
      makeOfferButtonText: 'Anzisha Biashara ya Mipakani',
      freshReactionText: '🌱 Mavuno Bora',
      highDemandReactionText: '🔥 Mahitaji ya Nje',
      readyToShipReactionText: '📦 Tayari kwa Bandari',
      partnerUpReactionText: '🤝 Mshirika wa Biashara',
    },
    ha: {
      wholesalerLabel: 'Dan Kasuwar Hatsi na Yanki',
      bulkUnitLabel: 'Buhun Fitarwa',
      coopCreditLabel: 'Kudin Kasuwancin Yanki',
      escrowBadgeText: 'Kariyar COMESA Escrow',
      makeOfferButtonText: 'Fara Kasuwancin Kan Iyaka',
      freshReactionText: '🌱 Girbi Na Asali',
      highDemandReactionText: '🔥 Buƙatar Ƙasashen Waje',
      readyToShipReactionText: '📦 Shirye Don Tashar Jirgi',
      partnerUpReactionText: '🤝 Abokin Ciniki',
    },
    pt: {
      wholesalerLabel: 'Negociante Regional de Commodities',
      bulkUnitLabel: 'Saco Padrão de Exportação',
      coopCreditLabel: 'Facilidade Regional de Crédito',
      escrowBadgeText: 'Custódia Regulada COMESA',
      makeOfferButtonText: 'Iniciar Comércio Fronteiriço',
      freshReactionText: '🌱 Colheita de Origem',
      highDemandReactionText: '🔥 Alta Demanda de Exportação',
      readyToShipReactionText: '📦 Pronto para Porto',
      partnerUpReactionText: '🤝 Parceiro Comercial',
    },
    es: {
      wholesalerLabel: 'Comerciante Regional de Granos',
      bulkUnitLabel: 'Saco de Exportación',
      coopCreditLabel: 'Facilidad de Crédito Regional',
      escrowBadgeText: 'Custodia Regulada COMESA',
      makeOfferButtonText: 'Iniciar Comercio Transfronterizo',
      freshReactionText: '🌱 Cosecha Selecta',
      highDemandReactionText: '🔥 Gran Demanda Export',
      readyToShipReactionText: '📦 Listo para Puerto',
      partnerUpReactionText: '🤝 Socio Comercial',
    },
    ja: {
      wholesalerLabel: 'COMESA 地域農産物商社',
      bulkUnitLabel: '標準輸出バッグ',
      coopCreditLabel: '地域貿易信用ファシリティ',
      escrowBadgeText: 'COMESA 規制エスクロー',
      makeOfferButtonText: '国境越え取引を開始',
      freshReactionText: '🌱 産地特選収穫',
      highDemandReactionText: '🔥 輸出需要急増',
      readyToShipReactionText: '📦 港湾輸送手配完了',
      partnerUpReactionText: '🤝 貿易パートナー',
    },
  },
  GLOBAL: {
    en: {
      wholesalerLabel: 'Produce Wholesaler / Distributor',
      bulkUnitLabel: 'Standard Produce Crate',
      coopCreditLabel: 'Agricultural Credit Line',
      escrowBadgeText: 'Stripe 256-bit Escrow Vault',
      makeOfferButtonText: 'Submit Contract Offer',
      freshReactionText: '🌱 Farm Fresh Harvest',
      highDemandReactionText: '🔥 High Market Demand',
      readyToShipReactionText: '📦 Ready for Freight',
      partnerUpReactionText: '🤝 AgroPartner',
    },
    fr: {
      wholesalerLabel: 'Grossiste en Produits Frais',
      bulkUnitLabel: 'Caisse Standard',
      coopCreditLabel: 'Ligne de Crédit Agricole',
      escrowBadgeText: 'Sécurité Escrow Stripe 256-bit',
      makeOfferButtonText: 'Soumettre une Offre',
      freshReactionText: '🌱 Fraîchement Récolté',
      highDemandReactionText: '🔥 Forte Demande Marché',
      readyToShipReactionText: '📦 Prêt pour Fret',
      partnerUpReactionText: '🤝 Devenir Partenaire',
    },
    sw: {
      wholesalerLabel: 'Msambazaji wa Kimataifa',
      bulkUnitLabel: 'Kareti ya Kawaida',
      coopCreditLabel: 'Mkopo wa Kilimo',
      escrowBadgeText: 'Ulinzi wa Escrow ya Stripe',
      makeOfferButtonText: 'Tuma Mkataba',
      freshReactionText: '🌱 Mavuno Safi',
      highDemandReactionText: '🔥 Mahitaji ya Soko',
      readyToShipReactionText: '📦 Tayari kwa Fleti',
      partnerUpReactionText: '🤝 Mshirika wa Kimataifa',
    },
    ha: {
      wholesalerLabel: 'Babban Dillalin Duniya',
      bulkUnitLabel: 'Akwati na Musamman',
      coopCreditLabel: 'Kudin Noma na Banki',
      escrowBadgeText: 'Kariyar Stripe Escrow',
      makeOfferButtonText: 'Aika Tayin Kwangila',
      freshReactionText: '🌱 Sabon Kaya Daga Gona',
      highDemandReactionText: '🔥 Ana Nema Sosai',
      readyToShipReactionText: '📦 Shirye Don Jigilar Kaya',
      partnerUpReactionText: '🤝 Abokin Hulɗa',
    },
    pt: {
      wholesalerLabel: 'Distribuidor Atacadista',
      bulkUnitLabel: 'Caixa Padrão',
      coopCreditLabel: 'Linha de Crédito Rural',
      escrowBadgeText: 'Cofre Escrow Stripe 256-bit',
      makeOfferButtonText: 'Submeter Proposta',
      freshReactionText: '🌱 Fresco da Fazenda',
      highDemandReactionText: '🔥 Alta Demanda',
      readyToShipReactionText: '📦 Pronto para Carga',
      partnerUpReactionText: '🤝 Parceiro Agrícola',
    },
    es: {
      wholesalerLabel: 'Distribuidor Mayorista',
      bulkUnitLabel: 'Caja Estándar',
      coopCreditLabel: 'Línea de Crédito Agrícola',
      escrowBadgeText: 'Bóveda Escrow Stripe 256-bit',
      makeOfferButtonText: 'Presentar Oferta',
      freshReactionText: '🌱 Cosecha Fresca',
      highDemandReactionText: '🔥 Gran Demanda',
      readyToShipReactionText: '📦 Listo para Transporte',
      partnerUpReactionText: '🤝 Socio Agrícola',
    },
    ja: {
      wholesalerLabel: '農産物卸売・流通業者',
      bulkUnitLabel: '標準木箱クレート',
      coopCreditLabel: '農業信用融資枠',
      escrowBadgeText: 'Stripe 256bit エスクロー保管庫',
      makeOfferButtonText: '契約オファーを提出',
      freshReactionText: '🌱 農場直送の新鮮さ',
      highDemandReactionText: '🔥 市場需要高',
      readyToShipReactionText: '📦 貨物出荷準備完了',
      partnerUpReactionText: '🤝 アグロパートナー提携',
    },
  },
};

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>('en');
  const [activeBloc, setActiveBlocState] = useState<TradeBlocId>('CEMAC');
  const [marketRegion, setMarketRegionState] = useState<MarketRegion>('CM');
  const [showDualCurrency, setShowDualCurrency] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        const savedLang = await AsyncStorage.getItem('@agrom_lang');
        const savedBloc = await AsyncStorage.getItem('@agrom_trade_bloc');
        const savedRegion = await AsyncStorage.getItem('@agrom_region');
        const savedDual = await AsyncStorage.getItem('@agrom_show_dual');

        if (savedLang) setLanguageState(savedLang as AppLanguage);
        if (savedBloc && TRADE_BLOCS[savedBloc as TradeBlocId]) {
          setActiveBlocState(savedBloc as TradeBlocId);
        }
        if (savedRegion) setMarketRegionState(savedRegion as MarketRegion);
        if (savedDual !== null) setShowDualCurrency(savedDual === 'true');

        // Sync regional container store
        const bloc = TRADE_BLOCS[(savedBloc as TradeBlocId) || 'CEMAC'];
        if (bloc?.containerId) {
          useRegionalContainerStore.getState().setRegion(bloc.containerId);
        }
      } catch (e) {
        // Fallback default
      }
    })();
  }, []);

  const setLanguage = async (newLang: AppLanguage) => {
    setLanguageState(newLang);
    try {
      await AsyncStorage.setItem('@agrom_lang', newLang);
    } catch (e) {}
  };

  const setTradeBloc = async (newBloc: TradeBlocId) => {
    setActiveBlocState(newBloc);
    const blocConfig = TRADE_BLOCS[newBloc];
    if (blocConfig) {
      setMarketRegionState(blocConfig.defaultCountry.code);
      if (blocConfig.containerId) {
        useRegionalContainerStore.getState().setRegion(blocConfig.containerId);
      }
    }
    try {
      await AsyncStorage.setItem('@agrom_trade_bloc', newBloc);
      if (blocConfig) {
        await AsyncStorage.setItem('@agrom_region', blocConfig.defaultCountry.code);
      }
    } catch (e) {}
  };

  const setMarketRegion = async (newRegion: MarketRegion) => {
    setMarketRegionState(newRegion);
    // Find matching Trade Bloc
    const matchingEntry = Object.values(TRADE_BLOCS).find((b) =>
      b.memberCountries.some((c) => c.code === newRegion)
    );
    if (matchingEntry) {
      setActiveBlocState(matchingEntry.id);
      if (matchingEntry.containerId) {
        useRegionalContainerStore.getState().setRegion(matchingEntry.containerId);
      }
      try {
        await AsyncStorage.setItem('@agrom_trade_bloc', matchingEntry.id);
      } catch (e) {}
    }
    try {
      await AsyncStorage.setItem('@agrom_region', newRegion);
    } catch (e) {}
  };



  const toggleDualCurrency = () => {
    setShowDualCurrency((prev) => {
      const next = !prev;
      AsyncStorage.setItem('@agrom_show_dual', String(next)).catch(() => {});
      return next;
    });
  };

  /**
   * Automatic zero-friction Trade Bloc & Region detection from phone dial code
   */
  const autoDetectRegionFromPhone = (phone: string) => {
    if (!phone) return;
    const cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('237')) {
      setTradeBloc('CEMAC');
      setMarketRegion('CM');
    } else if (cleaned.startsWith('225')) {
      setTradeBloc('ECOWAS_FR');
      setMarketRegion('CI');
    } else if (cleaned.startsWith('221')) {
      setTradeBloc('ECOWAS_FR');
      setMarketRegion('SN');
    } else if (cleaned.startsWith('234')) {
      setTradeBloc('ECOWAS_EN');
      setMarketRegion('NG');
    } else if (cleaned.startsWith('233')) {
      setTradeBloc('ECOWAS_EN');
      setMarketRegion('GH');
    } else if (cleaned.startsWith('254')) {
      setTradeBloc('EAC');
      setMarketRegion('KE');
    } else if (cleaned.startsWith('256')) {
      setTradeBloc('EAC');
      setMarketRegion('UG');
    } else if (cleaned.startsWith('255')) {
      setTradeBloc('EAC');
      setMarketRegion('TZ');
    } else if (cleaned.startsWith('27')) {
      setTradeBloc('SADC');
      setMarketRegion('ZA');
    } else if (cleaned.startsWith('251')) {
      setTradeBloc('COMESA');
      setMarketRegion('ET');
    } else if (cleaned.startsWith('44')) {
      setTradeBloc('GLOBAL');
      setMarketRegion('UK');
    } else if (cleaned.startsWith('1')) {
      setTradeBloc('GLOBAL');
      setMarketRegion('US');
    }
  };

  const activeBlocConfig = TRADE_BLOCS[activeBloc] || TRADE_BLOCS.CEMAC;
  const currentRegion =
    SUPPORTED_REGIONS.find((r) => r.code === marketRegion) || SUPPORTED_REGIONS[0];

  const currentGlossaryBloc = GLOSSARY_DICTIONARY[activeBloc] || GLOSSARY_DICTIONARY.CEMAC;
  const glossary = currentGlossaryBloc[language] || currentGlossaryBloc.en;

  /**
   * Role-aware price formatter:
   * - Farmer: Local currency only (e.g. 15,000 FCFA or 36,750 ₦)
   * - Buyer: Dual currency with FX conversion for cross-border calculation (e.g. 15,000 FCFA (≈ ₦36,750) or (≈ $24.45))
   * - Financial Agent: Central bank clearing rail currency
   */
  const formatPrice = (
    amountInXaf: number,
    options?: { showDual?: boolean; targetCurrency?: string }
  ): FormattedPriceResult => {
    const rate = activeBlocConfig.rateFromXaf;
    const converted = amountInXaf * rate;
    const symbol = activeBlocConfig.currencySymbol;
    const currency = activeBlocConfig.primaryCurrency;

    let primaryFormatted: string;
    if (currency === 'USD' || currency === 'GBP') {
      primaryFormatted = `${symbol}${converted.toFixed(2)}`;
    } else {
      primaryFormatted = `${Math.round(converted).toLocaleString()} ${symbol}`;
    }

    const shouldShowDual =
      options?.showDual !== undefined ? options.showDual : showDualCurrency;

    let dualFormatted: string | undefined;
    if (shouldShowDual) {
      if (currency !== 'USD') {
        const usdRate = TRADE_BLOCS.GLOBAL.rateFromXaf;
        const inUsd = (amountInXaf * usdRate).toFixed(2);
        dualFormatted = `≈ $${inUsd}`;
      } else {
        dualFormatted = `≈ ${Math.round(amountInXaf).toLocaleString()} FCFA`;
      }
    }

    const fullLabel = dualFormatted ? `${primaryFormatted} (${dualFormatted})` : primaryFormatted;

    return {
      primary: primaryFormatted,
      dual: dualFormatted,
      fullLabel,
      rawConverted: converted,
      symbol,
    };
  };

  /**
   * Backward-compatible simple currency string formatter
   */
  const formatCurrency = (amountInXaf: number): string => {
    return formatPrice(amountInXaf, { showDual: false }).primary;
  };

  const t = (key: string): string => {
    return key;
  };

  return (
    <LocaleContext.Provider
      value={{
        language,
        marketRegion,
        currentRegion,
        activeBloc,
        activeBlocConfig,
        showDualCurrency,
        supportedLanguages: SUPPORTED_LANGUAGES,
        supportedRegions: SUPPORTED_REGIONS,
        supportedBlocs: Object.values(TRADE_BLOCS),
        glossary,
        setLanguage,
        setMarketRegion,
        setTradeBloc,
        toggleDualCurrency,
        autoDetectRegionFromPhone,
        formatCurrency,
        formatPrice,
        t,
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}
