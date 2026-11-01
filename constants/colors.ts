// Agrom Brand Design Tokens (Botanical-Fintech Palette)
// Core Philosophy: Two people making a fair trade — "From farm to hand / Du champ à la main"

export const BrandColors = {
  // Primary Palette
  canopy: '#173A20',       // Deep Canopy green for authority titles & dark badges
  canopyDeep: '#0E2515',   // Deep forest accent
  cultivated: '#4E8B3F',   // Cultivated Green — primary interactive actions, active tabs, icons
  gold: '#E2A63C',         // Harvest Gold — badges, highlights, patron stars
  goldDim: '#C68F30',      // Hover / pressed state for gold
  harvest: '#E2A63C',      // Harvest Amber/Gold accent
  harvestDim: '#C68F30',   // Harvest pressed state
  soil: '#4E8B3F',         // Updated from earthy brown to Cultivated Green for unified botanical icons/borders
  soilEarth: '#7A4A2D',    // Reserved strictly for Bronze tier badge
  mint: '#EEF8F1',         // Fresh Botanical Mint — secondary cards, inputs, & chip surfaces
  mintBorder: '#CCEBD5',   // Crisp Sage Green — card borders, dividers, & input strokes
  parchment: '#EEF8F1',    // Mapped to Fresh Botanical Mint (#EEF8F1) across all screens
  parchmentDim: '#CCEBD5', // Mapped to Crisp Sage Border (#CCEBD5) across all screens
  espresso: '#241A12',     // High-contrast body & title text on light surfaces
  clay: '#B54A34',         // Alert / error / out-of-stock color
  clayDim: '#9C3F2C',      // Clay dark text variant

  // Tier Badges & Metallics
  silver: '#9C9284',       // Silver farmer tier
  platinum: '#D7D8D0',     // Platinum farmer tier
  bronze: '#7A4A2D',       // Bronze farmer tier

  // Canvas & Surfaces (Pure Crisp White + Fresh Botanical Mint)
  white: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceSecondary: '#EEF8F1',
  card: '#FFFFFF',
  cardBorder: '#CCEBD5',
  divider: '#CCEBD5',

  // Semantic mappings
  primary: '#4E8B3F',      // Cultivated Green
  secondary: '#E2A63C',    // Harvest Gold
  accent: '#4E8B3F',       // Cultivated Green
  background: '#FFFFFF',   // Pure White Canvas
  headerFooterColor: '#FFFFFF',

  text: {
    primary: '#241A12',    // Espresso
    secondary: '#5C5245',  // Medium neutral-warm slate
    tertiary: '#8E8271',   // Muted label text
    muted: '#8E8271',      // Muted placeholder text
    light: '#EEF8F1',      // Light mint text for dark canopy surfaces
    white: '#FFFFFF',
    gold: '#E2A63C',
    cultivated: '#4E8B3F',
    clay: '#B54A34',
  },

  border: '#CCEBD5',
  borderDark: '#4E8B3F',
  success: '#4E8B3F',      // Cultivated
  error: '#B54A34',        // Clay
  warning: '#E2A63C',      // Harvest Gold
  info: '#4E8B3F',
};

export const Radii = {
  pill: 9999, // All buttons, action tags, badges
  card: 16,   // All product cards, profile containers
  input: 12,  // Form fields & search bars
  chip: 10,   // Filter chips
  sm: 8,      // Small tags
};

export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  subtle: {
    shadowColor: '#173A20',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  card: {
    shadowColor: '#173A20',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 2,
  },
};

export default BrandColors;
