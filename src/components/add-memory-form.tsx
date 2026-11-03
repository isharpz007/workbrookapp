"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { toast } from "sonner";
import { Copy, Download, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SentencePreview } from "@/components/sentence-preview";
import { TurnstileField } from "@/components/turnstile-field";
import { createMemory } from "@/server/actions/memories";
import {
  memoryInputSchema,
  type MemoryFormValues,
  type MemoryInput,
} from "@/lib/validation";
import { MAX_YEAR, MIN_YEAR } from "@/lib/constants";
import { useDraft } from "@/stores/draft";
import { useManageLinks } from "@/stores/manage-links";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}

export function AddMemoryForm() {
  const initial = useMemo(() => useDraft.getState().draft, []);
  const setDraft = useDraft((s) => s.setDraft);
  const clearDraft = useDraft((s) => s.clear);
  const saveLink = useManageLinks((s) => s.save);

  const [saved, setSaved] = useState<{ id: string; secret: string } | null>(null);

  const form = useForm<MemoryFormValues, unknown, MemoryInput>({
    resolver: standardSchemaResolver(memoryInputSchema),
    defaultValues: initial,
  });
  const { register, control, handleSubmit, watch, setValue, formState, reset } =
    form;

  // Autosave the draft so a refresh loses nothing.
  useEffect(() => {
    const sub = watch((values) => setDraft(values as MemoryFormValues));
    return () => sub.unsubscribe();
  }, [watch, setDraft]);

  const values = watch();
  const isPublic = values.visibility === "public";

  async function onSubmit(data: MemoryInput) {
    const res = await createMemory(data);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    saveLink(res.id, res.manageSecret);
    clearDraft();
    reset();
    setSaved({ id: res.id, secret: res.manageSecret });
  }

  const manageUrl =
    saved && typeof window !== "undefined"
      ? `${window.location.origin}/manage/${saved.secret}`
      : "";

  function downloadLink() {
    if (!manageUrl) return;
    const blob = new Blob(
      [
        `Your private Workbrook Memory manage link\n\n${manageUrl}\n\nKeep it safe — it is the only way to edit or remove this entry.\n`,
      ],
      { type: "text/plain" }
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "workbrook-manage-link.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card>
        <CardHeader>
          <CardTitle>Tell us what happened</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
            noValidate
          >
            <Controller
              control={control}
              name="direction"
              render={({ field }) => (
                <Tabs
                  value={field.value}
                  onValueChange={(v) => field.onChange(v)}
                >
                  <TabsList className="w-full">
                    <TabsTrigger value="someone_helped_me" className="flex-1">
                      Someone helped me
                    </TabsTrigger>
                    <TabsTrigger value="i_helped_someone" className="flex-1">
                      I helped someone
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Work or job</Label>
                <Input
                  id="jobTitle"
                  placeholder=""
                  maxLength={80}
                  {...register("jobTitle")}
                />
                <FieldError message={formState.errors.jobTitle?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">
                  Year <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="year"
                  type="number"
                  inputMode="numeric"
                  placeholder=""
                  min={MIN_YEAR}
                  max={MAX_YEAR}
                  {...register("year")}
                />
                <FieldError message={formState.errors.year?.message} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="personFirstName">Their name</Label>
                <div className="flex gap-2">
                  <Input
                    id="personFirstName"
                    placeholder=""
                    maxLength={60}
                    className="flex-1"
                    {...register("personFirstName")}
                  />
                  <Input
                    id="personLastInitial"
                    placeholder="O."
                    maxLength={1}
                    className="w-14 text-center"
                    aria-label="Last initial"
                    {...register("personLastInitial")}
                  />
                </div>
                <FieldError
                  message={
                    formState.errors.personFirstName?.message ??
                    formState.errors.personLastInitial?.message
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="personCity">City and state</Label>
                <div className="flex gap-2">
                  <Input
                    id="personCity"
                    placeholder=""
                    maxLength={80}
                    className="flex-1"
                    {...register("personCity")}
                  />
                  <Input
                    id="personRegion"
                    placeholder="State"
                    maxLength={80}
                    className="w-24"
                    aria-label="State or region"
                    {...register("personRegion")}
                  />
                </div>
                <FieldError
                  message={
                    formState.errors.personCity?.message ??
                    formState.errors.personRegion?.message
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Who can see this?</Label>
              <Controller
                control={control}
                name="visibility"
                render={({ field }) => (
                  <Tabs
                    value={field.value}
                    onValueChange={(v) => field.onChange(v)}
                  >
                    <TabsList className="w-full">
                      <TabsTrigger value="only_me" className="flex-1">
                        Only me
                      </TabsTrigger>
                      <TabsTrigger value="public" className="flex-1">
                        Share publicly
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                )}
              />
            </div>

            {isPublic && (
              <div className="space-y-2">
                <Label htmlFor="personEmail">
                  Their email{" "}
                  <span className="text-muted-foreground">(so they can confirm)</span>
                </Label>
                <Input
                  id="personEmail"
                  type="email"
                  placeholder="ada@example.com"
                  {...register("personEmail")}
                />
                <p className="text-xs text-muted-foreground">
                  We email them a one-time link to confirm, keep private, or
                  remove this entry. Their address never appears anywhere.
                </p>
                <FieldError message={formState.errors.personEmail?.message} />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="authorEmail">
                Your email{" "}
                <span className="text-muted-foreground">(optional — to recover your link)</span>
              </Label>
              <Input
                id="authorEmail"
                type="email"
                placeholder=""
                {...register("authorEmail")}
              />
              <FieldError message={formState.errors.authorEmail?.message} />
            </div>

            <TurnstileField
              onToken={(t) => setValue("turnstileToken", t ?? "")}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={formState.isSubmitting}
            >
              {formState.isSubmitting ? "Saving…" : "Save memory"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <SentencePreview values={values} />

      <Dialog open={!!saved} onOpenChange={(o) => !o && setSaved(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your memory is saved</DialogTitle>
            <DialogDescription>
              Keep this private link — it is the only way to edit or remove
              your entry.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2">
            <Input readOnly value={manageUrl} className="font-mono text-xs" />
            <Button
              variant="outline"
              size="icon"
              aria-label="Copy link"
              onClick={() => {
                navigator.clipboard.writeText(manageUrl);
                toast.success("Link copied");
              }}
            >
              <Copy className="size-4" />
            </Button>
          </div>

          <div className="flex gap-2 rounded-lg border border-gold/60 bg-gold/10 p-3 text-sm">
            <TriangleAlert
              className="mt-0.5 size-4 shrink-0 text-gold"
              aria-hidden
            />
            <p>
              No email + cleared browser storage means this entry can&apos;t be
              managed again. Download the link or add your email next time.
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadLink} className="flex-1">
              <Download className="size-4" /> Download link
            </Button>
            <Button onClick={() => setSaved(null)} className="flex-1">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
