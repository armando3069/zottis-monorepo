"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Inbox,
  Users,
  Bot,
  Cable,
  TrendingUp,
  LogOut,
  Bell,
  BellOff,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  MessageSquare,
  Mail,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import { useTheme, type Theme } from "@/context/ThemeContext";
import { requestNotificationPermission, getNotificationPermission } from "@/lib/notify";
import { contactsQueryKeys } from "@/services/contacts/contacts.service";
import type { ContactRow } from "@/services/contacts/contacts.types";

// ── Navigation config ─────────────────────────────────────────────────────────

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: typeof Inbox;
}

const PRIMARY_NAV: NavItem[] = [
  { id: "inbox",    label: "Inbox",        href: "/",             icon: Inbox },
  { id: "contacts", label: "Contacts",     href: "/contacts",     icon: Users },
  { id: "ai",       label: "AI Assistant", href: "/ai-assistant", icon: Bot },
];

const SECONDARY_NAV: NavItem[] = [
  { id: "sentiment", label: "Sentiment Analysis", href: "#",                          icon: TrendingUp },
  { id: "platforms", label: "Manage Platforms",    href: "/connect-platforms?manage=1", icon: Cable },
];

// ── Inbox accordion categories ────────────────────────────────────────────────

type InboxCategory = { id: string; label: string; icon: typeof Inbox };

const INBOX_CATEGORIES: InboxCategory[] = [
  { id: "all",    label: "All",    icon: Inbox },
  { id: "chats",  label: "Chats",  icon: MessageSquare },
  { id: "emails", label: "Emails", icon: Mail },
];

// ── Contacts accordion categories ────────────────────────────────────────────

type ContactCategory = { id: string; label: string; lifecycles: string[] | null };

const CONTACT_CATEGORIES: ContactCategory[] = [
  { id: "all",       label: "All",       lifecycles: null },
  { id: "new_leads", label: "New leads", lifecycles: ["NEW_LEAD"] },
  { id: "pitching",  label: "Pitching",  lifecycles: ["HOT_LEAD"] },
  { id: "active",    label: "Active",    lifecycles: ["PAYMENT", "CUSTOMER"] },
  { id: "past",      label: "Past",      lifecycles: ["COLD_LEAD"] },
];

function getCatCount(contacts: ContactRow[], cat: ContactCategory): number {
  if (cat.lifecycles === null) return contacts.length;
  if (cat.lifecycles.length === 0) return contacts.filter((c) => !c.lifecycle_status).length;
  return contacts.filter((c) => cat.lifecycles!.includes(c.lifecycle_status)).length;
}

// ── NavItemButton ─────────────────────────────────────────────────────────────

function NavItemButton({
  item,
  isActive,
  expanded,
}: {
  item: NavItem;
  isActive: boolean;
  expanded: boolean;
}) {
  const content = (
    <Link
      href={item.href}
      className={`
        relative flex items-center gap-2.5 rounded-lg transition-all duration-120 ease-out
        ${expanded ? "px-3 py-2" : "justify-center p-2.5"}
        ${isActive
          ? "bg-[var(--sidebar-item-active)] text-[var(--text-primary)] font-medium shadow-[var(--shadow-xs)]"
          : "text-[var(--text-secondary)] hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--text-primary)]"
        }
      `}
    >
      <item.icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={isActive ? 2 : 1.75} />
      {expanded && <span className="text-[13px] leading-none">{item.label}</span>}
    </Link>
  );

  if (!expanded) {
    return (
      <Tooltip.Root delayDuration={0}>
        <Tooltip.Trigger asChild>{content}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="right"
            sideOffset={12}
            className="z-50 rounded-lg bg-[var(--text-primary)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--bg-surface)] shadow-[var(--shadow-dropdown)] animate-in fade-in-0 zoom-in-95"
          >
            {item.label}
            <Tooltip.Arrow className="fill-[var(--text-primary)]" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    );
  }

  return content;
}

// ── ThemeSwitcher ─────────────────────────────────────────────────────────────

function ThemeSwitcher({ expanded }: { expanded: boolean }) {
  const { theme, setTheme } = useTheme();

  const options: { value: Theme; icon: typeof Sun; label: string }[] = [
    { value: "light",  icon: Sun,     label: "Light" },
    { value: "dark",   icon: Moon,    label: "Dark" },
    { value: "system", icon: Monitor, label: "System" },
  ];

  if (!expanded) {
    const active = options.find((o) => o.value === theme) ?? options[2];
    const Icon = active.icon;
    return (
      <Tooltip.Root delayDuration={0}>
        <Tooltip.Trigger asChild>
          <button
            onClick={() => {
              const idx = options.findIndex((o) => o.value === theme);
              setTheme(options[(idx + 1) % options.length].value);
            }}
            className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--text-secondary)] transition-colors duration-120"
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content side="right" sideOffset={12} className="z-50 rounded-lg bg-[var(--text-primary)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--bg-surface)] shadow-[var(--shadow-dropdown)]">
            {active.label} theme
            <Tooltip.Arrow className="fill-[var(--text-primary)]" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    );
  }

  return (
    <div className="flex items-center gap-1 rounded-lg bg-[var(--under-bg)] p-0.5">
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          title={label}
          className={`flex-1 flex items-center justify-center py-1.5 rounded-md transition-all duration-120 ease-out ${
            theme === value
              ? "bg-[var(--bg-surface)] shadow-[var(--shadow-xs)] text-[var(--text-primary)]"
              : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
        </button>
      ))}
    </div>
  );
}

// ── AppSidebar ────────────────────────────────────────────────────────────────

export function AppSidebar() {
  const pathname       = usePathname();
  const router         = useRouter();
  const searchParams   = useSearchParams();
  const { user, logout }     = useAuth();
  const { expanded, toggle } = useSidebar();

  const onInbox         = pathname === "/";
  const onContacts      = pathname === "/contacts" || pathname.startsWith("/contacts/");
  const currentInboxCat = searchParams.get("inboxCategory") ?? "all";
  const currentCategory = searchParams.get("category") ?? "all";

  const [inboxOpen,    setInboxOpen]    = useState(onInbox);
  const [contactsOpen, setContactsOpen] = useState(onContacts);
  const [notifPermission, setNotifPermission] = useState<string>("default");

  useEffect(() => { if (onInbox)    setInboxOpen(true);    }, [onInbox]);
  useEffect(() => { if (onContacts) setContactsOpen(true); }, [onContacts]);
  useEffect(() => { setNotifPermission(getNotificationPermission()); }, []);

  const { data: contacts = [] } = useQuery({
    ...contactsQueryKeys.list({}),
    staleTime: 30_000,
  });

  const handleEnableNotifications = async () => {
    const result = await requestNotificationPermission();
    setNotifPermission(result);
  };

  const handleLogout = () => {
    logout();
    router.replace("/auth/login");
  };

  const isActive = (item: NavItem) => {
    if (item.href === "/") return pathname === "/";
    return pathname.startsWith(item.href.split("?")[0]);
  };

  const initials = user?.name
    ? user.name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <Tooltip.Provider>

      {/* Add Border right for vizual border-r border-[var(--border-default)] */}
      <div
        className={`
          flex flex-col bg-[var(--sidebar-bg)]  transition-[width] duration-200 ease-in-out
          ${expanded ? "w-[232px]" : "w-[56px]"}
        `}
      >
        {/* ── Logo + Toggle ──────────────────────────────────────────── */}
        <div className={`flex items-center ${expanded ? "justify-between px-4" : "justify-center"} h-14`}>
          {expanded ? (
            <Link href="/inbox" className="flex items-center gap-2.5">
              <Image src="/logo.png" width={100} height={100} alt="logo" className="w-7 h-7 rounded-lg" />
              <span className="text-[14px] font-semibold text-[var(--text-primary)] tracking-tight">AI Inbox</span>
            </Link>
          ) : (
            <Link href="/inbox" className="flex items-center justify-center">
              <Image src="/logo.png" width={100} height={100} alt="logo" className="w-7 h-7 rounded-lg" />
            </Link>
          )}
          {expanded && (
            <button
              onClick={toggle}
              className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--text-secondary)] transition-colors duration-120"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ── Collapsed toggle ────────────────────────────────────────── */}
        {!expanded && (
          <div className="flex justify-center pb-1">
            <button
              onClick={toggle}
              className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--text-secondary)] transition-colors duration-120"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Primary Nav ─────────────────────────────────────────────── */}
        <div className={`flex-1 overflow-y-auto ${expanded ? "px-3" : "px-2"} pt-1 pb-3`}>
          <div className="space-y-0.5">
            {PRIMARY_NAV.map((item) => {

              /* ── Inbox accordion ─────────────────────────────────── */
              if (item.id === "inbox" && expanded) {
                return (
                  <div key="inbox">
                    <button
                      onClick={() => {
                        if (!onInbox) router.push("/inbox");
                        setInboxOpen((o) => !o);
                      }}
                      className={`
                        relative w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-120 ease-out
                        ${onInbox
                          ? "bg-[var(--sidebar-item-active)] text-[var(--text-primary)] font-medium shadow-[var(--shadow-xs)]"
                          : "text-[var(--text-secondary)] hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--text-primary)]"
                        }
                      `}
                    >
                      <Inbox className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={onInbox ? 2 : 1.75} />
                      <span className="text-[13px] leading-none flex-1 text-left">Inbox</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-[var(--text-tertiary)] transition-transform duration-200 ${
                          inboxOpen ? "" : "-rotate-90"
                        }`}
                      />
                    </button>

                    {inboxOpen && (
                      <div className="mt-0.5 space-y-px ml-1">
                        {INBOX_CATEGORIES.map((cat) => {
                          const isActiveCat = onInbox && currentInboxCat === cat.id;
                          return (
                            <Link
                              key={cat.id}
                              href={`/inbox?category=${cat.id}`}
                              className={`
                                flex items-center gap-2 pl-[30px] pr-3 py-[6px] rounded-md text-[13px] transition-all duration-120 ease-out
                                ${isActiveCat
                                  ? "bg-[var(--sidebar-sub-active)] text-[var(--text-primary)] font-medium"
                                  : "text-[var(--text-secondary)] hover:bg-[var(--sidebar-sub-hover)] hover:text-[var(--text-primary)]"
                                }
                              `}
                            >
                              <span>{cat.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              /* ── Contacts accordion ──────────────────────────────── */
              if (item.id === "contacts" && expanded) {
                return (
                  <div key="contacts">
                    <button
                      onClick={() => {
                        if (!onContacts) router.push("/contacts");
                        setContactsOpen((o) => !o);
                      }}
                      className={`
                        relative w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-120 ease-out
                        ${onContacts
                          ? "bg-[var(--sidebar-item-active)] text-[var(--text-primary)] font-medium shadow-[var(--shadow-xs)]"
                          : "text-[var(--text-secondary)] hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--text-primary)]"
                        }
                      `}
                    >
                      <Users className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={onContacts ? 2 : 1.75} />
                      <span className="text-[13px] leading-none flex-1 text-left">Contacts</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-[var(--text-tertiary)] transition-transform duration-200 ${
                          contactsOpen ? "" : "-rotate-90"
                        }`}
                      />
                    </button>

                    {contactsOpen && (
                      <div className="mt-0.5 space-y-px ml-1">
                        {CONTACT_CATEGORIES.map((cat) => {
                          const count       = getCatCount(contacts, cat);
                          const isActiveCat = onContacts && currentCategory === cat.id;
                          return (
                            <Link
                              key={cat.id}
                              href={`/contacts?category=${cat.id}`}
                              className={`
                                flex items-center justify-between gap-2 pl-[30px] pr-3 py-[6px] rounded-md text-[13px] transition-all duration-120 ease-out
                                ${isActiveCat
                                  ? "bg-[var(--sidebar-sub-active)] text-[var(--text-primary)] font-medium"
                                  : "text-[var(--text-secondary)] hover:bg-[var(--sidebar-sub-hover)] hover:text-[var(--text-primary)]"
                                }
                              `}
                            >
                              <span>{cat.label}</span>
                              {count > 0 && (
                                <span className={`text-[11px] tabular-nums ${
                                  isActiveCat ? "text-[var(--text-secondary)]" : "text-[var(--text-tertiary)]"
                                }`}>
                                  {count}
                                </span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <NavItemButton key={item.id} item={item} isActive={isActive(item)} expanded={expanded} />
              );
            })}
          </div>

          {/* ── Tools section ──────────────────────────────────────────── */}
          <div className="mt-6 pt-4 border-t border-[var(--border-default)]">
            {expanded && (
              <div className="px-3 mb-2">
                <span className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-widest">
                  Tools
                </span>
              </div>
            )}
            <div className="space-y-0.5">
              {SECONDARY_NAV.map((item) => (
                <NavItemButton key={item.id} item={item} isActive={isActive(item)} expanded={expanded} />
              ))}
            </div>

            {/* ── Notifications ──────────────────────────────────────── */}
            {expanded && (
              <div className="mt-4 pt-3 border-t border-[var(--border-default)]">
                {notifPermission === "unavailable" ? null : notifPermission === "granted" ? (
                  <div className="flex items-center gap-2.5 px-3 py-2 text-emerald-600 dark:text-emerald-500 rounded-lg">
                    <Bell className="w-4 h-4" />
                    <span className="text-[12px] font-medium">Notifications on</span>
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </div>
                ) : notifPermission === "denied" ? (
                  <div className="flex items-center gap-2.5 px-3 py-2 text-[var(--text-tertiary)]">
                    <BellOff className="w-4 h-4" />
                    <span className="text-[12px]">Notifications blocked</span>
                  </div>
                ) : (
                  <button
                    onClick={handleEnableNotifications}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[var(--accent-blue)] hover:bg-[var(--sidebar-item-hover)] transition-colors duration-120"
                  >
                    <Bell className="w-4 h-4" />
                    <span className="text-[12px] font-medium">Enable notifications</span>
                  </button>
                )}
              </div>
            )}

            {!expanded && (
              <div className="mt-3 pt-3 border-t border-[var(--border-default)] flex justify-center">
                {notifPermission === "unavailable" ? null : notifPermission === "granted" ? (
                  <Tooltip.Root delayDuration={0}>
                    <Tooltip.Trigger asChild>
                      <div className="relative p-2.5 text-emerald-600 dark:text-emerald-500">
                        <Bell className="w-[18px] h-[18px]" />
                        <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      </div>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content side="right" sideOffset={12} className="z-50 rounded-lg bg-[var(--text-primary)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--bg-surface)] shadow-[var(--shadow-dropdown)]">
                        Notifications on
                        <Tooltip.Arrow className="fill-[var(--text-primary)]" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                ) : notifPermission === "denied" ? (
                  <Tooltip.Root delayDuration={0}>
                    <Tooltip.Trigger asChild>
                      <div className="p-2.5 text-[var(--text-tertiary)]">
                        <BellOff className="w-[18px] h-[18px]" />
                      </div>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content side="right" sideOffset={12} className="z-50 rounded-lg bg-[var(--text-primary)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--bg-surface)] shadow-[var(--shadow-dropdown)]">
                        Notifications blocked
                        <Tooltip.Arrow className="fill-[var(--text-primary)]" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                ) : (
                  <Tooltip.Root delayDuration={0}>
                    <Tooltip.Trigger asChild>
                      <button onClick={handleEnableNotifications} className="p-2.5 rounded-lg text-[var(--accent-blue)] hover:bg-[var(--sidebar-item-hover)] transition-colors duration-120">
                        <Bell className="w-[18px] h-[18px]" />
                      </button>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content side="right" sideOffset={12} className="z-50 rounded-lg bg-[var(--text-primary)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--bg-surface)] shadow-[var(--shadow-dropdown)]">
                        Enable notifications
                        <Tooltip.Arrow className="fill-[var(--text-primary)]" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer: theme switcher + user profile ─────────────────── */}
        <div className={`border-t border-[var(--border-default)] ${expanded ? "px-3 py-3" : "px-2 py-3"}`}>
          {/* Theme switcher */}
          <div className={`mb-2 ${expanded ? "" : "flex justify-center"}`}>
            <ThemeSwitcher expanded={expanded} />
          </div>

          {expanded ? (
            <div className="flex items-center gap-2.5 px-2 py-1">
              {user?.avatar ? (
                <Image src={user.avatar} width={32} height={32} alt={user?.name ?? ""} className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-1 ring-black/[0.06]" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[var(--text-primary)] flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-semibold text-[var(--bg-surface)]">{initials}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[var(--text-primary)] truncate leading-tight">{user?.name ?? "—"}</p>
                <p className="text-[11px] text-[var(--text-tertiary)] truncate leading-tight mt-0.5">{user?.email ?? ""}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-50/50 dark:hover:bg-red-900/20 transition-colors duration-120"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Tooltip.Root delayDuration={0}>
                <Tooltip.Trigger asChild>
                  <div>
                    {user?.avatar ? (
                      <Image src={user.avatar} width={32} height={32} alt={user?.name ?? ""} className="w-8 h-8 rounded-full object-cover ring-1 ring-black/[0.06]" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[var(--text-primary)] flex items-center justify-center">
                        <span className="text-[10px] font-semibold text-[var(--bg-surface)]">{initials}</span>
                      </div>
                    )}
                  </div>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content side="right" sideOffset={12} className="z-50 rounded-lg bg-[var(--text-primary)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--bg-surface)] shadow-[var(--shadow-dropdown)]">
                    {user?.name ?? "—"}
                    <Tooltip.Arrow className="fill-[var(--text-primary)]" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
              <Tooltip.Root delayDuration={0}>
                <Tooltip.Trigger asChild>
                  <button onClick={handleLogout} className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-50/50 dark:hover:bg-red-900/20 transition-colors duration-120">
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content side="right" sideOffset={12} className="z-50 rounded-lg bg-[var(--text-primary)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--bg-surface)] shadow-[var(--shadow-dropdown)]">
                    Log out
                    <Tooltip.Arrow className="fill-[var(--text-primary)]" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </div>
          )}
        </div>
      </div>
    </Tooltip.Provider>
  );
}
