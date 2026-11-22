import React from 'react';
import { ArrowRight, Play, Shield, Wind, Home, Clock } from 'lucide-react';

interface OnboardingScreenProps {
  onBuildProfile: () => void;
  onExploreDemo: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onBuildProfile,
  onExploreDemo,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <header className="w-full border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-8">
          <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
            <Shield className="w-5 h-5 text-teal-700" aria-hidden="true" />
            <span className="text-lg font-display font-bold tracking-tight text-slate-900">
              AirShield
            </span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-slate-600">
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
              How it works
            </a>
            <a href="#capabilities" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
              Family defense
            </a>
          </nav>
          <button
            type="button"
            onClick={onExploreDemo}
            className="px-4 py-2 text-xs font-medium text-slate-700 border border-slate-300 bg-white rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
          >
            Explore Demo
          </button>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
              <div className="text-xs font-medium text-teal-800 tracking-wide">
                Urban Air Quality Intelligence · Real-Time Open-Meteo Telemetry
              </div>
              <h1 className="text-4xl sm:text-5xl font-display font-bold tracking-tight text-slate-900 leading-[1.1] text-balance">
                Know your air. Protect your people.
              </h1>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                AirShield turns live pollution data and hourly winter inversion forecasts into a
                personalized low-exposure routine for your family—covering safe outdoor windows, ₹0
                indoor air hacks, cooking safety, and low-emission commutes.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onBuildProfile}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-teal-700 text-white text-sm font-semibold rounded-lg hover:bg-teal-800 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 whitespace-nowrap shrink-0"
                >
                  Build My AirShield Plan
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={onExploreDemo}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-white border border-slate-300 text-slate-800 text-sm font-semibold rounded-lg hover:bg-slate-100 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 whitespace-nowrap shrink-0"
                >
                  <Play className="w-4 h-4 text-teal-700" aria-hidden="true" />
                  Explore Demo (Severe Smog)
                </button>
              </div>

              <div className="text-xs text-slate-500 pt-2">
                No account or external API keys required · Family profile stays private in your browser
              </div>
            </div>

            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-1 border-b border-slate-100 pb-4">
                <div className="text-xs text-slate-500">Sample Severe Winter Smog Brief</div>
                <div className="flex items-baseline justify-between gap-4">
                  <div>
                    <span className="text-xs font-medium text-slate-500 block">US AQI</span>
                    <span className="text-4xl font-mono font-bold text-rose-900 tabular-nums">
                      340
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-rose-900 block">Hazardous</span>
                    <span className="text-xs text-slate-500">Delhi · Demo Scenario</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-xs font-semibold text-slate-900 mb-1">
                    Next Best Action
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Keep windows closed for the next 3 hours, seal exterior door gaps with damp
                    towels, and pause outdoor play for kids and seniors.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-slate-500">PM2.5</div>
                    <div className="font-mono font-semibold text-slate-900 text-base tabular-nums">
                      210 µg/m³
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-slate-500">Least-Polluted Window</div>
                    <div className="font-mono font-semibold text-slate-900 text-base tabular-nums">
                      13:00–15:00
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onExploreDemo}
                className="w-full py-2.5 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
              >
                Open Full Interactive Demo Dashboard
              </button>
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="border-t border-slate-200 bg-white py-12 px-4 sm:px-6"
        >
          <div id="capabilities" className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <Clock className="w-5 h-5 text-teal-700" aria-hidden="true" />
              <h2 className="text-base font-display font-semibold text-slate-900">
                01. Safe-Window Intelligence
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Analyzes real 24–48 hour Open-Meteo pollutant curves to spot winter inversion peaks
                and honestly tells you when no clean outdoor window exists.
              </p>
            </div>
            <div className="space-y-2">
              <Home className="w-5 h-5 text-teal-700" aria-hidden="true" />
              <h2 className="text-base font-display font-semibold text-slate-900">
                02. Zero-Cost Indoor Defense
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Whether you own a HEPA purifier or rely on ₹0 draft sealing and safer Gas/LPG
                cooking routines, every hack adapts to your actual home.
              </p>
            </div>
            <div className="space-y-2">
              <Wind className="w-5 h-5 text-teal-700" aria-hidden="true" />
              <h2 className="text-base font-display font-semibold text-slate-900">
                03. Context-Aware Air Coach
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Ask follow-up questions like “Should kids play outside at 4 PM?” without repeating
                your city, AQI, or family profile.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
