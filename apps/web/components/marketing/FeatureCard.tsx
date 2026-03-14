import type { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
      {/* Icon container */}
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 transition-colors group-hover:bg-gray-200/70">
        <Icon className="h-[18px] w-[18px] text-gray-600" strokeWidth={1.75} />
      </div>

      {/* Content */}
      <h3 className="mt-4 text-[14px] font-semibold text-gray-900 leading-snug">
        {title}
      </h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-gray-500">
        {description}
      </p>
    </div>
  );
}
