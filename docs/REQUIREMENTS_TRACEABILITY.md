\# AirShield Challenge 6 Requirements Traceability



| Requirement | Implementation | Test Coverage | Fallback Path |

|---|---|---|---|

| Current AQI \& Pollutants | `src/services/aqiService.ts`, `src/components/AqiHeroCard.tsx` | `tests/airshield.test.ts` | Cached reading -> Demo / Offline fallback |

| 24h/48h Forecast \& Windows | `src/utils/forecastAnalyzer.ts`, `src/components/ForecastChart.tsx` | `tests/airshield.test.ts` | Deterministic min/max/avg \& window scoring |

| Household Personalization | `src/components/FamilyProfileWizard.tsx`, `src/hooks/useAirShield.ts` | `tests/airshield.test.ts` | Local `localStorage` persistence + defaults |

| Vulnerable Group Guidance | `src/utils/fallbackPlanEngine.ts` | `tests/airshield.test.ts` | Rule-based priority escalation for kids/elderly/asthma/pregnancy/pets |

| Indoor Air Defense | `src/utils/fallbackPlanEngine.ts`, `src/components/IndoorDefenseSection.tsx` | `tests/airshield.test.ts` | Zero-cost containment \& purifier/cooking guidance |

| Commute \& Micro-Habits | `src/utils/fallbackPlanEngine.ts`, `src/components/CommuteAndHabitsSection.tsx` | `tests/airshield.test.ts` | Mode-specific commute advice + community habits |

| AI Coach \& Plan Generation | `server.ts`, `src/services/geminiService.ts`, `src/components/AirCoachDrawer.tsx` | `tests/airshield.test.ts` | `validateAirPlan()` + `generateDeterministicPlan()` / `generateDeterministicCoachAnswer()` |

| Accessibility \& Hygiene | `src/index.css`, `src/utils/profileLabels.ts`, `src/components/\*.tsx` | `tests/airshield.test.ts` | High-contrast labels, `prefers-reduced-motion`, clean text hygiene |



\## Acceptance Criteria

1\. Every core feature has a clear implementation module in `src/` or `server.ts`.

2\. Deterministic logic and schema validation are covered by `npm test` (`tsx --test tests/airshield.test.ts`).

3\. External API or model failures degrade gracefully to cached/demo data and deterministic guidance without crashing the UI.

