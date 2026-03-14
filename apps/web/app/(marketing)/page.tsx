import type { Metadata } from "next";
import { Navbar } from "@/components/marketing/Navbar";
import { Hero } from "@/components/marketing/Hero";
import { LogoCloud } from "@/components/marketing/LogoCloud";
import { ProblemSolution } from "@/components/marketing/ProblemSolution";
import { Features } from "@/components/marketing/Features";
import { ProductPreview } from "@/components/marketing/ProductPreview";
import { MacDownload } from "@/components/marketing/MacDownload";
import { CTA } from "@/components/marketing/CTA";
import { Footer } from "@/components/marketing/Footer";

export const metadata: Metadata = {
  title: "AI Inbox — All your conversations in one AI-powered inbox",
  description:
    "AI Inbox brings Telegram, WhatsApp and Email into a single intelligent workspace powered by AI. Unified messaging, automated replies, contact management and lead classification.",
};

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
        <LogoCloud />
        <ProblemSolution />
        <Features />
        <ProductPreview />
        <MacDownload />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
