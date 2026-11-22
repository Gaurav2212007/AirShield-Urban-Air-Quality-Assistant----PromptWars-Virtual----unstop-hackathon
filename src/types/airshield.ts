export type AqiCategoryKey =
  | 'good'
  | 'moderate'
  | 'sensitive'
  | 'unhealthy'
  | 'very_unhealthy'
  | 'hazardous';

export type HourExposureStatus =
  | 'Best Window'
  | 'Use Caution'
  | 'Limit Exposure'
  | 'Lockdown Hour';

export type DataSourceKind = 'live' | 'cached' | 'demo';

export type Vulnerability =
  | 'kids'
  | 'elderly'
  | 'asthma_copd'
  | 'pregnant'
  | 'pets'
  | 'none';

export type AirPurifierStatus = 'available' | 'none';
export type CookingFuel = 'gas_lpg' | 'induction_electric' | 'other';
export type WindowSealing = 'poor' | 'average' | 'good';
export type CommuteMode = 'walking_two_wheeler' | 'public_transit' | 'car' | 'wfh';

export interface Location {
  id: string;
  name: string;
  region?: string;
  country: string;
  countryCode?: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface AqiObservation {
  time: string;
  usAqi: number | null;
  pm25: number | null;
  pm10: number | null;
  o3: number | null;
  no2: number | null;
}

export interface HourlyForecastPoint {
  time: string;
  hourLabel: string;
  dayLabel: string;
  usAqi: number;
  pm25: number;
  pm10: number;
  o3: number;
  no2: number;
  categoryKey: AqiCategoryKey;
  status: HourExposureStatus;
  isCurrentHour: boolean;
  isBestWindow: boolean;
  isPeakHour: boolean;
}

export interface AirQualityDataset {
  location: Location;
  current: AqiObservation;
  hourly: HourlyForecastPoint[];
  source: DataSourceKind;
  fetchedAt: string;
  timezone: string;
  isOfflineFallback?: boolean;
}

export interface HomeSetup {
  airPurifier: AirPurifierStatus;
  cookingFuel: CookingFuel;
  windowSealing: WindowSealing;
  hasBalcony: boolean;
  hasIndoorPlants: boolean;
}

export interface FamilyProfile {
  location: Location;
  vulnerabilities: Vulnerability[];
  home: HomeSetup;
  commuteMode: CommuteMode;
  updatedAt: string;
}

export interface SafeWindow {
  start: string;
  end: string;
  aqi: number;
  label: string;
  reason: string;
  recommendedActivities: string[];
}

export interface LockdownHour {
  start: string;
  end: string;
  aqi: number;
  reason: string;
  avoid: string[];
}

export interface IndoorHack {
  title: string;
  cost: 'free' | 'low' | 'medium';
  difficulty: 'easy' | 'moderate';
  steps: string[];
  whyItHelps: string;
  personalizedReason: string;
  safetyNote: string;
}

export interface CommuteRecommendation {
  title: string;
  priority: 'high' | 'medium' | 'low';
  action: string;
  reason: string;
}

export interface MicroHabit {
  title: string;
  action: string;
  benefit: string;
}

export interface TopPriority {
  rank: number;
  action: string;
  reason: string;
}

export interface OverallAssessment {
  headline: string;
  summary: string;
  priority: 'low' | 'moderate' | 'high' | 'critical';
}

export interface AirPlan {
  overallAssessment: OverallAssessment;
  safeWindows: SafeWindow[];
  lockdownHours: LockdownHour[];
  indoorHacks: IndoorHack[];
  commuteRecommendations: CommuteRecommendation[];
  microHabits: MicroHabit[];
  topPriorities: TopPriority[];
  generatedBy?: 'gemini' | 'deterministic';
  generatedAt?: string;
}

export interface WindowSummary {
  start: string;
  end: string;
  startLabel: string;
  endLabel: string;
  avgAqi: number;
  maxAqi: number;
  minAqi: number;
}

export interface ReadinessFactor {
  label: string;
  impact: string;
  status: 'positive' | 'neutral' | 'risk';
}

export interface ForecastAnalysis {
  currentAqi: number;
  currentCategory: AqiCategoryKey;
  minAqi: number;
  maxAqi: number;
  avgAqi: number;
  bestWindow: WindowSummary;
  worstWindow: WindowSummary;
  hasCleanWindow: boolean;
  trendDirection: 'rising' | 'falling' | 'steady' | 'inversion_spike';
  trendNarrative: string;
  windowNarrative: string;
  readinessScore: number;
  readinessSummary: string;
  readinessFactors: ReadinessFactor[];
  nextBestAction: string;
  exposureBudget: {
    recommendedMaxOutdoorMinutes: number;
    statusLabel: string;
    guidance: string;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  error?: boolean;
}
