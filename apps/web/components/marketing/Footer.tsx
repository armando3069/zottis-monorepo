import Link from "next/link";

const LINKS = [
  {
    heading: "Product",
    items: [
      { label: "Features",  href: "#features" },
      { label: "Download",  href: "#download" },
      { label: "Changelog", href: "#" },
    ],
  },
  {
    heading: "Platforms",
    items: [
      { label: "Telegram",  href: "#" },
      { label: "WhatsApp",  href: "#" },
      { label: "Email",     href: "#" },
    ],
  },
  {
    heading: "Company",
    items: [
      { label: "About",   href: "#" },
      { label: "Blog",    href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white py-12 sm:py-14">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          {/* Brand column */}
          <div className="max-w-xs">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-900">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <span className="text-[15px] font-semibold tracking-tight text-gray-900">
                AI Inbox
              </span>
            </Link>
            <p className="mt-3 text-[13px] leading-relaxed text-gray-500">
              All your customer conversations in one AI-powered inbox.
            </p>
          </div>

          {/* Link columns */}
          <div className="flex flex-wrap gap-12 sm:gap-16">
            {LINKS.map((group) => (
              <div key={group.heading}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">
                  {group.heading}
                </p>
                <ul className="mt-3 space-y-2">
                  {group.items.map((item) => (
                    <li key={item.label}>
                      <a
                        href={item.href}
                        className="text-[13px] text-gray-500 transition-colors hover:text-gray-900"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-gray-100 pt-6 sm:flex-row">
          <p className="text-[12px] text-gray-400">
            &copy; {new Date().getFullYear()} AI Inbox. All rights reserved.
          </p>
          <div className="flex gap-5 text-[12px] text-gray-400">
            <a href="#" className="transition-colors hover:text-gray-600">Privacy</a>
            <a href="#" className="transition-colors hover:text-gray-600">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
