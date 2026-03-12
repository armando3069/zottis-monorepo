"use client";

import { useState } from "react";
import { X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import type { ConversationViewModel } from "@/lib/types";
import type { ContactInfoPatch } from "@/services/conversations/conversations.types";

interface ContactFormState {
  email:    string;
  phone:    string;
  country:  string;
  language: string;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 text-[13px] border border-[var(--border-default)] rounded-[var(--radius-input)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/10 focus:border-[var(--accent-primary)]/30 placeholder-[var(--text-tertiary)] text-[var(--text-primary)]"
      />
    </div>
  );
}

export function EditContactModal({
  conversation,
  onSave,
  onClose,
}: {
  conversation: ConversationViewModel;
  onSave: (patch: ContactInfoPatch) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ContactFormState>({
    email:    conversation.contactEmail    ?? "",
    phone:    conversation.contactPhone    ?? "",
    country:  conversation.contactCountry  ?? "",
    language: conversation.contactLanguage ?? "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        contactEmail:    form.email    || null,
        contactPhone:    form.phone    || null,
        contactCountry:  form.country  || null,
        contactLanguage: form.language || null,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-[var(--bg-surface)] rounded-[var(--radius-card)] shadow-[var(--shadow-dropdown)] focus:outline-none">
          {/* Modal header */}
          <div className="flex items-center justify-between p-5 border-b border-[var(--border-subtle)]">
            <div>
              <Dialog.Title className="font-medium text-[15px] text-[var(--text-primary)]">Edit Contact Info</Dialog.Title>
              <Dialog.Description className="text-[12px] text-[var(--text-tertiary)] mt-0.5">{conversation.contact}</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="p-1.5 hover:bg-[var(--bg-surface-hover)] rounded-[var(--radius-badge)] transition-colors">
                <X className="w-4 h-4 text-[var(--text-tertiary)]" />
              </button>
            </Dialog.Close>
          </div>

          {/* Form fields */}
          <div className="p-5 space-y-4">
            <Field
              label="Email"
              value={form.email}
              onChange={(v) => setForm((p) => ({ ...p, email: v }))}
              placeholder="contact@example.com"
              type="email"
            />
            <Field
              label="Telefon"
              value={form.phone}
              onChange={(v) => setForm((p) => ({ ...p, phone: v }))}
              placeholder="+40 712 345 678"
            />
            <Field
              label="Țară"
              value={form.country}
              onChange={(v) => setForm((p) => ({ ...p, country: v }))}
              placeholder="România"
            />
            <Field
              label="Limbă"
              value={form.language}
              onChange={(v) => setForm((p) => ({ ...p, language: v }))}
              placeholder="Română"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 px-5 pb-5">
            <button
              onClick={onClose}
              className="px-4 py-2 text-[13px] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] rounded-[var(--radius-button)] transition-colors"
            >
              Anulează
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-[13px] bg-[var(--accent-primary)] text-white rounded-[var(--radius-button)] hover:bg-[var(--accent-primary-hover)] disabled:opacity-60 transition-colors"
            >
              {isSaving ? "Se salvează..." : "Salvează"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
