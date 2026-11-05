"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatMemberSince } from "@/lib/format-member-since";
import { safeCall } from "@/lib/client-errors";
import { cn } from "@/lib/utils";
import { getMyEntries } from "@/server/actions/manage";
import { useManageLinks } from "@/stores/manage-links";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowRight,
  BriefcaseBusiness,
  Camera,
  Pencil,
  Quote,
  X,
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
  onRemove,
  className,
  showIcon = false,
}: {
  label: string;
  image: string | null;
  onChange: (value: string) => void;
  onRemove: () => void;
  className: string;
  showIcon?: boolean;
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
      {image ? (
        <div className={cn("relative overflow-hidden", className)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" className="absolute inset-0 size-full object-cover" />
          <button
            type="button"
            aria-label={`Change ${label}`}
            onClick={() => inputRef.current?.click()}
            className="absolute inset-0 size-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
          />
          <button
            type="button"
            aria-label={`Remove ${label}`}
            onClick={onRemove}
            className="absolute right-2 top-2 z-10 flex size-7 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      ) : (
        <button
          type="button"
          aria-label={`Add ${label}`}
          onClick={() => inputRef.current?.click()}
          className={className}
        >
          <span className="inline-flex items-center gap-2 text-sm font-medium">
            {showIcon && <Camera className="size-4" aria-hidden />}
            Add photo
          </span>
        </button>
      )}
    </>
  );
}

function EditableText({
  storageKey,
  label,
  placeholder,
  addLabel,
  editLabel,
  className,
  textClassName,
  maxLength = 500,
  rows = 3,
}: {
  storageKey: string;
  /** Used for the textarea's aria-label, e.g. "Profile description". */
  label: string;
  placeholder: string;
  addLabel: string;
  editLabel: string;
  className?: string;
  textClassName?: string;
  maxLength?: number;
  rows?: number;
}) {
  const [value, setValue] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    setValue(window.localStorage.getItem(storageKey));
  }, [storageKey]);

  function save() {
    const next = draft.trim();
    setValue(next || null);
    try {
      if (next) window.localStorage.setItem(storageKey, next);
      else window.localStorage.removeItem(storageKey);
    } catch {
      // Storage unavailable — keep the text for this visit.
    }
    setEditing(false);
  }

  if (editing) {
    return (
      <div className={cn("space-y-2", className)}>
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={maxLength}
          rows={rows}
          placeholder={placeholder}
          aria-label={label}
          autoFocus
        />
        <div className="flex gap-2">
          <Button type="button" size="sm" onClick={save}>
            Save
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setEditing(false)}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <p
        className={cn(
          "whitespace-pre-line",
          textClassName,
          !value && "italic text-slate-400"
        )}
      >
        {value ?? placeholder}
      </p>
      <button
        type="button"
        onClick={() => {
          setDraft(value ?? "");
          setEditing(true);
        }}
        className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-link transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <Pencil className="size-3" aria-hidden />
        {value ? editLabel : addLabel}
      </button>
    </div>
  );
}

type WorkEntry = Extract<
  Awaited<ReturnType<typeof getMyEntries>>,
  readonly unknown[]
>[number];

const ENTRY_STATUS_LABELS: Record<string, string> = {
  private: "Only me",
  pending_consent: "Not yet confirmed",
  confirmed: "Confirmed",
  hidden: "Hidden (under review)",
  removed: "Removed",
};

function WorkMemoryCard({ entry }: { entry: WorkEntry }) {
  return (
    <Link href={`/manage/${entry.secret}`} className="block h-full">
      <figure className="flex h-full flex-col rounded-xl border bg-slate-50 p-4 transition hover:bg-slate-100">
        <Quote className="size-4 text-brand" aria-hidden />
        <blockquote className="mt-2 flex-1">
          <p className="font-medium leading-snug">{entry.sentence}</p>
        </blockquote>
        <figcaption className="mt-3 flex items-center justify-between gap-3">
          {entry.meta ? (
            <span className="text-xs text-muted-foreground">{entry.meta}</span>
          ) : (
            <span />
          )}
          {entry.status === "confirmed" ||
          entry.status === "pending_consent" ? (
            <StatusBadge confirmed={entry.status === "confirmed"} />
          ) : (
            <span className="shrink-0 text-xs font-medium text-muted-foreground">
              {ENTRY_STATUS_LABELS[entry.status]}
            </span>
          )}
        </figcaption>
      </figure>
    </Link>
  );
}

function WorkMemories() {
  const links = useManageLinks((s) => s.links);
  const [entries, setEntries] = useState<WorkEntry[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const secrets = Object.values(links);
    const load = secrets.length
      ? safeCall(getMyEntries(secrets))
      : Promise.resolve([]);
    load
      .then((rows) => {
        if (!cancelled) setEntries(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (!cancelled) setEntries([]);
      });
    return () => {
      cancelled = true;
    };
  }, [links]);

  if (entries === null) {
    return (
      <div className="mt-4 space-y-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <Link
        href="/add"
        className="mt-4 flex min-h-24 items-center justify-between rounded-xl border border-dashed bg-slate-50 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
      >
        Add your first work memory{" "}
        <ArrowRight className="size-4 text-brand" aria-hidden />
      </Link>
    );
  }

  const helpedMe = entries.filter((e) => e.direction === "someone_helped_me");
  const iHelped = entries.filter((e) => e.direction === "i_helped_someone");

  return (
    <div className="mt-4 space-y-4">
      {helpedMe.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700">
            People who helped me
          </h3>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {helpedMe.map((e) => (
              <WorkMemoryCard key={e.id} entry={e} />
            ))}
          </div>
        </div>
      )}
      {iHelped.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700">
            People I helped
          </h3>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {iHelped.map((e) => (
              <WorkMemoryCard key={e.id} entry={e} />
            ))}
          </div>
        </div>
      )}
      <Link
        href="/my-entries"
        className="inline-flex items-center gap-1 text-sm font-medium text-link hover:underline"
      >
        Manage all entries <ArrowRight className="size-4" aria-hidden />
      </Link>
    </div>
  );
}

export function UserProfile({ userId, name, avatarUrl, createdAt }: UserProfileProps) {
  const [cover, setCover] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(avatarUrl);
  const coverKey = `workbrook:profile:${userId}:cover`;
  const avatarKey = `workbrook:profile:${userId}:avatar`;
  const bioKey = `workbrook:profile:${userId}:bio`;
  const aboutKey = `workbrook:profile:${userId}:about`;

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

  function removeImage(key: string, setImage: (value: string | null) => void) {
    return () => {
      setImage(null);
      try {
        window.localStorage.removeItem(key);
      } catch {
        // Storage unavailable — removal still applies for this visit.
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
            showIcon
            image={cover}
            onChange={saveImage(coverKey, setCover)}
            onRemove={removeImage(coverKey, setCover)}
            className="flex size-full items-center justify-center border-b border-dashed border-slate-300 text-slate-500 transition hover:bg-slate-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
          />
        </div>

        <div className="relative px-5 pb-5 sm:px-8 sm:pb-7">
          <div className="-mt-9 flex size-[76px] items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white shadow-sm sm:-mt-11 sm:size-24">
            <PhotoPicker
              label="profile photo"
              image={avatar}
              onChange={saveImage(avatarKey, setAvatar)}
              onRemove={removeImage(avatarKey, setAvatar)}
              className="flex size-full items-center justify-center overflow-hidden rounded-xl bg-slate-50 text-slate-500 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            />
          </div>

          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="break-words text-2xl font-semibold tracking-tight sm:text-3xl">{name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">Member since {memberSince}</p>
              <EditableText
                storageKey={bioKey}
                label="Profile description"
                placeholder="Tell people a little about yourself…"
                addLabel="Add a description"
                editLabel="Edit description"
                className="mt-3 max-w-2xl"
                textClassName="text-sm leading-6 text-slate-600 sm:text-base"
              />
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
            <EditableText
              storageKey={aboutKey}
              label="About you"
              placeholder="Tell people a little about yourself"
              addLabel="Write about yourself"
              editLabel="Edit"
              className="mt-3"
              textClassName="leading-7 text-slate-600"
              rows={5}
              maxLength={2000}
            />
            <Link href="/my-entries" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-link hover:underline">
              View your work memories <ArrowRight className="size-4" aria-hidden />
            </Link>
          </section>
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-foreground/10 sm:p-6">
            <h2 className="text-lg font-semibold">Work memories</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              The people who helped you find work and the people you have helped.
            </p>
            <WorkMemories />
          </section>
        </div>

      </section>
    </main>
  );
}
