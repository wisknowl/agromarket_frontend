import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppLanguage = 'en' | 'fr' | 'pt' | 'es' | 'ja';
export type MarketRegion = 'CM' | 'NG' | 'US' | 'KE' | 'UG' | 'UK';

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

export const SUPPORTED_LANGUAGES = [
  { code: 'en' as const, name: 'English', flag: '🇬🇧' },
  { code: 'fr' as const, name: 'Français', flag: '🇫🇷' },
  { code: 'pt' as const, name: 'Português', flag: '🇵🇹' },
  { code: 'es' as const, name: 'Español', flag: '🇪🇸' },
  { code: 'ja' as const, name: '日本語', flag: '🇯🇵' },
];

export const SUPPORTED_REGIONS = [
  { code: 'CM' as const, name: 'Cameroon', currency: 'XAF', flag: '🇨🇲' },
  { code: 'NG' as const, name: 'Nigeria', currency: 'NGN', flag: '🇳🇬' },
  { code: 'KE' as const, name: 'Kenya', currency: 'KES', flag: '🇰🇪' },
  { code: 'UG' as const, name: 'Uganda', currency: 'UGX', flag: '🇺🇬' },
  { code: 'UK' as const, name: 'United Kingdom', currency: 'GBP', flag: '🇬🇧' },
  { code: 'US' as const, name: 'United States', currency: 'USD', flag: '🇺🇸' },
];

interface LocaleContextType {
  language: AppLanguage;
  marketRegion: MarketRegion;
  currentRegion: (typeof SUPPORTED_REGIONS)[number];
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
  supportedRegions: typeof SUPPORTED_REGIONS;
  glossary: CulturalGlossary;
  setLanguage: (lang: AppLanguage) => Promise<void>;
  setMarketRegion: (region: MarketRegion) => Promise<void>;
  t: (key: string) => string;
}

const GLOSSARY_DICTIONARY: Record<MarketRegion, Record<AppLanguage, CulturalGlossary>> = {
  CM: {
    en: {
      wholesalerLabel: 'Bayam-Sellam (Wholesaler)',
      bulkUnitLabel: 'Crate / Casier',
      coopCreditLabel: 'Njangi Credit Line',
      escrowBadgeText: 'AgroShield Escrow',
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
      escrowBadgeText: 'Garantie Escrow AgroShield',
      makeOfferButtonText: 'Proposer une Offre P2P',
      freshReactionText: '🌱 Récolte Fraîche',
      highDemandReactionText: '🔥 Forte Demande',
      readyToShipReactionText: '📦 Prêt pour Expédition',
      partnerUpReactionText: '🤝 Devenir Partenaire',
    },
    pt: {
      wholesalerLabel: 'Bayam-Sellam (Comerciante)',
      bulkUnitLabel: 'Caixa / Cesta',
      coopCreditLabel: 'Linha de Crédito Njangi',
      escrowBadgeText: 'Garantia AgroShield',
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
      escrowBadgeText: 'Garantía AgroShield',
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
      escrowBadgeText: 'AgroShield 保証',
      makeOfferButtonText: '直接取引の提案を送る',
      freshReactionText: '🌱 新鮮な収穫',
      highDemandReactionText: '🔥 需要急増',
      readyToShipReactionText: '📦 出荷準備完了',
      partnerUpReactionText: '🤝 パートナー提携',
    },
  },
  NG: {
    en: {
      wholesalerLabel: 'Wholesale Commodity Buyer',
      bulkUnitLabel: 'Standard Crate / Bag',
      coopCreditLabel: 'Esusu Cooperative Loan',
      escrowBadgeText: 'AgroMarket Escrow Protection',
      makeOfferButtonText: 'Send Contract Offer',
      freshReactionText: '🌱 Fresh Harvest',
      highDemandReactionText: '🔥 Hot In Market',
      readyToShipReactionText: '📦 Ready for Trucking',
      partnerUpReactionText: '🤝 Partner Up',
    },
    fr: {
      wholesalerLabel: 'Grossiste Commercial',
      bulkUnitLabel: 'Casier / Sac',
      coopCreditLabel: 'Prêt Coopératif Esusu',
      escrowBadgeText: 'Garantie Sécurisée AgroMarket',
      makeOfferButtonText: 'Envoyer une Offre',
      freshReactionText: '🌱 Récolte Fraîche',
      highDemandReactionText: '🔥 Très Demandé',
      readyToShipReactionText: '📦 Prêt au Chargement',
      partnerUpReactionText: '🤝 Partenariat',
    },
    pt: {
      wholesalerLabel: 'Comprador Atacadista',
      bulkUnitLabel: 'Caixa / Saco',
      coopCreditLabel: 'Empréstimo Esusu',
      escrowBadgeText: 'Proteção AgroMarket Escrow',
      makeOfferButtonText: 'Enviar Oferta',
      freshReactionText: '🌱 Colheita Fresca',
      highDemandReactionText: '🔥 Alta Procura',
      readyToShipReactionText: '📦 Pronto para Carga',
      partnerUpReactionText: '🤝 Fazer Parceria',
    },
    es: {
      wholesalerLabel: 'Comprador Mayorista',
      bulkUnitLabel: 'Caja / Saco',
      coopCreditLabel: 'Préstamo Esusu Cooperativo',
      escrowBadgeText: 'Protección AgroMarket Escrow',
      makeOfferButtonText: 'Enviar Oferta',
      freshReactionText: '🌱 Cosecha Fresca',
      highDemandReactionText: '🔥 Alta Demanda',
      readyToShipReactionText: '📦 Listo para Carga',
      partnerUpReactionText: '🤝 Socio Comercial',
    },
    ja: {
      wholesalerLabel: '卸売バイヤー',
      bulkUnitLabel: '木箱 / 袋',
      coopCreditLabel: 'エスス協同ローン',
      escrowBadgeText: 'エスクロー保護',
      makeOfferButtonText: 'オファーを送信',
      freshReactionText: '🌱 新鮮な収穫',
      highDemandReactionText: '🔥 市場で大人気',
      readyToShipReactionText: '📦 積載準備完了',
      partnerUpReactionText: '🤝 パートナー提携',
    },
  },
  KE: {
    en: {
      wholesalerLabel: 'Mama Mboga / Wholesale Trader',
      bulkUnitLabel: 'Debe / Gunia Crate',
      coopCreditLabel: 'Chama Sacco Credit',
      escrowBadgeText: 'AgroShield M-Pesa Escrow',
      makeOfferButtonText: 'Send Deal Card',
      freshReactionText: '🌱 Shamba Fresh',
      highDemandReactionText: '🔥 In High Demand',
      readyToShipReactionText: '📦 Ready for Logistics',
      partnerUpReactionText: '🤝 Business Partner',
    },
    fr: {
      wholesalerLabel: 'Mama Mboga (Grossiste)',
      bulkUnitLabel: 'Debe / Caisse',
      coopCreditLabel: 'Crédit Sacco / Chama',
      escrowBadgeText: 'Garantie Escrow M-Pesa',
      makeOfferButtonText: 'Envoyer Carte d\'Offre',
      freshReactionText: '🌱 Frais de la Ferme',
      highDemandReactionText: '🔥 Très Recherché',
      readyToShipReactionText: '📦 Prêt pour Transport',
      partnerUpReactionText: '🤝 Partenariat',
    },
    pt: {
      wholesalerLabel: 'Mama Mboga (Atacadista)',
      bulkUnitLabel: 'Caixa Debe / Saco',
      coopCreditLabel: 'Crédito Sacco Chama',
      escrowBadgeText: 'Garantia M-Pesa Escrow',
      makeOfferButtonText: 'Enviar Proposta',
      freshReactionText: '🌱 Fresco da Fazenda',
      highDemandReactionText: '🔥 Grande Procura',
      readyToShipReactionText: '📦 Pronto para Envio',
      partnerUpReactionText: '🤝 Parceiro Comercial',
    },
    es: {
      wholesalerLabel: 'Mama Mboga / Mayorista',
      bulkUnitLabel: 'Caja Debe',
      coopCreditLabel: 'Crédito Cooperativo Chama',
      escrowBadgeText: 'Garantía Escrow M-Pesa',
      makeOfferButtonText: 'Enviar Oferta',
      freshReactionText: '🌱 Recién Cosechado',
      highDemandReactionText: '🔥 Muy Solicitado',
      readyToShipReactionText: '📦 Listo para Envío',
      partnerUpReactionText: '🤝 Socio Comercial',
    },
    ja: {
      wholesalerLabel: 'ママ・ンボガ（卸売業者）',
      bulkUnitLabel: 'デベ / クレート',
      coopCreditLabel: 'チャマ協同組合融資',
      escrowBadgeText: 'M-Pesa エスクロー保護',
      makeOfferButtonText: '取引カードを送る',
      freshReactionText: '🌱 農場直送の新鮮さ',
      highDemandReactionText: '🔥 注文殺到中',
      readyToShipReactionText: '📦 輸送手配完了',
      partnerUpReactionText: '🤝 ビジネス提携',
    },
  },
  US: {
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
  UG: {
    en: {
      wholesalerLabel: 'Pan-African Produce Merchant',
      bulkUnitLabel: 'Bulk Crate / Sack',
      coopCreditLabel: 'Cross-Border Agri-Fund',
      escrowBadgeText: 'Flutterwave Multi-Rail Escrow',
      makeOfferButtonText: 'Initiate P2P Deal',
      freshReactionText: '🌱 Prime Harvest',
      highDemandReactionText: '🔥 Trending In Market',
      readyToShipReactionText: '📦 Ready for Transit',
      partnerUpReactionText: '🤝 Cross-Border Partner',
    },
    fr: {
      wholesalerLabel: 'Négociant Panafricain',
      bulkUnitLabel: 'Caisse / Sac Vrac',
      coopCreditLabel: 'Fonds Agricole Transfrontalier',
      escrowBadgeText: 'Escrow Multi-Réseau Flutterwave',
      makeOfferButtonText: 'Initier un Deal P2P',
      freshReactionText: '🌱 Récolte de Premier Choix',
      highDemandReactionText: '🔥 Tendance du Marché',
      readyToShipReactionText: '📦 Prêt pour Transit',
      partnerUpReactionText: '🤝 Partenaire Régional',
    },
    pt: {
      wholesalerLabel: 'Comerciante Pan-Africano',
      bulkUnitLabel: 'Caixa / Saco a Granel',
      coopCreditLabel: 'Fundo Agrícola Transfronteiriço',
      escrowBadgeText: 'Escrow Multi-Rail Flutterwave',
      makeOfferButtonText: 'Iniciar Negociação P2P',
      freshReactionText: '🌱 Colheita de Primeira',
      highDemandReactionText: '🔥 Em Alta no Mercado',
      readyToShipReactionText: '📦 Pronto para Trânsito',
      partnerUpReactionText: '🤝 Parceiro Transfronteiriço',
    },
    es: {
      wholesalerLabel: 'Comerciante Panafricano',
      bulkUnitLabel: 'Caja / Saco a Granel',
      coopCreditLabel: 'Fondo Agrícola Transfronterizo',
      escrowBadgeText: 'Escrow Multi-Rail Flutterwave',
      makeOfferButtonText: 'Iniciar Acuerdo P2P',
      freshReactionText: '🌱 Cosecha de Primera Calidad',
      highDemandReactionText: '🔥 Tendencia de Mercado',
      readyToShipReactionText: '📦 Listo para Tránsito',
      partnerUpReactionText: '🤝 Socio Transfronterizo',
    },
    ja: {
      wholesalerLabel: '全アフリカ農産物商人',
      bulkUnitLabel: '大口木箱 / 麻袋',
      coopCreditLabel: '越境農業支援ファンド',
      escrowBadgeText: 'Flutterwave マルチレールエスクロー',
      makeOfferButtonText: 'P2P 取引を開始する',
      freshReactionText: '🌱 最高級の収穫',
      highDemandReactionText: '🔥 市場トレンド',
      readyToShipReactionText: '📦 輸送準備完了',
      partnerUpReactionText: '🤝 越境パートナー提携',
    },
  },
  UK: {
    en: {
      wholesalerLabel: 'Wholesale Produce Distributor',
      bulkUnitLabel: 'Bushel / Crate',
      coopCreditLabel: 'Agricultural Credit Facility',
      escrowBadgeText: 'UK Clearing Escrow Trust',
      makeOfferButtonText: 'Submit Purchase Proposal',
      freshReactionText: '🌱 Farm Fresh Produce',
      highDemandReactionText: '🔥 High Market Value',
      readyToShipReactionText: '📦 Ready for Haulage',
      partnerUpReactionText: '🤝 Trade Partner',
    },
    fr: {
      wholesalerLabel: 'Distributeur de Produits Agricoles',
      bulkUnitLabel: 'Caisse / Boisseau',
      coopCreditLabel: 'Facilité de Crédit Agricole',
      escrowBadgeText: 'Fiducie Escrow Sécurisée',
      makeOfferButtonText: 'Soumettre une Proposition',
      freshReactionText: '🌱 Produits Frais de Ferme',
      highDemandReactionText: '🔥 Forte Valeur Marchande',
      readyToShipReactionText: '📦 Prêt pour le Transport',
      partnerUpReactionText: '🤝 Partenaire Commercial',
    },
    pt: {
      wholesalerLabel: 'Distribuidor Atacadista',
      bulkUnitLabel: 'Caixa / Alqueire',
      coopCreditLabel: 'Facilidade de Crédito Agrícola',
      escrowBadgeText: 'Custódia Fiduciária Escrow',
      makeOfferButtonText: 'Enviar Proposta Comercial',
      freshReactionText: '🌱 Produtos Frescos do Campo',
      highDemandReactionText: '🔥 Alto Valor de Mercado',
      readyToShipReactionText: '📦 Pronto para Carga',
      partnerUpReactionText: '🤝 Parceiro Comercial',
    },
    es: {
      wholesalerLabel: 'Distribuidor Mayorista',
      bulkUnitLabel: 'Caja / Fanega',
      coopCreditLabel: 'Facilidad de Crédito Agrícola',
      escrowBadgeText: 'Fideicomiso Escrow',
      makeOfferButtonText: 'Enviar Propuesta de Compra',
      freshReactionText: '🌱 Fresco del Campo',
      highDemandReactionText: '🔥 Alto Valor Comercial',
      readyToShipReactionText: '📦 Listo para Transporte',
      partnerUpReactionText: '🤝 Socio Comercial',
    },
    ja: {
      wholesalerLabel: '農産物卸売流通商社',
      bulkUnitLabel: 'クレート / ブッシェル',
      coopCreditLabel: '農業信用融資ファシリティ',
      escrowBadgeText: '英国信託エスクロー保護',
      makeOfferButtonText: '購入提案書を提出',
      freshReactionText: '🌱 農場直送の新鮮農産物',
      highDemandReactionText: '🔥 高い市場価値',
      readyToShipReactionText: '📦 トラック輸送準備完了',
      partnerUpReactionText: '🤝 認定貿易パートナー',
    },
  },
};

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>('en');
  const [marketRegion, setMarketRegionState] = useState<MarketRegion>('CM');

  useEffect(() => {
    (async () => {
      try {
        const savedLang = await AsyncStorage.getItem('@agrom_lang');
        const savedRegion = await AsyncStorage.getItem('@agrom_region');
        if (savedLang) setLanguageState(savedLang as AppLanguage);
        if (savedRegion) setMarketRegionState(savedRegion as MarketRegion);
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

  const setMarketRegion = async (newRegion: MarketRegion) => {
    setMarketRegionState(newRegion);
    try {
      await AsyncStorage.setItem('@agrom_region', newRegion);
    } catch (e) {}
  };

  const currentRegionGlossary = GLOSSARY_DICTIONARY[marketRegion] || GLOSSARY_DICTIONARY.CM;
  const glossary = currentRegionGlossary[language] || currentRegionGlossary.en;
  const currentRegion = SUPPORTED_REGIONS.find((r) => r.code === marketRegion) || SUPPORTED_REGIONS[0];

  const t = (key: string): string => {
    // Quick translator helper
    return key;
  };

  return (
    <LocaleContext.Provider
      value={{
        language,
        marketRegion,
        currentRegion,
        supportedLanguages: SUPPORTED_LANGUAGES,
        supportedRegions: SUPPORTED_REGIONS,
        glossary,
        setLanguage,
        setMarketRegion,
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
