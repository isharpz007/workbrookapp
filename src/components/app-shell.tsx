"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  Home,
  PlusCircle,
  BookOpen,
  FolderOpen,
  UserRound,
  ShieldCheck,
  Menu,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import { mapAuthError } from "@/lib/auth-errors";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  { href: "/profile", label: "Profile", icon: UserRound },
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

function getProfileName(user: User) {
  const fullName = user.user_metadata?.full_name;
  return typeof fullName === "string" && fullName.trim()
    ? fullName.trim()
    : user.email ?? "Your profile";
}

function getInitials(name: string) {
  return name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function SidebarProfile({
  user,
  signingOut,
  onSignOut,
}: {
  user: User | null;
  signingOut?: boolean;
  onSignOut?: () => void;
}) {
  if (!user) {
    return (
      <div className="mt-auto border-t border-white/15 px-5 py-4">
        <p className="mb-3 text-xs text-white/60">Who helped you land work.</p>
        <Link
          href="/login"
          className="block rounded-lg bg-white/10 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/15"
        >
          Sign in to your account
        </Link>
      </div>
    );
  }

  const name = getProfileName(user);

  return (
    <div className="mt-auto border-t border-white/15 px-4 py-4">
      <Link
        href="/profile"
        aria-label={`Open profile for ${name}`}
        className="flex min-w-0 items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-semibold text-white"
        >
          {getInitials(name) || "U"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{name}</p>
          {user.email && name !== user.email && (
            <p className="truncate text-xs text-white/60">{user.email}</p>
          )}
        </div>
      </Link>
      {onSignOut && (
        <button
          type="button"
          onClick={onSignOut}
          disabled={signingOut}
          className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-white/75 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-60"
        >
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      )}
    </div>
  );
}

function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_3px_rgba(0,0,0,0.06)] md:hidden"
    >
      <div className="grid grid-cols-4">
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
  const [user, setUser] = useState<User | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    let supabase: ReturnType<typeof createClient>;

    try {
      supabase = createClient();
    } catch {
      return;
    }

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (active && !error) setUser(data.session?.user ?? null);
      })
      .catch(() => {
        if (active) setUser(null);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      const { error } = await createClient().auth.signOut();
      if (error) {
        toast.error(mapAuthError(error.message));
        return;
      }
      router.refresh();
    } catch (error) {
      toast.error(mapAuthError((error as Error)?.message));
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-brand md:flex">
        <Brand />
        <Suspense fallback={null}>
          <NavLinks />
        </Suspense>
        <SidebarProfile
          user={user}
          signingOut={signingOut}
          onSignOut={user ? handleSignOut : undefined}
        />
      </aside>

      {/* Nav panel — slides in from the left */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-60 bg-brand p-0">
          <Brand />
          <Suspense fallback={null}>
            <NavLinks onNavigate={() => setOpen(false)} />
          </Suspense>
          <SidebarProfile
            user={user}
            signingOut={signingOut}
            onSignOut={user ? handleSignOut : undefined}
          />
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
        <Link
          href="/settings"
          aria-label="Settings"
          title="Settings"
          className="ml-auto inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Settings className="size-5" aria-hidden />
        </Link>
      </header>

      <main className="flex-1 pt-14 md:pl-60">
        <div className="mx-auto w-full max-w-5xl p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8">
          {children}
        </div>
      </main>

      <Suspense fallback={null}>
        <BottomNav />
      </Suspense>
    </div>
  );
}
