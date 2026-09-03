// agromarket Brand Design Tokens (from brand guide v2)
// Core Philosophy: Two people making a fair trade — "From farm to hand / Du champ à la main"

export const BrandColors = {
  // Primary Palette
  canopy: '#173A20',       // The field at dusk. Primary brand & dark surfaces/headers
  canopyDeep: '#0E2515',   // Deep forest background
  cultivated: '#4E8B3F',   // New growth. Secondary actions, active tab states, grower half of mark
  gold: '#E2A63C',         // Harvest Gold. Primary CTAs, prices, gold credit tier, star accents
  goldDim: '#C68F30',      // Hover / pressed state for gold
  soil: '#7A4A2D',         // Tilled Soil. Earth borders, bronze tier, stem of mark
  parchment: '#F6EEDD',    // Threshed grain. Warm soft card & chip surface
  parchmentDim: '#EAE0C7', // Warm border and input strokes
  espresso: '#241A12',     // Roasted bean. Primary high-contrast body & title text on light
  clay: '#B54A34',         // Overripe clay. The SINGLE alert color (errors, overdue, out-of-stock)
  clayDim: '#9C3F2C',      // Clay dark text variant

  // Tier Badges & Metallics
  silver: '#9C9284',       // Silver farmer tier
  platinum: '#D7D8D0',     // Platinum farmer tier
  bronze: '#7A4A2D',       // Bronze farmer tier (same as soil)

  // Canvas & Surfaces (Pure White remains the app's primary white area)
  white: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceSecondary: '#F6EEDD',
  card: '#FFFFFF',
  cardBorder: '#EAE0C7',
  divider: '#EAE0C7',

  // Semantic mappings
  primary: '#173A20',      // Canopy
  secondary: '#E2A63C',    // Harvest Gold
  accent: '#4E8B3F',       // Cultivated Green
  background: '#FFFFFF',   // Pure White Canvas
  headerFooterColor: '#173A20',

  text: {
    primary: '#241A12',    // Espresso
    secondary: '#5C5245',  // Medium warm brown
    muted: '#9C9284',      // Silver/grey muted text
    light: '#F6EEDD',      // Parchment text for dark surfaces
    white: '#FFFFFF',
    gold: '#E2A63C',
    cultivated: '#4E8B3F',
    clay: '#B54A34',
  },

  border: '#EAE0C7',
  borderDark: '#7A4A2D',
  success: '#4E8B3F',      // Cultivated
  error: '#B54A34',        // Clay
  warning: '#E2A63C',      // Harvest Gold
  info: '#4E8B3F',
};

export const Radii = {
  pill: 9999, // All buttons, action tags, badges
  card: 12,   // All product cards, profile containers
  input: 10,  // Form fields & search bars
  chip: 8,    // Filter chips
  sm: 6,      // Small tags
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
    shadowColor: '#241A12',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  card: {
    shadowColor: '#241A12',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 2,
  },
};

export default BrandColors;