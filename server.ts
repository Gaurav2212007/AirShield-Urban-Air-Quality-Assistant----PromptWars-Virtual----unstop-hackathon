import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const PREFERRED_GEMINI_MODELS = [
  process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
  'gemini-4-hydrogen',
];

function createGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function extractErrorDetails(err: unknown): {
  name: string;
  message: string;
  status: number;
} {
  const anyErr = err as {
    name?: string;
    message?: string;
    status?: number;
    statusCode?: number;
    cause?: { code?: string; message?: string };
  };
  const name = anyErr?.name || 'Error';
  const message = anyErr?.message || 'Unknown Gemini error';
  const rawStatus = Number(anyErr?.status || anyErr?.statusCode || 0);
  if (rawStatus >= 400 && rawStatus < 600) {
    return { name, message, status: rawStatus };
  }
  if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
    return { name, message, status: 429 };
  }
  if (message.includes('403') || message.includes('PERMISSION_DENIED')) {
    return { name, message, status: 403 };
  }
  if (message.includes('401') || message.includes('API_KEY_INVALID')) {
    return { name, message, status: 401 };
  }
  if (message.includes('404') || message.includes('NOT_FOUND')) {
    return { name, message, status: 404 };
  }
  return { name, message, status: 502 };
}

const PLAN_SYSTEM_INSTRUCTION = `You are AirShield, an evidence-aligned urban air-quality planning assistant helping families beat severe winter smog.

STRICT SAFETY & GROUNDING RULES:
1. Never fabricate AQI measurements, weather data, or pollutant numbers. Use ONLY the supplied measurements and deterministic analysis.
2. Never claim a period is "safe" or "clean" if hasCleanWindow is false or if US AQI > 100 during that period. Instead state clearly that no genuinely clean window exists and frame the lowest-AQI window as "Least-Polluted Window (Use Caution)".
3. Clearly distinguish environmental planning guidance from medical advice. Never diagnose diseases or recommend medication dosages.
4. If asthma/COPD, pregnancy, kids, or elderly members are present, emphasize exposure reduction and following existing clinician action plans. Include this disclaimer sentence inside overallAssessment.summary when sensitive groups are present: "AirShield provides general environmental guidance, not medical diagnosis or treatment. Follow your clinician's advice and your existing action plan."
5. Never recommend dangerous modifications to gas appliances, burning, chemical treatments, ozone generators/ionizers, or unsafe DIY methods.
6. If mentioning a DIY box-fan filter, always include explicit safety notes (secure filter attachment, do not block motor, inspect cords, keep away from water, not equivalent to a certified purifier).
7. Never claim indoor plants meaningfully replace filtration or ventilation.
8. Prioritize zero-cost (free) practical interventions before low/medium-cost options.
9. Tailor every section directly to the family's vulnerabilities, air purifier availability, cooking fuel, window sealing, balcony/plants, and commute mode (for Work From Home, replace travel advice with low-exposure workday routines).
10. Keep copy calm, human, clear, and actionable — avoid alarmist jargon.`;

const COACH_SYSTEM_INSTRUCTION = `You are Air Coach, the personalized air-quality assistant inside AirShield.

Your job is to give concise, practical, evidence-aligned guidance based ONLY on the air-quality data and family context supplied by the application.

CURRENT AIR-QUALITY DATA PROVIDED BY THE APPLICATION IS AUTHORITATIVE FOR THIS SESSION.

1. Never invent current AQI, PM2.5, PM10, ozone, NO2, weather, or forecast values.
2. Never claim that a time period is safe if the supplied forecast does not support that conclusion.
3. If no genuinely clean outdoor period exists, explicitly say so and identify the least-polluted available period instead.
4. If dataMode is "demo", remember the supplied air-quality dataset is DEMO/OFFLINE DATA and do not describe it as live data.
5. Personalize recommendations according to the supplied family profile (vulnerabilities, air purifier, cooking fuel, window sealing, balcony, indoor plants, commute mode). If the family profile is minimal or missing details, note briefly that personalization is limited and still give practical guidance from the AQI data.
6. For children, elderly people, pregnant people, and people with asthma/COPD, prioritize exposure reduction and advise following existing medical/clinical guidance.
7. Do not diagnose medical conditions or prescribe medication or medication dosages.
8. Do not recommend unsafe modifications to gas/LPG appliances, burning incense/candles, ozone generators, or unsafe air-cleaning methods.
9. Do not claim indoor plants can replace filtration or ventilation.
10. When the user asks a simple question, answer directly first and then briefly explain why using the exact supplied numbers/hours.
11. Keep responses concise, plain text or clean bullet lines (no HTML), and do not overwhelm the user with unnecessary technical jargon.
12. If the supplied data is insufficient to answer confidently, say what is missing rather than fabricating information.`;

const AIR_PLAN_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    overallAssessment: {
      type: Type.OBJECT,
      properties: {
        headline: { type: Type.STRING },
        summary: { type: Type.STRING },
        priority: {
          type: Type.STRING,
          enum: ['low', 'moderate', 'high', 'critical'],
        },
      },
      required: ['headline', 'summary', 'priority'],
    },
    safeWindows: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          start: { type: Type.STRING },
          end: { type: Type.STRING },
          aqi: { type: Type.NUMBER },
          label: { type: Type.STRING },
          reason: { type: Type.STRING },
          recommendedActivities: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ['start', 'end', 'aqi', 'label', 'reason', 'recommendedActivities'],
      },
    },
    lockdownHours: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          start: { type: Type.STRING },
          end: { type: Type.STRING },
          aqi: { type: Type.NUMBER },
          reason: { type: Type.STRING },
          avoid: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ['start', 'end', 'aqi', 'reason', 'avoid'],
      },
    },
    indoorHacks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          cost: { type: Type.STRING, enum: ['free', 'low', 'medium'] },
          difficulty: { type: Type.STRING, enum: ['easy', 'moderate'] },
          steps: { type: Type.ARRAY, items: { type: Type.STRING } },
          whyItHelps: { type: Type.STRING },
          personalizedReason: { type: Type.STRING },
          safetyNote: { type: Type.STRING },
        },
        required: [
          'title',
          'cost',
          'difficulty',
          'steps',
          'whyItHelps',
          'personalizedReason',
          'safetyNote',
        ],
      },
    },
    commuteRecommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          priority: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
          action: { type: Type.STRING },
          reason: { type: Type.STRING },
        },
        required: ['title', 'priority', 'action', 'reason'],
      },
    },
    microHabits: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          action: { type: Type.STRING },
          benefit: { type: Type.STRING },
        },
        required: ['title', 'action', 'benefit'],
      },
    },
    topPriorities: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          rank: { type: Type.INTEGER },
          action: { type: Type.STRING },
          reason: { type: Type.STRING },
        },
        required: ['rank', 'action', 'reason'],
      },
    },
  },
  required: [
    'overallAssessment',
    'safeWindows',
    'lockdownHours',
    'indoorHacks',
    'commuteRecommendations',
    'microHabits',
    'topPriorities',
  ],
};

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '512kb' }));

  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
    next();
  });

  app.get('/api/health', (_req, res) => {
    const hasGeminiKey = Boolean(
      process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
    );
    res.json({
      ok: true,
      hasGeminiKey,
      models: PREFERRED_GEMINI_MODELS,
    });
  });

  app.post('/api/plan', async (req, res) => {
    const ai = createGeminiClient();
    if (!ai) {
      res.status(503).json({ error: 'Gemini API key is not configured on the server.' });
      return;
    }

    const payload = req.body;
    if (!payload || !payload.location || !payload.familyProfile || !payload.analysis) {
      res.status(400).json({ error: 'Missing required air quality or family profile context.' });
      return;
    }

    const prompt = `Generate a personalized Clean Air Action Plan for this household using ONLY the verified data below.
Include 4 to 5 indoorHacks (prioritizing free hacks first, plus cooking and purifier-specific hacks), 2 to 3 commuteRecommendations, 3 to 4 microHabits, and exactly 3 topPriorities.

VERIFIED CONTEXT JSON:
${JSON.stringify(payload)}`;

    let lastError: unknown = null;
    for (const modelName of PREFERRED_GEMINI_MODELS) {
      try {
        const config: Record<string, unknown> = {
          systemInstruction: PLAN_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: AIR_PLAN_SCHEMA,
        };
        if (modelName.startsWith('gemini-4') || modelName.startsWith('gemini-3')) {
          config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
        }
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config,
        });

        const text = (response.text ?? '').trim();
        if (!text) {
          throw new Error('Empty JSON response from Gemini');
        }
        const parsed = JSON.parse(text);
        res.json({ plan: parsed, source: 'gemini', model: modelName });
        return;
      } catch (err) {
        lastError = err;
        const info = extractErrorDetails(err);
        console.error(`[AirPlan] Model ${modelName} failed (${info.status}): ${info.message}`);
        if (info.status === 401 || info.status === 403 || info.status === 429) {
          break;
        }
      }
    }

    const details = extractErrorDetails(lastError);
    res.status(details.status >= 400 && details.status < 600 ? details.status : 502).json({
      error: 'Unable to generate AI plan right now.',
    });
  });

  const handleAirCoach: express.RequestHandler = async (req, res) => {
    console.log('[AirCoach] Request received');
    const ai = createGeminiClient();
    if (!ai) {
      console.error('[AirCoach] Configuration error: GEMINI_API_KEY missing');
      res.status(503).json({
        error: 'Air Coach is not configured correctly. Check the Gemini server configuration.',
      });
      return;
    }

    const body = req.body as {
      question?: unknown;
      context?: Record<string, unknown>;
      recentMessages?: Array<{ role?: string; content?: string }>;
    };

    if (typeof body?.question !== 'string' || body.question.trim().length === 0) {
      console.warn('[AirCoach] Validation failure: empty question');
      res.status(400).json({ error: 'Please enter a question for Air Coach.' });
      return;
    }

    const sanitizedQuestion = body.question.trim().slice(0, 600);
    const contextObj = body.context && typeof body.context === 'object' ? body.context : {};
    const dataMode = contextObj.dataMode === 'demo' ? 'demo' : 'live';

    const historySnippet = Array.isArray(body.recentMessages)
      ? body.recentMessages
          .slice(-6)
          .map(
            (m) =>
              `${m.role === 'assistant' ? 'Air Coach' : 'User'}: ${String(m.content || '').slice(0, 400)}`
          )
          .join('\n')
      : '';

    const prompt = `${
      dataMode === 'demo'
        ? 'NOTE: The supplied air-quality dataset is DEMO/OFFLINE DATA. Do not describe it as live data.\n\n'
        : ''
    }HOUSEHOLD & AIR QUALITY CONTEXT:
${JSON.stringify(contextObj)}

RECENT CONVERSATION:
${historySnippet || 'None'}

USER QUESTION:
${sanitizedQuestion}`;

    const sourcesUsed: string[] = [];
    if (contextObj.currentAirQuality) sourcesUsed.push('current AQI');
    if (Array.isArray(contextObj.hourlyForecast) && contextObj.hourlyForecast.length > 0) {
      sourcesUsed.push('hourly forecast');
    }
    if (contextObj.familyProfile) sourcesUsed.push('family profile');

    let lastError: unknown = null;
    for (const modelName of PREFERRED_GEMINI_MODELS) {
      console.log(`[AirCoach] Selected model: ${modelName}`);
      console.log('[AirCoach] Gemini request started');
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction: COACH_SYSTEM_INSTRUCTION,
          },
        });

        const answer = (response.text ?? '').trim();
        if (!answer) {
          console.warn('[AirCoach] Validation failure: empty Gemini text');
          throw new Error('Empty response from Gemini');
        }

        console.log('[AirCoach] Gemini response received');
        console.log('[AirCoach] Response returned');
        res.json({
          answer,
          reply: answer,
          sourcesUsed,
          model: modelName,
          timestamp: new Date().toISOString(),
        });
        return;
      } catch (err) {
        lastError = err;
        const info = extractErrorDetails(err);
        console.error('[AirCoach] Gemini request failed');
        console.error(`[AirCoach] Error name: ${info.name}`);
        console.error(`[AirCoach] Error message: ${info.message}`);
        console.error(`[AirCoach] HTTP status: ${info.status}`);

        if (info.status === 401 || info.status === 403 || info.status === 429) {
          break;
        }
      }
    }

    const finalInfo = extractErrorDetails(lastError);
    if (finalInfo.status === 429) {
      res.status(429).json({
        error: 'Air Coach is temporarily busy. Please try again in a moment.',
      });
      return;
    }
    if (finalInfo.status === 401 || finalInfo.status === 403) {
      res.status(finalInfo.status).json({
        error: 'Air Coach is not configured correctly. Check the Gemini server configuration.',
      });
      return;
    }

    res.status(502).json({
      error: 'Air Coach is temporarily unavailable. Please try again.',
      status: finalInfo.status,
    });
  };

  app.post('/api/air-coach', handleAirCoach);
  app.post('/api/coach', handleAirCoach);

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'AirShield API endpoint not found.' });
  });

  app.use(
    '/api',
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      const info = extractErrorDetails(err);
      console.error('[AirShield API] Unhandled middleware error:', info.message);
      res.status(500).json({ error: 'Air Coach is temporarily unavailable.' });
    }
  );

  const distDir = path.resolve(__dirname, 'dist');
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(distDir);

  if (isProd) {
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AirShield server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start AirShield server:', err);
  process.exit(1);
});