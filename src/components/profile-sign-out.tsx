"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { mapAuthError } from "@/lib/auth-errors";

export function ProfileSignOut() {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function signOut() {
    setPending(true);
    try {
      const { error } = await createClient().auth.signOut();
      if (error) {
        toast.error(mapAuthError(error.message));
        return;
      }
      router.push("/login");
      router.refresh();
    } catch (error) {
      toast.error(mapAuthError((error as Error)?.message));
    } finally {
      setPending(false);
    }
  }

  return (
    <Button type="button" variant="outline" onClick={signOut} disabled={pending}>
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
