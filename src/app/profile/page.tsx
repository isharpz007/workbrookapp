import { Suspense } from "react";
import { connection } from "next/server";
import type { Metadata } from "next";
import Link from "next/link";
import { UserProfile } from "@/components/user-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false },
};

async function ProfileContent() {
  await connection(); // render at request time — supabase auth uses Date.now()
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-lg py-8">
        <Card>
          <CardHeader>
            <CardTitle>Your profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Sign in to view your account profile.
            </p>
            <Link href="/login" className={buttonVariants()}>
              Sign in
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const metadataName =
    user.user_metadata?.full_name ?? user.user_metadata?.name;
  const name =
    typeof metadataName === "string" && metadataName.trim()
      ? metadataName.trim()
      : user.email?.split("@")[0] ?? "Your profile";
  const avatarUrl =
    typeof user.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : null;

  return (
    <UserProfile
      userId={user.id}
      name={name}
      avatarUrl={avatarUrl}
      createdAt={user.created_at}
    />
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg py-8">
          <Card>
            <CardContent className="space-y-4 py-6">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="h-4 w-56" />
            </CardContent>
          </Card>
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
