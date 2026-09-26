"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { track } from "@vercel/analytics";
import { Command } from "cmdk";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { isAdminUser } from "@/lib/admin";
import { ShortcutLabel } from "./shortcut-label";

interface CommandItem {
  id: string;
  label: string;
  shortcut?: string[];
  action: () => void;
  icon?: string;
  group: string;
  disabled?: boolean;
}

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const show = () => setOpen(true);
    document.addEventListener("site:search", show);
    return () => document.removeEventListener("site:search", show);
  }, []);
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const { openSignIn, openUserProfile, signOut } = useClerk();
  const pendingAccountAction = useRef<(() => void) | null>(null);
  const [accountError, setAccountError] = useState("");
  const closeThen = (action: () => void) => {
    pendingAccountAction.current = action;
    setAccountError("");
    setOpen(false);
  };

  const isAdmin = useMemo(() => {
    return isAdminUser(user?.id);
  }, [user]);

  const openBooking = useCallback(() => {
    track("book_call_click", { source: "cmdk" });
    window.open(
      "https://cal.com/tetraslam/30min",
      "_blank",
      "noopener,noreferrer",
    );
    setOpen(false);
  }, []);

  const navigate = useCallback(
    (path: string) => {
      track("cmdk_action", { action: "navigate", path });
      router.push(path);
      setOpen(false);
    },
    [router],
  );

  const openExternal = useCallback((url: string, label: string) => {
    track("cmdk_action", { action: "external", url, label });
    track("external_link_click", { url, label, source: "cmdk" });
    window.open(url, "_blank");
    setOpen(false);
  }, []);

  const openResume = useCallback(() => {
    track("cmdk_action", { action: "resume" });
    track("resume_download", { source: "cmdk" });
    window.open("/resume.pdf", "_blank");
    setOpen(false);
  }, []);

  const commands: CommandItem[] = [
    // Admin subroutes (only on /admin pages, shown first for priority)
    ...(isAdmin && pathname.startsWith("/admin")
      ? [
          {
            id: "admin-homepage",
            label: "admin / homepage bio",
            action: () => navigate("/admin/homepage"),
            group: "admin pages",
            icon: "~",
          },
          {
            id: "admin-overview",
            label: "admin / overview",
            action: () => navigate("/admin"),
            group: "admin pages",
            icon: "~",
          },
          {
            id: "admin-work",
            label: "admin / work",
            action: () => navigate("/admin/work"),
            group: "admin pages",
            icon: ">",
          },
          {
            id: "admin-friends",
            label: "admin / friends",
            action: () => navigate("/admin/friends"),
            group: "admin pages",
            icon: "@",
          },
          {
            id: "admin-media",
            label: "admin / media",
            action: () => navigate("/admin/media"),
            group: "admin pages",
            icon: "*",
          },
          {
            id: "admin-links",
            label: "admin / links",
            action: () => navigate("/admin/links"),
            group: "admin pages",
            icon: "&",
          },
          {
            id: "admin-taste",
            label: "admin / taste",
            action: () => navigate("/admin/taste"),
            group: "admin pages",
            icon: "<>",
          },
          {
            id: "admin-suggestions",
            label: "admin / suggestions",
            action: () => navigate("/admin/link-suggestions"),
            group: "admin pages",
            icon: "?",
          },
          {
            id: "admin-travel",
            label: "admin / travel",
            action: () => navigate("/admin/travel"),
            group: "admin pages",
            icon: "^",
          },
          {
            id: "admin-gallery",
            label: "admin / gallery",
            action: () => navigate("/admin/gallery"),
            group: "admin pages",
            icon: "[]",
          },
          {
            id: "admin-emails",
            label: "admin / emails",
            action: () => navigate("/admin/emails"),
            group: "admin pages",
            icon: "✉",
          },
        ]
      : []),
    // Navigation
    {
      id: "home",
      label: "home",
      shortcut: ["H"],
      action: () => navigate("/"),
      group: "navigation",
      icon: "~",
    },
    {
      id: "work",
      label: "work",
      shortcut: ["W"],
      action: () => navigate("/work"),
      group: "navigation",
      icon: ">",
    },
    {
      id: "writing",
      label: "writing",
      shortcut: ["R"],
      action: () => navigate("/blog"),
      group: "navigation",
      icon: "#",
    },
    {
      id: "friends",
      label: "friends",
      shortcut: ["F"],
      action: () => navigate("/friends"),
      group: "navigation",
      icon: "@",
    },
    {
      id: "media",
      label: "media",
      shortcut: ["M"],
      action: () => navigate("/media"),
      group: "navigation",
      icon: "*",
    },
    {
      id: "links",
      label: "links",
      shortcut: ["L"],
      action: () => navigate("/links"),
      group: "navigation",
      icon: "&",
    },
    {
      id: "taste",
      label: "taste",
      action: () => navigate("/taste"),
      group: "navigation",
      icon: "<>",
    },
    {
      id: "travel",
      label: "travel",
      shortcut: ["T"],
      action: () => navigate("/travel"),
      group: "navigation",
      icon: "^",
    },
    {
      id: "pixels",
      label: "pixel board",
      shortcut: ["P"],
      action: () => navigate("/pixels"),
      group: "navigation",
      icon: "%",
    },
    {
      id: "gallery",
      label: "gallery",
      shortcut: ["G"],
      action: () => navigate("/gallery"),
      group: "navigation",
      icon: "[]",
    },

    // External
    {
      id: "twitter",
      label: "twitter",
      action: () => openExternal("https://twitter.com/tetraslam", "twitter"),
      group: "external",
      icon: "x",
    },
    {
      id: "github",
      label: "github",
      action: () => openExternal("https://github.com/tetraslam", "github"),
      group: "external",
      icon: "gh",
    },
    {
      id: "email",
      label: "email",
      action: () => openExternal("mailto:bhowmickshresht@gmail.com", "email"),
      group: "external",
      icon: "@",
    },
    {
      id: "book-call",
      label: "book a call",
      shortcut: ["C"],
      action: openBooking,
      group: "external",
      icon: "cal",
    },

    // Meta
    {
      id: "resume",
      label: "resume",
      action: openResume,
      group: "meta",
      icon: "pdf",
    },
    {
      id: "sitemap",
      label: "sitemap",
      action: () => {
        track("cmdk_action", { action: "sitemap" });
        window.open("/sitemap.xml", "_blank");
        setOpen(false);
      },
      group: "meta",
      icon: "/",
    },
    {
      id: "rss",
      label: "writing rss",
      action: () =>
        openExternal("https://blog.tetraslam.world/rss", "blog_rss"),
      group: "meta",
      icon: "rss",
    },
    {
      id: "admin",
      label: "admin dashboard",
      shortcut: isAdmin ? ["A"] : undefined,
      action: () => navigate("/admin"),
      group: "account",
      icon: "!",
    },
    ...(user
      ? [
          {
            id: "account",
            label: "manage account",
            action: () => closeThen(() => openUserProfile()),
            group: "account",
            icon: "@",
          },
          {
            id: "sign-out",
            label: "sign out",
            action: () =>
              closeThen(() => {
                void signOut({ redirectUrl: "/" }).catch(() => {
                  setAccountError("couldn’t sign out. please try again.");
                  setOpen(true);
                });
              }),
            group: "account",
            icon: "↗",
          },
        ]
      : [
          {
            id: "sign-in",
            label: "sign in",
            disabled: !isLoaded,
            action: () => closeThen(() => openSignIn()),
            group: "account",
            icon: "@",
          },
        ]),
  ];

  // Keep refs in sync so the global keydown handler stays stable
  const commandsRef = useRef<CommandItem[]>(commands);
  commandsRef.current = commands;
  const openRef = useRef(open);
  openRef.current = open;

  // Toggle with cmd+k / ctrl+k, plus global single-key shortcuts
  useEffect(() => {
    const isTypingTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      return (
        target.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
      );
    };

    const down = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing || e.repeat) return;
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      // Escape to close
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }

      // Global single-key shortcuts (underlined in the
      // palette). Only when the palette is closed and focus isn't in a
      // text field.
      if (
        openRef.current ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey ||
        document.querySelector('[role="dialog"]') ||
        isTypingTarget(e.target)
      ) {
        return;
      }
      const key = e.key.toUpperCase();
      const match = commandsRef.current.find(
        (cmd) => cmd.shortcut?.length === 1 && cmd.shortcut[0] === key,
      );
      if (match) {
        e.preventDefault();
        track("cmdk_shortcut", { key, command: match.id });
        match.action();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Group commands
  const groups = commands.reduce(
    (acc, cmd) => {
      if (!acc[cmd.group]) acc[cmd.group] = [];
      acc[cmd.group].push(cmd);
      return acc;
    },
    {} as Record<string, CommandItem[]>,
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="p-0 overflow-hidden"
        aria-describedby={undefined}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          document
            .querySelector<HTMLButtonElement>(".nav-search")
            ?.focus({ preventScroll: true });
          if (pendingAccountAction.current) {
            const action = pendingAccountAction.current;
            pendingAccountAction.current = null;
            action();
            return;
          }
        }}
      >
        <DialogTitle className="sr-only">Find a page</DialogTitle>
        <Command
          className="bg-surface border border-border rounded-lg shadow-2xl overflow-hidden"
          loop
        >
          <Command.Input
            placeholder="find a page"
            aria-label="Find a page"
            className="w-full px-4 py-3 bg-transparent border-b border-border text-foreground placeholder:text-muted-foreground outline-none"
          />

          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="px-4 py-8 text-center text-muted-foreground text-sm">
              nothing found.
            </Command.Empty>

            {Object.entries(groups).map(([group, items]) => (
              <Command.Group
                key={group}
                heading={group}
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider"
              >
                {items.map((item) => (
                  <Command.Item
                    key={item.id}
                    value={item.label}
                    aria-keyshortcuts={item.shortcut?.join(" ")}
                    onSelect={item.action}
                    disabled={item.disabled}
                    className="flex items-center gap-3 px-3 py-2 rounded cursor-pointer text-foreground data-[selected=true]:bg-rose/10 data-[selected=true]:text-rose transition-colors"
                  >
                    {item.icon && (
                      <span className="w-6 text-center text-muted-foreground font-bold">
                        {item.icon}
                      </span>
                    )}
                    <span className="flex-1">
                      <ShortcutLabel
                        label={item.label}
                        shortcut={item.shortcut?.[0]}
                      />
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </Command.List>
          {accountError && (
            <p className="px-4 py-2 text-sm text-destructive" role="alert">
              {accountError}
            </p>
          )}

          <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground flex justify-between">
            <span>
              <kbd className="px-1 bg-background rounded border border-border">
                ↑↓
              </kbd>{" "}
              navigate
            </span>
            <span>
              <kbd className="px-1 bg-background rounded border border-border">
                ↵
              </kbd>{" "}
              select
            </span>
            <span>
              <kbd className="px-1 bg-background rounded border border-border">
                esc
              </kbd>{" "}
              close
            </span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
