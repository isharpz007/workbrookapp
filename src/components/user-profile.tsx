"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatMemberSince } from "@/lib/format-member-since";
import {
  ArrowRight,
  BriefcaseBusiness,
  Camera,
} from "lucide-react";

type UserProfileProps = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
};

function PhotoPicker({
  label,
  image,
  onChange,
  className,
}: {
  label: string;
  image: string | null;
  onChange: (value: string) => void;
  className: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function chooseImage(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      onChange(reader.result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-label={`Choose ${label}`}
        onChange={(event) => {
          chooseImage(event.currentTarget.files?.[0]);
          event.currentTarget.value = "";
        }}
      />
      <button
        type="button"
        aria-label={image ? `Change ${label}` : `Add ${label}`}
        onClick={() => inputRef.current?.click()}
        className={className}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="size-full object-cover" />
        ) : (
          <span className="inline-flex items-center gap-2 text-sm font-medium">
            <Camera className="size-4" aria-hidden /> Add {label}
          </span>
        )}
      </button>
    </>
  );
}

export function UserProfile({ userId, name, avatarUrl, createdAt }: UserProfileProps) {
  const [cover, setCover] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(avatarUrl);
  const coverKey = `workbrook:profile:${userId}:cover`;
  const avatarKey = `workbrook:profile:${userId}:avatar`;

  useEffect(() => {
    setCover(window.localStorage.getItem(coverKey));
    setAvatar(window.localStorage.getItem(avatarKey) ?? avatarUrl);
  }, [coverKey, avatarKey, avatarUrl]);

  function saveImage(key: string, setImage: (value: string) => void) {
    return (value: string) => {
      setImage(value);
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // Keep the preview for this visit if the browser storage is full.
      }
    };
  }

  const memberSince = formatMemberSince(createdAt);

  return (
    <main className="mx-auto w-full max-w-5xl pb-8">
      <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-foreground/10">
        <div className="relative h-36 bg-slate-100 sm:h-52">
          <PhotoPicker
            label="cover photo"
            image={cover}
            onChange={saveImage(coverKey, setCover)}
            className="flex size-full items-center justify-center border-b border-dashed border-slate-300 text-slate-500 transition hover:bg-slate-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
          />
        </div>

        <div className="relative px-5 pb-5 sm:px-8 sm:pb-7">
          <div className="-mt-9 flex size-[76px] items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white shadow-sm sm:-mt-11 sm:size-24">
            <PhotoPicker
              label="profile photo"
              image={avatar}
              onChange={saveImage(avatarKey, setAvatar)}
              className="flex size-full items-center justify-center overflow-hidden rounded-xl bg-slate-50 text-slate-500 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            />
          </div>

          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="break-words text-2xl font-semibold tracking-tight sm:text-3xl">{name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">Member since {memberSince}</p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Your professional profile on Workbrook. Add your photos and share the work memories that matter to you.
              </p>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                <span className="inline-flex items-center gap-2"><BriefcaseBusiness className="size-4 text-brand" aria-hidden />Workbrook member</span>
              </div>
            </div>
            <Link
              href="/my-entries"
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              My work memories <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>

        <nav aria-label="Profile sections" className="border-t px-5 sm:px-8">
          <span className="inline-flex min-h-12 items-center border-b-2 border-brand px-1 text-sm font-medium text-brand">
            Overview
          </span>
        </nav>
      </section>

      <section className="mt-5 grid gap-5">
        <div className="space-y-5">
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-foreground/10 sm:p-6">
            <h2 className="text-lg font-semibold">About {name}</h2>
            <p className="mt-3 leading-7 text-slate-600">
              This is your space to introduce yourself and highlight the people who have helped you grow at work.
            </p>
            <Link href="/my-entries" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-link hover:underline">
              View your work memories <ArrowRight className="size-4" aria-hidden />
            </Link>
          </section>
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-foreground/10 sm:p-6">
            <h2 className="text-lg font-semibold">Work memories</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              The people you have thanked and the work memories you have recorded are collected here.
            </p>
            <Link href="/my-entries" className="mt-4 flex min-h-24 items-center justify-between rounded-xl border border-dashed bg-slate-50 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
              Open your entries <ArrowRight className="size-4 text-brand" aria-hidden />
            </Link>
          </section>
        </div>

      </section>
    </main>
  );
}
