"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { LIFECYCLE_STAGES, getLifecycleStage } from "@/lib/lifecycle";

export function LifecycleDropdown({
  current,
  onSelect,
}: {
  current: string;
  onSelect: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const stage = getLifecycleStage(current);

  const activeStages = LIFECYCLE_STAGES.filter((s) => s.group === "active");
  const lostStages   = LIFECYCLE_STAGES.filter((s) => s.group === "lost");

  const handleSelect = (value: string) => {
    setIsOpen(false);
    onSelect(value);
  };

  return (
    <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
      {/* Badge / trigger */}
      <DropdownMenu.Trigger asChild>
        <button
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-badge)] border text-[13px] font-medium transition-colors ${stage.badgeClass} hover:opacity-80`}
        >
          <span>{stage.emoji}</span>
          <span>{stage.label}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </DropdownMenu.Trigger>

      {/* Dropdown panel */}
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={6}
          className="w-48 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-button)] shadow-[var(--shadow-dropdown)] z-50 overflow-hidden py-1 animate-in fade-in-0 zoom-in-95"
        >
          <div className="px-3 pt-2 pb-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              Lifecycle Stages
            </p>
          </div>
          {activeStages.map((s) => (
            <DropdownMenu.Item
              key={s.value}
              onSelect={() => handleSelect(s.value)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-[13px] transition-colors cursor-pointer outline-none ${
                s.value === current
                  ? "bg-[var(--bg-surface-hover)] font-medium text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
              }`}
            >
              <span>{s.emoji}</span>
              <span className="flex-1 text-left">{s.label}</span>
              {s.value === current && <Check className="w-3 h-3 text-[var(--text-tertiary)]" />}
            </DropdownMenu.Item>
          ))}

          <DropdownMenu.Separator className="h-px bg-[var(--border-subtle)] my-1" />
          <div className="px-3 pb-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              Lost Stages
            </p>
          </div>
          {lostStages.map((s) => (
            <DropdownMenu.Item
              key={s.value}
              onSelect={() => handleSelect(s.value)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-[13px] transition-colors cursor-pointer outline-none ${
                s.value === current
                  ? "bg-[var(--bg-surface-hover)] font-medium text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
              }`}
            >
              <span>{s.emoji}</span>
              <span className="flex-1 text-left">{s.label}</span>
              {s.value === current && <Check className="w-3 h-3 text-[var(--text-tertiary)]" />}
            </DropdownMenu.Item>
          ))}
          <div className="h-1" />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
