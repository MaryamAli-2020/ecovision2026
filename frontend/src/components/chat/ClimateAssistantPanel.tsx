import type { ChatMessage, DashboardSnapshot, Language } from "@ecovision/shared";
import { Download, Languages, MessageSquareText, Send, Volume2 } from "lucide-react";
import { useState } from "react";

import { GlassPanel } from "@/components/ui/GlassPanel";
import { cn, riskBadgeClasses } from "@/lib/utils";

interface ClimateAssistantPanelProps {
  snapshot: DashboardSnapshot;
  messages: ChatMessage[];
  language: Language;
  isSending: boolean;
  onLanguageChange: (language: Language) => void;
  onSend: (question: string) => void;
  onExampleClick: (question: string) => void;
  onDownloadPdf: (message: ChatMessage) => void;
  onGenerateAudio: () => void;
}

export const ClimateAssistantPanel = ({
  snapshot,
  messages,
  language,
  isSending,
  onLanguageChange,
  onSend,
  onExampleClick,
  onDownloadPdf,
  onGenerateAudio
}: ClimateAssistantPanelProps) => {
  const [question, setQuestion] = useState("");

  const submitQuestion = () => {
    if (!question.trim() || isSending) {
      return;
    }

    onSend(question.trim());
    setQuestion("");
  };

  return (
    <>
      <GlassPanel
        title="AI Climate Assistant"
        subtitle="Grounded in the active dashboard dataset and city selection"
        rightSlot={<MessageSquareText className="h-4 w-4 text-cyan-200" />}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(["en", "ar"] as Language[]).map((entry) => (
              <button
                key={entry}
                className={cn(
                  "rounded-2xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition",
                  language === entry ? "bg-white text-slate-950" : "border border-white/10 bg-white/5 text-slate-300"
                )}
                onClick={() => onLanguageChange(entry)}
              >
                <span className="inline-flex items-center gap-2">
                  <Languages className="h-3.5 w-3.5" />
                  {entry}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {snapshot.sampleQuestions[language].map((item) => (
              <button
                key={item}
                className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-left text-xs text-slate-300 transition hover:border-cyan-400/30 hover:text-white"
                onClick={() => onExampleClick(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {messages.map((message) => (
              <article
                key={message.id}
                className={cn(
                  "rounded-[24px] border p-4",
                  message.role === "assistant"
                    ? "border-white/8 bg-slate-900/80"
                    : "border-cyan-400/20 bg-cyan-400/10"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      {message.role === "assistant" ? "Assistant" : "You"}
                    </p>
                    {message.title ? <h4 className="mt-1 font-display text-base text-white">{message.title}</h4> : null}
                  </div>
                  {message.role === "assistant" ? (
                    <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ring-1", riskBadgeClasses.moderate)}>
                      Analytical
                    </span>
                  ) : null}
                </div>
                <p
                  className={cn("mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-200", message.language === "ar" && "text-right")}
                  dir={message.language === "ar" ? "rtl" : "ltr"}
                >
                  {message.content}
                </p>
                {message.chips?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.chips.map((chip) => (
                      <span key={chip} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300">
                        {chip}
                      </span>
                    ))}
                  </div>
                ) : null}
                {message.role === "assistant" ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-100"
                      onClick={() => onDownloadPdf(message)}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download PDF
                    </button>
                    <button
                      className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-100"
                      onClick={onGenerateAudio}
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                      Audio Brief (AR)
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </GlassPanel>

      <div className="sticky bottom-0 z-10 mt-4 rounded-[26px] border border-white/10 bg-slate-950/95 p-4 shadow-glow backdrop-blur-2xl">
        <div className="flex flex-col gap-3">
          <textarea
            rows={3}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/35"
            placeholder={language === "ar" ? "اكتب سؤالك المناخي..." : "Ask about risk, policy, simulation, or city status..."}
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Assistant stays grounded in the currently selected city, timeline, and climate layer.
            </p>
            <button
              className="inline-flex items-center gap-2 rounded-2xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={submitQuestion}
              disabled={isSending}
            >
              <Send className="h-4 w-4" />
              {isSending ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
