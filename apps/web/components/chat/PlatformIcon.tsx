import { Slack, Users, Phone, Mail, MessageSquare } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const PLATFORM_ICONS: Record<string, LucideIcon> = {
  slack: Slack,
  teams: Users,
  whatsapp: Phone,
  email: Mail,
  telegram: Phone,
};

interface PlatformIconProps {
  platform: string;
  className?: string;
}

export function PlatformIcon({ platform, className = "w-3 h-3" }: PlatformIconProps) {
  const Icon = PLATFORM_ICONS[platform] ?? MessageSquare;
  return <Icon className={className} />;
}