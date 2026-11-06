"use client";

import { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "wb-welcomed";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return true; // storage unavailable — don't block the app
  }
}

/**
 * First-visit welcome screen, styled after the welcome mockup: light page,
 * centered white card, logo, heading, description, brand button.
 * Shows once per device/browser (localStorage), then never again.
 */
export function WelcomeGate({ children }: { children: React.ReactNode }) {
  const stored = useSyncExternalStore(subscribe, getSnapshot, () => true);
  const [dismissed, setDismissed] = useState(false);
  const showWelcome = !stored && !dismissed;

  function enter() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore — worst case the welcome shows again next visit
    }
    setDismissed(true);
  }

  return (
    <>
      {children}
      {showWelcome && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Welcome to Workbrook Memory"
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-background px-6 py-10"
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-xl ring-1 ring-foreground/10 sm:p-10">
            <Image
              src="/workbrook-logo.png"
              alt="workbrook"
              width={167}
              height={48}
              priority
              className="mx-auto h-12 w-auto sm:h-14"
            />
            <h1 className="mt-8 text-3xl font-semibold tracking-tight sm:text-4xl">
              Welcome to Workbrook Memory
            </h1>
            <p className="mx-auto mt-4 max-w-xs text-base leading-7 text-muted-foreground sm:max-w-sm">
              A free public record of who helped people land work. No accounts,
              no passwords. Private by default, consent first.
            </p>
            <Button size="lg" onClick={enter} className="mt-10 w-full text-base">
              Get started
              <ArrowRight className="size-5" aria-hidden />
            </Button>
            <p className="mt-5 text-sm text-muted-foreground">
              You&apos;ll only see this once on this device.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
