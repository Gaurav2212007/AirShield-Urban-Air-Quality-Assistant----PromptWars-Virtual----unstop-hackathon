import React, { useState } from 'react';
import { MessageSquare, SlidersHorizontal } from 'lucide-react';
import { ActionPlanSection } from './components/ActionPlanSection';
import { AirCoachDrawer } from './components/AirCoachDrawer';
import { AqiHeroCard } from './components/AqiHeroCard';
import { CommuteAndHabitsSection } from './components/CommuteAndHabitsSection';
import {
  ActionPlanSkeleton,
  AqiHeroSkeleton,
  ForecastChartSkeleton,
} from './components/DashboardSkeletons';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FamilyProfileWizard } from './components/FamilyProfileWizard';
import { ForecastChart } from './components/ForecastChart';
import { HeaderBar } from './components/HeaderBar';
import { HourlyTimeline } from './components/HourlyTimeline';
import { IndoorDefenseSection } from './components/IndoorDefenseSection';
import { OnboardingScreen } from './components/OnboardingScreen';
import { ProfileSummarySidebar } from './components/ProfileSummarySidebar';
import { ReadinessAndExposure } from './components/ReadinessAndExposure';
import { WorkspaceToolbar } from './components/WorkspaceToolbar';
import { useAirShield } from './hooks/useAirShield';
import { generateDeterministicPlan } from './utils/fallbackPlanEngine';

function AirShieldAppContent() {
  const {
    viewMode,
    setViewMode,
    profile,
    isDemoMode,
    isOnline,
    dataset,
    analysis,
    hourly,
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
  } = useAirShield();

  const [isCoachOpen, setIsCoachOpen] = useState(false);
  const [isEditingProfileModal, setIsEditingProfileModal] = useState(false);

  if (viewMode === 'onboarding') {
    return (
      <OnboardingScreen
        onBuildProfile={() => setViewMode('wizard')}
        onExploreDemo={activateDemoMode}
      />
    );
  }

  if (viewMode === 'wizard') {
    return (
      <FamilyProfileWizard
        initialProfile={profile}
        onComplete={updateFamilyProfile}
        onCancel={() => setViewMode(dataset ? 'dashboard' : 'onboarding')}
      />
    );
  }

  const effectivePlan =
    plan ??
    (dataset && analysis ? generateDeterministicPlan(dataset, profile, analysis) : null);

  const handleQuickTogglePurifier = () => {
    updateFamilyProfile({
      ...profile,
      home: {
        ...profile.home,
        airPurifier: profile.home.airPurifier === 'available' ? 'none' : 'available',
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <HeaderBar
        onOpenCoach={() => setIsCoachOpen(true)}
        onEditProfile={() => setIsEditingProfileModal(true)}
        onGoHome={() => setViewMode('onboarding')}
      />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6 pb-24 lg:pb-12 space-y-6">
        <WorkspaceToolbar
          location={profile.location}
          dataset={dataset}
          isDemoMode={isDemoMode}
          isOnline={isOnline}
          isAqiLoading={isAqiLoading}
          aqiWarning={aqiWarning}
          onSelectLocation={selectLocation}
          onRefreshLive={refreshLiveAqi}
          onToggleDemoMode={toggleDemoMode}
          onOpenProfileWizard={() => setIsEditingProfileModal(true)}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 xl:col-span-9 space-y-6 min-w-0">
            {isAqiLoading && !dataset ? (
              <>
                <AqiHeroSkeleton />
                <ForecastChartSkeleton />
              </>
            ) : !dataset || !analysis ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3">
                <h2 className="text-lg font-display font-bold text-slate-900">
                  Choose a city to see your air.
                </h2>
                <p className="text-sm text-slate-600">
                  Search any city above or switch on Demo Mode to explore a severe winter smog
                  scenario.
                </p>
              </div>
            ) : (
              <>
                <AqiHeroCard dataset={dataset} analysis={analysis} />

                <ReadinessAndExposure analysis={analysis} />

                <ForecastChart hourly={hourly} analysis={analysis} />

                {isPlanLoading && !plan ? (
                  <ActionPlanSkeleton />
                ) : effectivePlan ? (
                  <>
                    <ActionPlanSection
                      plan={effectivePlan}
                      profile={profile}
                      analysis={analysis}
                      planWarning={planWarning}
                    />

                    <HourlyTimeline hourly={hourly} />

                    <IndoorDefenseSection
                      hacks={effectivePlan.indoorHacks}
                      home={profile.home}
                    />

                    <CommuteAndHabitsSection
                      commuteMode={profile.commuteMode}
                      recommendations={effectivePlan.commuteRecommendations}
                      microHabits={effectivePlan.microHabits}
                    />
                  </>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-sm text-slate-500">
                    Build your family profile to unlock personalized guidance.
                  </div>
                )}
              </>
            )}
          </div>

          <div className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-22">
            <ProfileSummarySidebar
              profile={profile}
              dataset={dataset}
              analysis={analysis}
              onEditProfile={() => setIsEditingProfileModal(true)}
              onQuickTogglePurifier={handleQuickTogglePurifier}
              onOpenCoach={() => setIsCoachOpen(true)}
            />
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-5 px-4 sm:px-6 text-xs text-slate-500 mb-14 lg:mb-0">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <span>
            AirShield · Urban Air Quality Assistant · US AQI standard · Open-Meteo keyless data
          </span>
          <span>
            General environmental guidance only — not medical diagnosis or treatment.
          </span>
        </div>
      </footer>

      {/* Mobile compact bottom action bar (<= 15% viewport height) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 px-4 py-2.5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setIsEditingProfileModal(true)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Family Profile</span>
        </button>
        <button
          type="button"
          onClick={() => setIsCoachOpen(true)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-teal-700 text-white rounded-lg text-xs font-semibold"
        >
          <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Ask Air Coach</span>
        </button>
      </div>

      <AirCoachDrawer
        isOpen={isCoachOpen}
        onClose={() => setIsCoachOpen(false)}
        dataset={dataset}
        analysis={analysis}
        messages={messages}
        isTyping={isCoachTyping}
        error={coachError}
        onSendMessage={sendCoachMessage}
        onRetry={retryLastCoachMessage}
        onClearChat={clearChat}
      />

      {isEditingProfileModal && (
        <FamilyProfileWizard
          initialProfile={profile}
          isModal
          onComplete={(updated) => {
            setIsEditingProfileModal(false);
            updateFamilyProfile(updated);
          }}
          onCancel={() => setIsEditingProfileModal(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AirShieldAppContent />
    </ErrorBoundary>
  );
}
