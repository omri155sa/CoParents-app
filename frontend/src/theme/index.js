export const colors = {
  // Primary palette
  primary: '#4A6FA5',
  primaryDark: '#2E4F82',
  primaryLight: '#7499CB',
  primaryFaded: '#EBF0F8',

  // Secondary / accent
  accent: '#FF7043',
  accentLight: '#FFCCBC',

  // Semantic
  success: '#43A047',
  successLight: '#E8F5E9',
  warning: '#FB8C00',
  warningLight: '#FFF3E0',
  error: '#E53935',
  errorLight: '#FFEBEE',
  info: '#039BE5',
  infoLight: '#E1F5FE',

  // Neutrals
  white: '#FFFFFF',
  background: '#F5F7FA',
  surface: '#FFFFFF',
  border: '#E0E6EF',
  divider: '#F0F2F5',

  // Text
  textPrimary: '#1A2233',
  textSecondary: '#5A6A7E',
  textTertiary: '#9BA8B5',
  textInverted: '#FFFFFF',

  // Specific
  parent1: '#4A6FA5',
  parent2: '#E57373',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '600' },
  h4: { fontSize: 16, fontWeight: '600' },
  body: { fontSize: 15, fontWeight: '400' },
  bodySmall: { fontSize: 13, fontWeight: '400' },
  caption: { fontSize: 12, fontWeight: '400' },
  label: { fontSize: 13, fontWeight: '600', letterSpacing: 0.3 },
  button: { fontSize: 16, fontWeight: '600', letterSpacing: 0.2 },
};

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
};
