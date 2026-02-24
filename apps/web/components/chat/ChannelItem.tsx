import type { Channel } from "@/lib/types";

interface ChannelItemProps {
  channel: Channel;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function ChannelItem({ channel, isSelected, onSelect }: ChannelItemProps) {
  const Icon = channel.icon;
  return (
    <button
      onClick={() => onSelect(channel.id)}
      className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
        isSelected ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${isSelected ? "text-blue-600" : channel.color}`} />
        <span className="font-medium text-sm">{channel.name}</span>
      </div>
      <span
        className={`text-xs px-2 py-1 rounded-full ${
          isSelected ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
        }`}
      >
        {channel.count}
      </span>
    </button>
  );
}