import {
  Inbox,
  Bot,
  UserCircle,
  BookOpen,
  TrendingUp,
  Heart,
} from "lucide-react";
import { FeatureCard } from "./FeatureCard";

const FEATURES = [
  {
    icon: Inbox,
    title: "Unified Inbox",
    description:
      "All messages from Telegram, WhatsApp and Email in one timeline. Never miss a conversation again.",
  },
  {
    icon: Bot,
    title: "AI Auto-Reply",
    description:
      "An AI assistant that answers customers automatically using your knowledge base and brand voice.",
  },
  {
    icon: UserCircle,
    title: "Contact Intelligence",
    description:
      "Every conversation automatically becomes a structured contact with lifecycle tracking and CRM data.",
  },
  {
    icon: BookOpen,
    title: "Knowledge Base",
    description:
      "Train your AI with documents, PDFs and custom content so it responds like your best team member.",
  },
  {
    icon: TrendingUp,
    title: "Lead Classification",
    description:
      "Automatically detect hot leads, cold prospects and active customers across all channels.",
  },
  {
    icon: Heart,
    title: "Sentiment Analysis",
    description:
      "Understand customer tone and urgency instantly. Prioritize frustrated clients before they churn.",
  },
];

export function Features() {
  return (
    <section id="features" className="bg-gray-50/50 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section header */}
        <div className="flex justify-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">
            Features
          </span>
        </div>
        <h2 className="mt-4 text-center text-[28px] font-semibold leading-tight tracking-tight text-gray-900 sm:text-[34px]">
          Everything you need to manage
          <br className="hidden sm:block" />
          {" "}customer conversations
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-center text-[15px] leading-relaxed text-gray-500">
          A complete workspace for messaging, AI automation, contact
          management and customer intelligence.
        </p>

        {/* Grid */}
        <div className="mt-12 grid grid-cols-1 gap-4 sm:mt-14 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </div>
    </section>
  );
}
