import { MessageSquare } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-[var(--bg-page)]">
      <div className="text-center">
        <div className="w-14 h-14 flex items-center justify-center mx-auto mb-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-xs)]">
          <MessageSquare className="w-7 h-7 text-[var(--text-tertiary)]" strokeWidth={1.5} />
        </div>
        <h3 className="text-[16px] font-semibold text-[var(--text-primary)] mb-1.5">Selectează o conversație</h3>
        <p className="text-[13px] text-[var(--text-tertiary)] max-w-[260px] mx-auto leading-relaxed">
          Alege o conversație din listă pentru a vizualiza mesajele și a beneficia de funcțiile
          inteligente
        </p>
      </div>
    </div>
  );
}
