"use client";

import { useEffect, useState } from "react";
import DOMPurify from "dompurify";

// ── DOMPurify configuration ───────────────────────────────────────────────────
// Allowlist-based sanitisation. Scripts, event handlers and `javascript:`
// hrefs are blocked by DOMPurify by default.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PURIFY_CONFIG: any = {
  ALLOWED_TAGS: [
    "a", "abbr", "address", "b", "blockquote", "br", "caption", "center",
    "cite", "code", "col", "colgroup", "dd", "del", "dfn", "dir", "div",
    "dl", "dt", "em", "font", "h1", "h2", "h3", "h4", "h5", "h6", "hr",
    "i", "img", "ins", "kbd", "label", "legend", "li", "map", "menu", "ol",
    "p", "pre", "q", "s", "samp", "small", "span", "strong", "sub", "sup",
    "table", "tbody", "td", "tfoot", "th", "thead", "tr", "tt", "u", "ul",
    "var",
  ],
  ALLOWED_ATTR: [
    "align", "alt", "bgcolor", "border", "cellpadding", "cellspacing", "class",
    "color", "colspan", "dir", "face", "height", "href", "hspace", "id",
    "lang", "rowspan", "size", "src", "style", "target", "title", "valign",
    "vspace", "width",
  ],
  FORCE_BODY: true,
};

// Force all links to open in a new tab
function addTargetBlank(html: string): string {
  return html.replace(/<a(\s[^>]*)>/gi, (_match, attrs: string) => {
    if (attrs.includes("target=")) return `<a${attrs}>`;
    return `<a${attrs} target="_blank" rel="noopener noreferrer">`;
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

interface EmailHtmlViewerProps {
  html: string;
}

export function EmailHtmlViewer({ html }: EmailHtmlViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // ── Client-only sanitisation ──────────────────────────────────────────────
  // DOMPurify requires the browser DOM. We use useEffect (which only runs
  // client-side) so that:
  //   • Server render: shows nothing → no SSR/hydration mismatch
  //   • Client mount: sanitises and injects HTML immediately
  // This is the correct pattern for browser-only libraries in Next.js.
  const [sanitizedHtml, setSanitizedHtml] = useState<string>("");

  useEffect(() => {
    if (!html) {
      setSanitizedHtml("");
      return;
    }
    const clean = DOMPurify.sanitize(html, PURIFY_CONFIG) as unknown as string;
    setSanitizedHtml(addTargetBlank(clean));
  }, [html]);

  // Nothing to show yet (server render or empty content)
  if (!sanitizedHtml) return null;

  // Collapse long emails (> 4 000 chars raw HTML)
  const isLong = html.length > 4000;

  return (
    <div className="pt-5">
      <div
        className={[
          "email-content relative overflow-hidden transition-all duration-300 ease-out",
          isLong && !isExpanded ? "max-h-[500px]" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {/* eslint-disable-next-line react/no-danger */}
        <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />

        {/* Fade-out gradient when collapsed */}
        {isLong && !isExpanded && (
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        )}
      </div>

      {/* Expand / collapse toggle */}
      {isLong && (
        <button
          type="button"
          onClick={() => setIsExpanded((p) => !p)}
          className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-[#6B7280] hover:text-[#111827] transition-colors duration-150"
        >
          <span>{isExpanded ? "▲ Restrânge" : "▼ Afișează tot email-ul"}</span>
        </button>
      )}
    </div>
  );
}
