export interface MarketHub {
  id: string;
  name: string;
  type: 'WHOLESALE_MARKET' | 'BUS_AGENCY' | 'COOP_DEPOT';
  city: string;
  region: string;
}

export interface CityCorridor {
  name: string;
  region: string;
  isMajor: boolean;
  hubs: MarketHub[];
  quartiers: string[];
}

export const CAMEROON_DELIVERY_CORRIDORS: CityCorridor[] = [
  {
    name: 'Douala',
    region: 'Littoral',
    isMajor: true,
    hubs: [
      { id: 'dla-sandaga', name: 'Marché Sandaga (Fruit & Vegetable Terminal)', type: 'WHOLESALE_MARKET', city: 'Douala', region: 'Littoral' },
      { id: 'dla-mboppi', name: 'Marché Mboppi', type: 'WHOLESALE_MARKET', city: 'Douala', region: 'Littoral' },
      { id: 'dla-deido', name: 'Marché Deido', type: 'WHOLESALE_MARKET', city: 'Douala', region: 'Littoral' },
      { id: 'dla-bonaberi', name: 'Quai Bonabéri / Marché Rail', type: 'WHOLESALE_MARKET', city: 'Douala', region: 'Littoral' },
      { id: 'dla-touristique', name: 'Agence Touristique Express (Bessengue Depot)', type: 'BUS_AGENCY', city: 'Douala', region: 'Littoral' },
      { id: 'dla-guarantee', name: 'Agence Guarantee Express (Akwa Depot)', type: 'BUS_AGENCY', city: 'Douala', region: 'Littoral' },
      { id: 'dla-buca', name: 'Agence Buca Voyages (Bessengue)', type: 'BUS_AGENCY', city: 'Douala', region: 'Littoral' },
    ],
    quartiers: [
      'Bonapriso',
      'Akwa',
      'Bonanjo',
      'Deido',
      'Makepe',
      'Bonamoussadi',
      'Bali',
      'Bépanda',
      'Logbessou',
      'Denver',
      'Kotto',
      'Ndogbong',
      'Yassa',
      'Bonabéri',
    ],
  },
  {
    name: 'Yaoundé',
    region: 'Centre',
    isMajor: true,
    hubs: [
      { id: 'yde-mokolo', name: 'Marché Mokolo (Fresh Food Wholesale Wing)', type: 'WHOLESALE_MARKET', city: 'Yaoundé', region: 'Centre' },
      { id: 'yde-mfoundi', name: 'Marché Mfoundi (Central Food Depot)', type: 'WHOLESALE_MARKET', city: 'Yaoundé', region: 'Centre' },
      { id: 'yde-8eme', name: 'Marché 8ème', type: 'WHOLESALE_MARKET', city: 'Yaoundé', region: 'Centre' },
      { id: 'yde-touristique', name: 'Agence Touristique Express (Mvan Depot)', type: 'BUS_AGENCY', city: 'Yaoundé', region: 'Centre' },
      { id: 'yde-guarantee', name: 'Agence Guarantee Express (Mvan Depot)', type: 'BUS_AGENCY', city: 'Yaoundé', region: 'Centre' },
      { id: 'yde-buca', name: 'Agence Buca Voyages (Mvan Terminal)', type: 'BUS_AGENCY', city: 'Yaoundé', region: 'Centre' },
    ],
    quartiers: [
      'Bastos',
      'Biyem-Assi',
      'Mendong',
      'Omnisport',
      'Nlongkak',
      'Essos',
      'Odza',
      'Santa Barbara',
      'Tsinga',
      'Ekounou',
      'Mimboman',
      'Emana',
      'Ngousso',
    ],
  },
  {
    name: 'Bafoussam',
    region: 'West',
    isMajor: true,
    hubs: [
      { id: 'bfm-central', name: 'Marché Central Bafoussam (Wholesale Hall)', type: 'WHOLESALE_MARKET', city: 'Bafoussam', region: 'West' },
      { id: 'bfm-marche-a', name: 'Marché A Bafoussam', type: 'WHOLESALE_MARKET', city: 'Bafoussam', region: 'West' },
      { id: 'bfm-general', name: 'Agence General Express Voyages (Bafoussam)', type: 'BUS_AGENCY', city: 'Bafoussam', region: 'West' },
    ],
    quartiers: ['Djeleng', 'Tougang', 'Banengo', 'Famla', 'Kamkop', 'Haoussa'],
  },
  {
    name: 'Foumbot',
    region: 'West',
    isMajor: true,
    hubs: [
      { id: 'fbt-caplame', name: 'CAPLAME Foumbot Central Agro-Depot', type: 'COOP_DEPOT', city: 'Foumbot', region: 'West' },
      { id: 'fbt-marche', name: 'Marché Agricole Foumbot', type: 'WHOLESALE_MARKET', city: 'Foumbot', region: 'West' },
    ],
    quartiers: ['Centre Urbain', 'Kouoptamo Road', 'Foumban Axis'],
  },
  {
    name: 'Buea',
    region: 'Southwest',
    isMajor: true,
    hubs: [
      { id: 'bua-muea', name: 'Muea Wholesale Food Market', type: 'WHOLESALE_MARKET', city: 'Buea', region: 'Southwest' },
      { id: 'bua-mile17', name: 'Mile 17 Motor Park & Agro-Agency', type: 'BUS_AGENCY', city: 'Buea', region: 'Southwest' },
      { id: 'bua-soppo', name: 'Great Soppo Market', type: 'WHOLESALE_MARKET', city: 'Buea', region: 'Southwest' },
    ],
    quartiers: ['Molyko', 'Great Soppo', 'Mile 16', 'Mile 17', 'Bokwango', 'Bonduma', 'Federal Quarters', 'Buea Town'],
  },
  {
    name: 'Limbe',
    region: 'Southwest',
    isMajor: true,
    hubs: [
      { id: 'lmb-mile4', name: 'Mile 4 Market & Junction Depot', type: 'WHOLESALE_MARKET', city: 'Limbe', region: 'Southwest' },
      { id: 'lmb-halfmile', name: 'Half Mile Market Limbe', type: 'WHOLESALE_MARKET', city: 'Limbe', region: 'Southwest' },
      { id: 'lmb-downbeach', name: 'Down Beach Depot', type: 'WHOLESALE_MARKET', city: 'Limbe', region: 'Southwest' },
    ],
    quartiers: ['Mile 4', 'Half Mile', 'Down Beach', 'Bota', 'New Town', 'Ngeme', 'Mabeta'],
  },
  {
    name: 'Bamenda',
    region: 'Northwest',
    isMajor: false,
    hubs: [
      { id: 'bda-main', name: 'Bamenda Main Food Market', type: 'WHOLESALE_MARKET', city: 'Bamenda', region: 'Northwest' },
      { id: 'bda-mile2', name: 'Mile 2 Food Park Depot', type: 'BUS_AGENCY', city: 'Bamenda', region: 'Northwest' },
    ],
    quartiers: ['Commercial Avenue', 'Up Station', 'Nkwen', 'Mile 2', 'Mile 4'],
  },
  {
    name: 'Kribi',
    region: 'South',
    isMajor: false,
    hubs: [
      { id: 'krb-central', name: 'Marché Central Kribi', type: 'WHOLESALE_MARKET', city: 'Kribi', region: 'South' },
      { id: 'krb-port', name: 'Kribi Deep Sea Port Agency Depot', type: 'BUS_AGENCY', city: 'Kribi', region: 'South' },
    ],
    quartiers: ['Mboa Manga', 'Dombé', 'Afan Mabé', 'Tara Plage'],
  },
];

export interface DeliveryReachConfig {
  supportedCities: string[];
  supportedHubs: string[];
  supportedQuartiers: string[];
  customHubOrDepot?: string;
  allowFarmGatePickup: boolean;
}

export function formatDeliveryReachSummary(config: DeliveryReachConfig): string {
  const parts: string[] = [];

  if (config.supportedCities.length > 0) {
    parts.push(`Corridors: ${config.supportedCities.join(', ')}`);
  }
  if (config.supportedHubs.length > 0) {
    parts.push(`Hubs: ${config.supportedHubs.join(', ')}`);
  }
  if (config.supportedQuartiers.length > 0) {
    parts.push(`Quartiers: ${config.supportedQuartiers.join(', ')}`);
  }
  if (config.customHubOrDepot && config.customHubOrDepot.trim()) {
    parts.push(`Depot: ${config.customHubOrDepot.trim()}`);
  }
  if (config.allowFarmGatePickup) {
    parts.push('Farm-Gate Pickup');
  }

  return parts.join(' • ');
}

export function parseDeliveryReach(dispatchStr?: string | null): DeliveryReachConfig {
  const config: DeliveryReachConfig = {
    supportedCities: ['Douala', 'Yaoundé'],
    supportedHubs: [],
    supportedQuartiers: [],
    customHubOrDepot: '',
    allowFarmGatePickup: true,
  };

  if (!dispatchStr) return config;

  const matchedCities = CAMEROON_DELIVERY_CORRIDORS.map((c) => c.name).filter((city) =>
    dispatchStr.toLowerCase().includes(city.toLowerCase())
  );
  if (matchedCities.length > 0) {
    config.supportedCities = matchedCities;
  }

  const allHubs = CAMEROON_DELIVERY_CORRIDORS.flatMap((c) => c.hubs);
  config.supportedHubs = allHubs
    .filter((h) => dispatchStr.toLowerCase().includes(h.name.toLowerCase()) || dispatchStr.toLowerCase().includes(h.id.toLowerCase()))
    .map((h) => h.name);

  if (dispatchStr.toLowerCase().includes('farm-gate')) {
    config.allowFarmGatePickup = true;
  }

  return config;
}

