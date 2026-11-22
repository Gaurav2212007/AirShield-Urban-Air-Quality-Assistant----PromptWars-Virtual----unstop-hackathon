import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  buildDemoAirQualityDataset,
  DEMO_FAMILY_PROFILE,
  DEMO_LOCATION,
} from '../data/demoData';
import { fetchAirQuality } from '../services/aqiService';
import {
  askAirCoach,
  buildAirCoachContext,
  generateDeterministicCoachAnswer,
  generatePersonalizedPlan,
} from '../services/geminiService';
import type {
  AirPlan,
  AirQualityDataset,
  ChatMessage,
  FamilyProfile,
  ForecastAnalysis,
  HourlyForecastPoint,
  Location,
} from '../types/airshield';
import { generateDeterministicPlan } from '../utils/fallbackPlanEngine';
import { analyzeForecast } from '../utils/forecastAnalyzer';

const PROFILE_STORAGE_KEY = 'airshield_family_profile_v1';

export type AppViewMode = 'onboarding' | 'wizard' | 'dashboard';

function loadSavedProfile(): FamilyProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FamilyProfile;
    if (
      parsed &&
      parsed.location &&
      typeof parsed.location.latitude === 'number' &&
      Array.isArray(parsed.vulnerabilities) &&
      parsed.home &&
      parsed.commuteMode
    ) {
      return parsed;
    }
  } catch {
    // Ignore invalid storage
  }
  return null;
}

function saveProfile(profile: FamilyProfile): void {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore storage quota errors
  }
}

export function useAirShield() {
  const initialSavedProfile = useMemo(() => loadSavedProfile(), []);

  const [viewMode, setViewMode] = useState<AppViewMode>(
    initialSavedProfile ? 'dashboard' : 'onboarding'
  );
  const [profile, setProfile] = useState<FamilyProfile>(
    initialSavedProfile ?? DEMO_FAMILY_PROFILE
  );
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [rawDataset, setRawDataset] = useState<AirQualityDataset | null>(null);
  const [isAqiLoading, setIsAqiLoading] = useState<boolean>(false);
  const [aqiWarning, setAqiWarning] = useState<string | null>(null);

  const [plan, setPlan] = useState<AirPlan | null>(null);
  const [isPlanLoading, setIsPlanLoading] = useState<boolean>(false);
  const [planWarning, setPlanWarning] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isCoachTyping, setIsCoachTyping] = useState<boolean>(false);
  const [coachError, setCoachError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Track latest plan request id without aborting signals
  const planRequestIdRef = useRef<number>(0);
  // Prevent duplicate in-flight Air Coach submissions synchronously
  const isSendingCoachRef = useRef<boolean>(false);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const computedForecast = useMemo<{
    dataset: AirQualityDataset;
    analysis: ForecastAnalysis;
    hourly: HourlyForecastPoint[];
  } | null>(() => {
    if (!rawDataset) return null;
    const { analysis, annotatedHourly } = analyzeForecast(rawDataset, profile);
    return {
      dataset: {
        ...rawDataset,
        hourly: annotatedHourly,
      },
      analysis,
      hourly: annotatedHourly,
    };
  }, [rawDataset, profile]);

  const loadLiveAqi = useCallback(
    async (location: Location, forceRefresh = false) => {
      setIsAqiLoading(true);
      setAqiWarning(null);
      const { dataset, warning } = await fetchAirQuality(location, { forceRefresh });
      setRawDataset(dataset);
      if (warning) {
        setAqiWarning(warning);
      }
      setIsAqiLoading(false);
    },
    []
  );

  // If user already had a saved profile on load, fetch live air data automatically
  useEffect(() => {
    if (initialSavedProfile && !rawDataset && !isDemoMode) {
      void loadLiveAqi(initialSavedProfile.location, false);
    }
  }, [initialSavedProfile, rawDataset, isDemoMode, loadLiveAqi]);

  // Regenerate personalized plan whenever dataset or profile changes in dashboard
  useEffect(() => {
    if (viewMode !== 'dashboard' || !computedForecast) return;

    const reqId = ++planRequestIdRef.current;
    const { dataset, analysis } = computedForecast;
    setIsPlanLoading(true);
    setPlanWarning(null);

    generatePersonalizedPlan(dataset, profile, analysis)
      .then((result) => {
        if (planRequestIdRef.current === reqId) {
          setPlan(result.plan);
          setPlanWarning(result.warning ?? null);
          setIsPlanLoading(false);
        }
      })
      .catch(() => {
        if (planRequestIdRef.current === reqId) {
          setPlan(generateDeterministicPlan(dataset, profile, analysis));
          setPlanWarning(
            'AI plan synthesis was interrupted. Using AirShield’s deterministic recommendation engine.'
          );
          setIsPlanLoading(false);
        }
      });
  }, [viewMode, computedForecast, profile]);

  const activateDemoMode = useCallback(() => {
    const demoProfile: FamilyProfile = {
      ...DEMO_FAMILY_PROFILE,
      updatedAt: new Date().toISOString(),
    };
    setIsDemoMode(true);
    setProfile(demoProfile);
    setAqiWarning(null);
    setRawDataset(buildDemoAirQualityDataset(DEMO_LOCATION, false));
    setMessages([]);
    setCoachError(null);
    setViewMode('dashboard');
  }, []);

  const toggleDemoMode = useCallback(
    (enable: boolean) => {
      if (enable) {
        setIsDemoMode(true);
        setAqiWarning(null);
        setRawDataset(buildDemoAirQualityDataset(profile.location, false));
      } else {
        setIsDemoMode(false);
        void loadLiveAqi(profile.location, true);
      }
    },
    [profile.location, loadLiveAqi]
  );

  const selectLocation = useCallback(
    (location: Location) => {
      const updatedProfile: FamilyProfile = {
        ...profile,
        location,
        updatedAt: new Date().toISOString(),
      };
      setProfile(updatedProfile);
      saveProfile(updatedProfile);
      setIsDemoMode(false);
      setMessages([]);
      setCoachError(null);
      void loadLiveAqi(location, false);
    },
    [profile, loadLiveAqi]
  );

  const updateFamilyProfile = useCallback(
    (nextProfile: FamilyProfile) => {
      const stamped: FamilyProfile = {
        ...nextProfile,
        updatedAt: new Date().toISOString(),
      };
      const locationChanged =
        stamped.location.latitude !== profile.location.latitude ||
        stamped.location.longitude !== profile.location.longitude ||
        stamped.location.name !== profile.location.name;

      setProfile(stamped);
      saveProfile(stamped);
      setViewMode('dashboard');

      if (isDemoMode && !locationChanged) {
        return;
      }

      if (locationChanged || !rawDataset) {
        setIsDemoMode(false);
        void loadLiveAqi(stamped.location, false);
      }
    },
    [profile.location, isDemoMode, rawDataset, loadLiveAqi]
  );

  const refreshLiveAqi = useCallback(() => {
    setIsDemoMode(false);
    void loadLiveAqi(profile.location, true);
  }, [profile.location, loadLiveAqi]);

  const sendCoachMessage = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || !computedForecast || isSendingCoachRef.current) return;

      isSendingCoachRef.current = true;

      const userMsg: ChatMessage = {
        id: `u_${Date.now()}`,
        role: 'user',
        content: trimmed,
        timestamp: new Date().toISOString(),
      };

      const historySnapshot = [...messages, userMsg];
      setMessages(historySnapshot);
      setIsCoachTyping(true);
      setCoachError(null);

      try {
        const context = buildAirCoachContext(
          computedForecast.dataset,
          profile,
          computedForecast.analysis
        );
        const result = await askAirCoach(trimmed, context, historySnapshot);

        const assistantMsg: ChatMessage = {
          id: `a_${Date.now()}`,
          role: 'assistant',
          content: result.answer,
          timestamp: result.timestamp,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        const errorText =
          err instanceof Error && err.message
            ? err.message
            : 'Air Coach is temporarily unavailable. Please try again.';

        // Provide an honest, clearly labeled deterministic safety fallback alongside the retry banner
        const fallbackAnswer = generateDeterministicCoachAnswer(
          trimmed,
          computedForecast.dataset,
          profile,
          computedForecast.analysis
        );
        const fallbackMsg: ChatMessage = {
          id: `a_fallback_${Date.now()}`,
          role: 'assistant',
          content: fallbackAnswer,
          timestamp: new Date().toISOString(),
          error: true,
        };
        setMessages((prev) => [...prev, fallbackMsg]);
        setCoachError(errorText);
      } finally {
        isSendingCoachRef.current = false;
        setIsCoachTyping(false);
      }
    },
    [computedForecast, profile, messages]
  );

  const retryLastCoachMessage = useCallback(() => {
    if (isSendingCoachRef.current) return;
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUser) {
      setMessages((prev) => {
        const idx = prev.map((m) => m.id).lastIndexOf(lastUser.id);
        return idx >= 0 ? prev.slice(0, idx) : prev;
      });
      void sendCoachMessage(lastUser.content);
    }
  }, [messages, sendCoachMessage]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setCoachError(null);
  }, []);

  return {
    viewMode,
    setViewMode,
    profile,
    isDemoMode,
    isOnline,
    dataset: computedForecast?.dataset ?? null,
    analysis: computedForecast?.analysis ?? null,
    hourly: computedForecast?.hourly ?? [],
    isAqiLoading,
    aqiWarning,
    plan,
    isPlanLoading,
    planWarning,
    messages,
    isCoachTyping,
    coachError,
    activateDemoMode,
    toggleDemoMode,
    selectLocation,
    updateFamilyProfile,
    refreshLiveAqi,
    sendCoachMessage,
    retryLastCoachMessage,
    clearChat,
  };
}
