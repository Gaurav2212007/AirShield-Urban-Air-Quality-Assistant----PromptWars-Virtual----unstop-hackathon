import type {
  AirPlan,
  AirQualityDataset,
  CommuteRecommendation,
  FamilyProfile,
  ForecastAnalysis,
  IndoorHack,
  MicroHabit,
  TopPriority,
} from '../types/airshield';

export function generateDeterministicPlan(
  dataset: AirQualityDataset,
  profile: FamilyProfile,
  analysis: ForecastAnalysis
): AirPlan {
  const aqi = analysis.currentAqi;
  const hasKids = profile.vulnerabilities.includes('kids');
  const hasElderly = profile.vulnerabilities.includes('elderly');
  const hasAsthma = profile.vulnerabilities.includes('asthma_copd');
  const hasPregnant = profile.vulnerabilities.includes('pregnant');
  const hasPets = profile.vulnerabilities.includes('pets');
  const hasSensitive = hasKids || hasElderly || hasAsthma || hasPregnant;

  const priority: AirPlan['overallAssessment']['priority'] =
    aqi >= 301 ? 'critical' : aqi >= 201 ? 'high' : aqi >= 101 ? 'moderate' : 'low';

  const headline =
    aqi >= 301
      ? `Severe smog alert (US AQI ${aqi}): Shift your household to indoor protection`
      : aqi >= 201
      ? `Very unhealthy air (US AQI ${aqi}): Minimize outdoor exposure today`
      : aqi >= 101
      ? `Elevated pollution (US AQI ${aqi}): Protect sensitive lungs and time outings`
      : `Manageable air quality (US AQI ${aqi}): Keep healthy low-emission habits`;

  const sensitiveText = hasSensitive
    ? 'Because your household includes sensitive groups, keep vigorous outdoor activity paused during high-AQI hours and follow your clinician’s existing action plan.'
    : 'Keep outdoor exertion lighter during peak traffic and evening inversion hours.';

  const summary = `${analysis.windowNarrative} ${sensitiveText}`;

  const safeWindows = [
    {
      start: analysis.bestWindow.start,
      end: analysis.bestWindow.end,
      aqi: analysis.bestWindow.avgAqi,
      label: analysis.hasCleanWindow
        ? 'Best Outdoor Window'
        : 'Least-Polluted Window (Use Caution)',
      reason: analysis.hasCleanWindow
        ? `US AQI averages ${analysis.bestWindow.avgAqi}, the lowest stretch of the next 24 hours.`
        : `No genuinely clean outdoor window is available in the next 24 hours. ${analysis.bestWindow.startLabel}–${analysis.bestWindow.endLabel} (avg US AQI ${analysis.bestWindow.avgAqi}) is the least-polluted window, but exposure should still be minimized.`,
      recommendedActivities: analysis.hasCleanWindow
        ? ['Short walks away from main roads', 'Quick household errands', 'Brief cross-ventilation']
        : ['Strictly essential errands only', 'Brief pet relief walks near home', 'Quick groceries in one trip'],
    },
  ];

  const lockdownHours =
    analysis.worstWindow.avgAqi >= 151
      ? [
          {
            start: analysis.worstWindow.start,
            end: analysis.worstWindow.end,
            aqi: analysis.worstWindow.maxAqi,
            reason: `Peak pollution period reaching US AQI ${analysis.worstWindow.maxAqi}, driven by stagnant winter air and boundary-layer trapping.`,
            avoid: [
              'Outdoor play, running, or prolonged walks',
              'Opening exterior windows for ventilation',
              'Waiting near idling roadside traffic',
            ],
          },
        ]
      : [];

  const indoorHacks: IndoorHack[] = [];

  if (profile.home.windowSealing === 'poor' || aqi >= 201) {
    indoorHacks.push({
      title: 'Wet-towel draft & door-gap seal',
      cost: 'free',
      difficulty: 'easy',
      steps: [
        'Check window frames and exterior door thresholds with the back of your hand for cold outdoor drafts.',
        'Roll slightly damp (not dripping) cotton towels tightly along bottom door gaps and leaking window sills.',
        'Keep interior doors to unused balconies or corridors closed to isolate one primary living/sleeping room.',
      ],
      whyItHelps: 'Reduces passive infiltration of outdoor PM2.5 particles during winter inversion peaks.',
      personalizedReason:
        profile.home.windowSealing === 'poor'
          ? 'Selected because your home has poor window sealing, which lets outdoor smog drift indoors continuously.'
          : 'Important buffer during severe outdoor pollution spikes.',
      safetyNote: 'Use damp—not soaking—cloths away from electrical sockets or baseboards.',
    });
  }

  indoorHacks.push({
    title: 'Designate one cleaner indoor shelter room',
    cost: 'free',
    difficulty: 'easy',
    steps: [
      'Pick an interior bedroom with fewer exterior walls and keep its door closed.',
      'Avoid sweeping dry dust (use a damp mop or microfiber cloth instead so settled particles are not kicked back into the air).',
      'Keep incense, candles, mosquito coils, and aerosol sprays completely out of this room.',
    ],
    whyItHelps: 'Concentrating clean-air habits in one room cuts cumulative inhaled particulate load overnight.',
    personalizedReason:
      profile.home.airPurifier === 'none'
        ? 'Essential ₹0 protection since your home currently does not have a mechanical air purifier.'
        : 'Helps your existing air purifier clean a smaller, sealed air volume much faster.',
    safetyNote: 'Never burn charcoal, candles, or essential oils indoors during high-AQI episodes.',
  });

  if (profile.home.airPurifier === 'available') {
    indoorHacks.push({
      title: 'Continuous purifier zoning & filter check',
      cost: 'free',
      difficulty: 'easy',
      steps: [
        'Run your HEPA purifier continuously in the room where kids, elderly members, or sleeping family spend the most hours.',
        'Set fan speed to medium-high during peak hours and switch to quiet/sleep mode overnight without turning it off.',
        'Vacuum the outer pre-filter mesh gently once a week so airflow stays unrestricted.',
      ],
      whyItHelps: 'Keeping doors shut and running continuously prevents indoor PM2.5 from rebounding.',
      personalizedReason: 'Tailored to maximize the purifier you already have at home.',
      safetyNote: 'Ensure ionizer/ozone functions (if any on the unit) remain switched OFF.',
    });
  } else {
    indoorHacks.push({
      title: 'Low-cost weatherstrip tape + DIY box-fan MERV-13 filter',
      cost: 'low',
      difficulty: 'moderate',
      steps: [
        'Apply ₹150–₹300 foam weatherstripping along loose sliding window tracks.',
        'If building a temporary box-fan filter, tape a high-efficiency HVAC pleated filter securely onto the intake side of a modern safety-certified box fan.',
        'Place the assembly away from curtains and never leave it running unattended overnight.',
      ],
      whyItHelps: 'Foam tape slows smog leaks, while a properly sealed pleated filter captures fine particles better than an unfiltered fan.',
      personalizedReason: 'Provides affordable filtration support when a certified HEPA purifier is unavailable.',
      safetyNote:
        'Safety warning: Securely attach the filter, never block the fan motor vents, never use damaged cords, keep away from water, and remember a DIY fan filter is not equivalent to a certified HEPA purifier.',
    });
  }

  if (profile.home.cookingFuel === 'gas_lpg') {
    indoorHacks.push({
      title: 'Low-emission Gas/LPG cooking protocol',
      cost: 'free',
      difficulty: 'easy',
      steps: [
        'Cover pots with lids to shorten burner time and reduce steam/NO2 buildup.',
        'Run your kitchen chimney or exhaust fan while cooking, and keep the kitchen door closed from bedrooms.',
        'Avoid high-temperature smoky pan-frying during lockdown hours; favor steaming, boiling, or pressure cooking.',
      ],
      whyItHelps: 'Gas/LPG flames emit nitrogen dioxide (NO2) and cooking smoke adds indoor PM2.5 on top of outdoor smog.',
      personalizedReason: 'Specifically included because your home uses Gas/LPG cooking fuel.',
      safetyNote:
        'Never block kitchen airflow completely while burning gas; always maintain safe exhaust or brief localized ventilation so combustion gases do not accumulate.',
    });
  } else {
    indoorHacks.push({
      title: 'Low-smoke cooking routine',
      cost: 'free',
      difficulty: 'easy',
      steps: [
        'Use lids on pots and keep oil below its smoking point.',
        'Run the kitchen exhaust briefly during high-heat sautéing, then close off once steam clears.',
      ],
      whyItHelps: 'Induction avoids combustion NO2, so controlling cooking oil aerosol is the main indoor win.',
      personalizedReason: 'Matches your cleaner electric/induction kitchen setup.',
      safetyNote: 'Keep exhaust vents clear of grease buildup.',
    });
  }

  if (profile.home.hasIndoorPlants || profile.home.hasBalcony) {
    indoorHacks.push({
      title: 'Balcony buffer & realistic plant expectations',
      cost: 'free',
      difficulty: 'easy',
      steps: [
        profile.home.hasBalcony
          ? 'Keep balcony doors latched tightly during evening inversion peaks and avoid drying damp clothes indoors if humidity rises.'
          : 'Keep exterior openings shut during peak smog hours.',
        'Wipe indoor plant leaves weekly with a damp cloth so settled dust does not resuspend.',
      ],
      whyItHelps: 'Prevents balcony draft leaks and dust buildup.',
      personalizedReason: 'Reflects your home’s balcony and indoor plants setup.',
      safetyNote:
        'Note: Indoor houseplants are pleasant for wellbeing, but they do not meaningfully filter PM2.5 or replace ventilation and filtration.',
    });
  }

  const commuteRecommendations: CommuteRecommendation[] = [];
  if (profile.commuteMode === 'wfh') {
    commuteRecommendations.push(
      {
        title: 'Air-aware workday schedule',
        priority: 'high',
        action: `Skip midday outdoor coffee runs if AQI stays above 200; take your brief stretch break near ${analysis.bestWindow.startLabel}–${analysis.bestWindow.endLabel} indoors or on a sheltered errand only if needed.`,
        reason: 'Working from home eliminates peak rush-hour roadside exposure.',
      },
      {
        title: 'Batch errands into one low-pollution trip',
        priority: 'medium',
        action: 'Combine groceries and pharmacy pickups into a single trip during the least-polluted window.',
        reason: 'Reduces both your inhaled dose and neighborhood vehicle emissions.',
      }
    );
  } else if (profile.commuteMode === 'walking_two_wheeler') {
    commuteRecommendations.push(
      {
        title: 'Shift away from main-road exhaust corridors',
        priority: 'high',
        action: 'Use quieter residential side streets one block off arterial highways and wear a well-fitted N95/FFP2 respirator when AQI exceeds 150.',
        reason: 'Walking and two-wheeler riders breathe roadside PM2.5 and NO2 directly at tailpipe height.',
      },
      {
        title: 'Time departures around the midday dip',
        priority: 'medium',
        action: `When flexible, travel closer to ${analysis.bestWindow.startLabel}–${analysis.bestWindow.endLabel} and avoid ${analysis.worstWindow.startLabel}–${analysis.worstWindow.endLabel}.`,
        reason: 'Reduces inhaled particulate dose during inversion peaks.',
      }
    );
  } else if (profile.commuteMode === 'public_transit') {
    commuteRecommendations.push(
      {
        title: 'Minimize roadside waiting time',
        priority: 'high',
        action: 'Use live transit arrival checks so you step onto the stop just before boarding rather than waiting near idling traffic.',
        reason: 'Curbside bus stops often have much higher localized PM2.5 and NO2 than enclosed stations.',
      },
      {
        title: 'Use a snug N95/KF94 mask on high-AQI trips',
        priority: 'medium',
        action: 'Carry a well-sealed respirator for crowded outdoor platforms and last-mile walks.',
        reason: 'Helps filter fine particles during your public transit commute when AQI is unhealthy or worse.',
      }
    );
  } else {
    commuteRecommendations.push(
      {
        title: 'Use cabin recirculation in heavy traffic',
        priority: 'high',
        action: 'Keep windows rolled up and switch climate control to recirculation mode in congested traffic, then briefly refresh with outside air on open low-traffic stretches if CO2 builds.',
        reason: 'Keeps tailpipe exhaust out of the cabin; remember to replace your cabin air filter seasonally.',
      },
      {
        title: 'Zero unnecessary engine idling',
        priority: 'medium',
        action: 'Turn off the engine during school pickups or waits longer than 30 seconds.',
        reason: 'Cuts localized NO2 and fine soot right where children and pedestrians breathe.',
      }
    );
  }

  const microHabits: MicroHabit[] = [
    {
      title: 'Eliminate indoor combustion sources',
      action: 'Pause incense, candles, smoking, and mosquito coils whenever outdoor AQI exceeds 100.',
      benefit: 'Prevents trapping dense indoor PM2.5 inside a sealed home.',
    },
    {
      title: 'Damp-clean instead of dry sweeping',
      action: 'Wipe floors and sills with a damp mop or microfiber cloth.',
      benefit: 'Captures settled soot instead of kicking it back to breathing height.',
    },
    {
      title: 'Zero waste burning & idling',
      action: 'Never burn garden leaves or trash, and switch off engines while parked.',
      benefit: 'Reduces hyper-local winter smog spikes for your whole street.',
    },
    {
      title: 'Batch errands & carpool',
      action: 'Combine family pickups and deliveries into one scheduled trip.',
      benefit: 'Lowers neighborhood traffic emissions and cuts total exposure minutes.',
    },
  ];

  const topPriorities: TopPriority[] = [
    {
      rank: 1,
      action:
        aqi >= 201
          ? `Keep family indoors during peak hours (${analysis.worstWindow.startLabel}–${analysis.worstWindow.endLabel}, AQI ~${analysis.worstWindow.maxAqi})`
          : `Plan outdoor errands in ${analysis.bestWindow.startLabel}–${analysis.bestWindow.endLabel} (avg AQI ${analysis.bestWindow.avgAqi})`,
      reason: 'Avoiding peak particulate concentrations yields the largest immediate drop in daily inhaled dose.',
    },
    {
      rank: 2,
      action:
        profile.home.airPurifier === 'available'
          ? 'Keep windows sealed and run your air purifier continuously in the main bedroom'
          : 'Seal drafty window/door gaps with damp towels or foam tape and isolate one cleaner room',
      reason:
        profile.home.airPurifier === 'available'
          ? 'Continuous filtration in a closed room steadily lowers indoor PM2.5.'
          : 'Without a purifier, reducing outdoor smog leakage is the highest-impact ₹0 defense.',
    },
    {
      rank: 3,
      action: hasAsthma
        ? 'Keep asthma/COPD rescue inhalers and your clinician action plan accessible; avoid any indoor smoke'
        : profile.home.cookingFuel === 'gas_lpg'
        ? 'Use lids and kitchen exhaust while cooking on Gas/LPG, and keep bedroom doors closed'
        : hasPets
        ? 'Keep pet walks brief near home and wipe paws/coats after returning indoors'
        : 'Eliminate indoor candles/incense and damp-mop floors instead of dry sweeping',
      reason: 'Targets your household’s specific health and indoor emission profile.',
    },
  ];

  return {
    overallAssessment: {
      headline,
      summary,
      priority,
    },
    safeWindows,
    lockdownHours,
    indoorHacks,
    commuteRecommendations,
    microHabits,
    topPriorities,
    generatedBy: 'deterministic',
    generatedAt: new Date().toISOString(),
  };
}
