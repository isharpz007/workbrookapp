"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  PlusCircle,
  BookOpen,
  FolderOpen,
  ShieldCheck,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/add", label: "Add a memory", icon: PlusCircle },
  { href: "/memories", label: "Memories", icon: BookOpen },
  { href: "/my-entries", label: "My entries", icon: FolderOpen },
  { href: "/privacy", label: "Privacy", icon: ShieldCheck },
];

// Primary tabs in the bottom bar — the rest live behind Menu.
const BOTTOM_NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/add", label: "Add a memory", icon: PlusCircle },
  { href: "/my-entries", label: "My entries", icon: FolderOpen },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white",
            isActive(pathname, href) && "bg-white/15 text-white"
          )}
        >
          <Icon className="size-4" aria-hidden />
          {label}
        </Link>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center px-6 py-5 text-white">
      <span className="text-lg font-semibold tracking-tight">workbrook</span>
    </Link>
  );
}

function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_3px_rgba(0,0,0,0.06)] md:hidden"
    >
      <div className="grid grid-cols-3">
        {BOTTOM_NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          const isAdd = href === "/add";
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-1 px-1 py-2 text-[11px] font-medium transition-colors",
                active ? "text-brand" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isAdd ? (
                <span className="flex size-9 items-center justify-center rounded-full bg-brand text-white shadow-sm">
                  <Icon className="size-5" aria-hidden />
                </span>
              ) : (
                <Icon className="size-5" aria-hidden />
              )}
              {isAdd ? "Add" : label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-brand md:flex">
        <Brand />
        <NavLinks />
        <p className="mt-auto px-6 py-5 text-xs text-white/60">
          Who helped you land work.
        </p>
      </aside>

      {/* Nav panel — slides in from the left */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-60 bg-brand p-0">
          <Brand />
          <NavLinks onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Top bar */}
      <header className="fixed inset-x-0 top-0 z-20 flex h-14 items-center gap-2 border-b bg-white px-4 shadow-sm md:left-60">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
        >
          <Menu className="size-5" />
        </Button>
        <Image
          src="/workbrook-logo.png"
          alt="workbrook"
          width={167}
          height={48}
          priority
          className="h-6 w-auto md:hidden"
        />
        <span className="hidden text-sm font-medium text-muted-foreground md:inline">
          Workbrook Memory
        </span>
      </header>

      <main className="flex-1 pt-14 md:pl-60">
        <div className="mx-auto w-full max-w-5xl p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8">
          {children}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
