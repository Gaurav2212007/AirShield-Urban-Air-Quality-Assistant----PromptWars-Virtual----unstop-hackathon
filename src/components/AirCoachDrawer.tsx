import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Loader2,
  MessageSquare,
  RotateCcw,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import type { AirQualityDataset, ChatMessage, ForecastAnalysis } from '../types/airshield';
import { formatRelativeMinutes } from '../utils/aqiUtils';

interface AirCoachDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  dataset: AirQualityDataset | null;
  analysis: ForecastAnalysis | null;
  messages: ChatMessage[];
  isTyping: boolean;
  error: string | null;
  onSendMessage: (text: string) => void;
  onRetry: () => void;
  onClearChat: () => void;
}

const SUGGESTED_QUESTIONS = [
  'Should my kids play outside right now?',
  'Should I open my windows?',
  "What should I do if I don't have an air purifier?",
  'Is it better to walk or take public transport today?',
  'What should I prioritize right now?',
  'What is the least polluted time today?',
];

export const AirCoachDrawer: React.FC<AirCoachDrawerProps> = ({
  isOpen,
  onClose,
  dataset,
  analysis,
  messages,
  isTyping,
  error,
  onSendMessage,
  onRetry,
  onClearChat,
}) => {
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const submitQuestion = () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping || !dataset) return;
    setInput('');
    onSendMessage(trimmed);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitQuestion();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitQuestion();
    }
  };

  const contextLabel = dataset
    ? `Using ${dataset.location.name} · US AQI ${analysis?.currentAqi ?? '—'} · ${
        dataset.source === 'demo'
          ? 'Demo / Offline Data'
          : `Updated ${formatRelativeMinutes(dataset.fetchedAt)}`
      }`
    : 'Select a city to activate live context';

  // Keep drawer cleanly hidden rather than unmounting if needed, or preserve state in parent hook
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Ask the Air Coach"
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs"
    >
      <div
        className="w-full sm:max-w-md bg-white h-full flex flex-col border-l border-slate-200 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-teal-700 shrink-0" aria-hidden="true" />
              <h2 className="text-base font-display font-bold text-slate-900">
                Ask the Air Coach
              </h2>
            </div>
            <p className="text-[11px] font-mono text-slate-500 truncate mt-0.5">
              {contextLabel}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={onClearChat}
                aria-label="Clear chat history"
                className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Air Coach"
              className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 ? (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <p className="text-sm font-semibold text-slate-900">
                  Ask Air Coach anything about today’s air.
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Air Coach automatically uses your current city’s forecast, pollutant mix, home
                  setup, and family vulnerabilities.
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-500">Suggested questions</div>
                <div className="flex flex-col gap-2">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => onSendMessage(q)}
                      disabled={!dataset || isTyping}
                      className="text-left px-3.5 py-2.5 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg hover:border-teal-600 hover:bg-teal-50/40 transition-colors disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[88%] rounded-xl px-4 py-3 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-teal-700 text-white'
                        : msg.error
                        ? 'bg-amber-50 border border-amber-200 text-slate-900'
                        : 'bg-slate-50 border border-slate-200 text-slate-900'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 mt-1 px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-slate-500 p-3 bg-slate-50 border border-slate-200 rounded-xl w-fit">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-700" aria-hidden="true" />
              <span>Checking your forecast and household profile...</span>
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={onRetry}
                disabled={isTyping}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-300 rounded-lg text-xs font-semibold text-rose-900 hover:bg-rose-100 disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Retry</span>
              </button>
            </div>
          )}

          <div ref={endRef} />
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-4 border-t border-slate-200 bg-white space-y-2"
        >
          <div className="flex items-end gap-2">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about timing, kids, windows, or commute..."
              aria-label="Ask Air Coach a question"
              disabled={!dataset || isTyping}
              className="flex-1 resize-none bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-teal-700 max-h-28"
            />
            <button
              type="submit"
              disabled={!dataset || !input.trim() || isTyping}
              aria-label="Send message"
              className="p-2.5 bg-teal-700 text-white rounded-lg hover:bg-teal-800 disabled:opacity-50 transition-colors shrink-0"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            Enter to send · Shift+Enter for newline · Not medical diagnosis or treatment.
          </p>
        </form>
      </div>
    </div>
  );
};
