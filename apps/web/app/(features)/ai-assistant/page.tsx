"use client";

import { useState } from "react";
import { Settings2, BookOpen } from "lucide-react";
import { useAiConfig } from "@/app/(features)/ai-assistant/hooks/useAiConfig";
import { useKnowledgeBase } from "@/app/(features)/ai-assistant/hooks/useKnowledgeBase";
import ConfigurationTab from "@/app/(features)/ai-assistant/components/ConfigurationTab";
import KnowledgeBaseTab from "@/app/(features)/ai-assistant/components/KnowledgeBaseTab";

export default function AiAssistantPage() {
  const [activeTab, setActiveTab] = useState<"configuration" | "knowledge">("configuration");

  const config = useAiConfig();
  const kb = useKnowledgeBase();

  return (
    <div className="flex-1 flex flex-col overflow-hidden rounded-xl bg-[var(--bg-surface)] shadow-[var(--shadow-card)] border border-[var(--border-default)]">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[720px] mx-auto px-6 py-8">

          {/* ── Header ──────────────────────────────────────────────── */}
          <div className="mb-6">
            <h1 className="text-[20px] font-semibold text-[var(--text-primary)] tracking-tight leading-none">
              AI Assistant
            </h1>
            <p className="text-[13px] text-[var(--text-tertiary)] mt-1 leading-relaxed">
              Configurează asistentul inteligent pentru conversații automate și gestionează baza de cunoștințe.
            </p>
          </div>

          {/* ── Segmented Tabs ───────────────────────────────────────── */}
          <div className="mb-8 inline-flex gap-1 rounded-xl bg-[var(--border-subtle)] p-1">
            <button
              onClick={() => setActiveTab("configuration")}
              className={`flex items-center gap-2 rounded-[10px] px-4 py-2 text-[13px] font-medium transition-all duration-150 ease-out ${
                activeTab === "configuration"
                  ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-xs)]"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              }`}
            >
              <Settings2 className="h-3.5 w-3.5" />
              Configuration
            </button>
            <button
              onClick={() => setActiveTab("knowledge")}
              className={`flex items-center gap-2 rounded-[10px] px-4 py-2 text-[13px] font-medium transition-all duration-150 ease-out ${
                activeTab === "knowledge"
                  ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-xs)]"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Knowledge Base
            </button>
          </div>

          {/* ── Tab content ──────────────────────────────────────────── */}
          {activeTab === "configuration" && <ConfigurationTab config={config} />}
          {activeTab === "knowledge" && <KnowledgeBaseTab kb={kb} />}
        </div>
      </div>
    </div>
  );
}
