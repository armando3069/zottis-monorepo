interface EmailPlainTextViewProps {
  text: string;
}

/** Footer / noise patterns common in marketing & transactional emails. */
const FOOTER_TRIGGERS = [
  /unsubscribe/i,
  /you('re| are) receiving this/i,
  /to stop receiving/i,
  /manage your (email )?preferences/i,
  /view (this email|in browser)/i,
  /if you no longer wish/i,
  /\u00a9\s*\d{4}/,           // © 2024
  /all rights reserved/i,
  /privacy policy/i,
  /terms of service/i,
];

/**
 * Cleans plain text email body for rendering:
 * - Removes trailing footer blocks at the first footer trigger line
 * - Collapses runs of 3+ blank lines to 2
 * - Removes bare very-long URLs (> 80 chars)
 */
export function cleanEmailPlainText(text: string): string {
  const lines = text.split("\n");

  const trimmedLines: string[] = [];
  for (const line of lines) {
    const stripped = line.trim();
    if (FOOTER_TRIGGERS.some((re) => re.test(stripped))) break;
    trimmedLines.push(line);
  }

  return trimmedLines
    .join("\n")
    // Collapse 3+ blank lines → 2
    .replace(/\n{3,}/g, "\n\n")
    // Remove bare long URLs (keep short meaningful ones)
    .replace(/https?:\/\/\S{80,}/g, "[link]")
    .trim();
}

export function EmailPlainTextView({ text }: EmailPlainTextViewProps) {
  const cleaned = cleanEmailPlainText(text);

  if (!cleaned) {
    return (
      <p className="pt-5 text-[13px] text-[#9CA3AF] italic">
        (no text content)
      </p>
    );
  }

  return (
    <div className="pt-5">
      <pre className="whitespace-pre-wrap font-sans text-[14px] leading-relaxed text-[#374151] break-words">
        {cleaned}
      </pre>
    </div>
  );
}
