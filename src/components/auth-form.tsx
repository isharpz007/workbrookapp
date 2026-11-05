"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { getSupabasePublicKey } from "@/lib/supabase/config";
import { mapAuthError } from "@/lib/auth-errors";
import { ERROR_MESSAGES } from "@/lib/error-codes";
import { CircleSlash } from "lucide-react";
import {
  loginSchema,
  signupSchema,
  type LoginInput,
  type SignupInput,
} from "@/lib/validation";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const isSignup = mode === "signup";
  const router = useRouter();
  const [confirmSent, setConfirmSent] = useState(false);

  const configured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!getSupabasePublicKey();

  const form = useForm<SignupInput>({
    resolver: standardSchemaResolver(
      isSignup ? signupSchema : loginSchema
    ) as unknown as Resolver<SignupInput>,
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
  });
  const { register, handleSubmit, formState } = form;

  async function onSubmit(data: SignupInput) {
    try {
      const supabase = createClient();

      if (isSignup) {
        const { data: res, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: { full_name: data.fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) {
          toast.error(mapAuthError(error.message));
          return;
        }
        if (!res.session) {
          setConfirmSent(true); // email confirmation enabled in Supabase
          return;
        }
        toast.success(`Welcome, ${data.fullName.split(" ")[0]}!`);
        router.push("/");
        router.refresh();
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) {
        toast.error(mapAuthError(error.message));
        return;
      }
      toast.success("Welcome back!");
      router.push("/");
      router.refresh();
    } catch (err) {
      toast.error(mapAuthError((err as Error)?.message));
    }
  }

  if (!configured) {
    return (
      <Card className="mx-auto w-full max-w-sm">
        <CardContent className="space-y-4 py-8 text-center">
          <CircleSlash
            className="mx-auto size-10 text-muted-foreground"
            aria-hidden
          />
          <p className="font-medium">{ERROR_MESSAGES.UNAVAILABLE}</p>
        </CardContent>
      </Card>
    );
  }

  if (confirmSent) {
    return (
      <Card className="mx-auto w-full max-w-sm">
        <CardContent className="space-y-4 py-8 text-center">
          <MailCheck className="mx-auto size-10 text-confirmed" aria-hidden />
          <p className="font-medium">Check your email</p>
          <p className="text-sm text-muted-foreground">
            We sent a confirmation link — click it, then come back and log in.
          </p>
          <Link href="/login" className="block">
            <Button variant="outline" className="w-full">
              Go to login
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">
          {isSignup ? "Create your account" : "Welcome back"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {isSignup && (
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                autoComplete="name"
                maxLength={80}
                {...register("fullName")}
              />
              <FieldError message={formState.errors.fullName?.message} />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...register("email")}
            />
            <FieldError message={formState.errors.email?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              {...register("password")}
            />
            <FieldError message={formState.errors.password?.message} />
          </div>

          {isSignup && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                {...register("confirmPassword")}
              />
              <FieldError message={formState.errors.confirmPassword?.message} />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={formState.isSubmitting}>
            {formState.isSubmitting
              ? "Please wait…"
              : isSignup
                ? "Sign up"
                : "Log in"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {isSignup ? (
              <>
                Have an account?{" "}
                <Link href="/login" className="text-link hover:underline">
                  Log in
                </Link>
              </>
            ) : (
              <>
                New here?{" "}
                <Link href="/signup" className="text-link hover:underline">
                  Sign up
                </Link>
              </>
            )}
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
