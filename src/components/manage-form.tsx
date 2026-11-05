"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { toast } from "sonner";
import { Download, Mail, Trash2 } from "lucide-react";

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
  DialogTrigger,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/status-badge";
import { SentencePreview } from "@/components/sentence-preview";
import {
  deleteMemory,
  exportCsv,
  getManageEntry,
  requestExportLink,
  updateMemory,
} from "@/server/actions/manage";
import { safeCall } from "@/lib/client-errors";
import {
  memoryInputSchema,
  type MemoryFormValues,
  type MemoryInput,
} from "@/lib/validation";
import { MAX_YEAR, MIN_YEAR } from "@/lib/constants";
import { useManageLinks } from "@/stores/manage-links";

export type ManageEntry = NonNullable<
  Awaited<ReturnType<typeof getManageEntry>>
>;

const STATUS_TEXT: Record<string, string> = {
  private: "Private — only you can see this.",
  pending_consent: "Waiting for the named person to respond.",
  confirmed: "Confirmed by the named person.",
  hidden: "Hidden while a report is reviewed.",
  removed: "Removed.",
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}

export function ManageForm({
  credential,
  entry,
}: {
  credential: string;
  entry: ManageEntry;
}) {
  const router = useRouter();
  const removeLink = useManageLinks((s) => s.remove);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [emailingExport, setEmailingExport] = useState(false);

  const { register, control, handleSubmit, watch, formState } = useForm<
    MemoryFormValues,
    unknown,
    MemoryInput
  >({
    resolver: standardSchemaResolver(memoryInputSchema),
    defaultValues: {
      direction: entry.direction,
      year: entry.year,
      jobTitle: entry.jobTitle,
      personFirstName: entry.personFirstName,
      personLastInitial: entry.personLastInitial,
      personCity: entry.personCity,
      personRegion: entry.personRegion,
      authorEmail: entry.authorEmail,
      personEmail: entry.personEmail,
      visibility: entry.visibility,
      turnstileToken: "",
    },
  });

  const values = watch();
  const isPublic = values.visibility === "public";
  const wasConfirmed = entry.status === "confirmed";

  async function onSubmit(data: MemoryInput) {
    const res = await safeCall(updateMemory(credential, data));
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(
      wasConfirmed && data.visibility === "public"
        ? "Saved — edits reset confirmation; a new consent email was sent."
        : "Saved."
    );
    router.refresh();
  }

  async function onDelete() {
    const res = await safeCall(deleteMemory(credential));
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    removeLink(entry.id);
    toast.success("Entry deleted.");
    router.push("/my-entries");
  }

  async function onExport() {
    setExporting(true);
    const res = await safeCall(exportCsv(credential));
    setExporting(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    const blob = new Blob([res.csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = res.filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function onEmailExport() {
    setEmailingExport(true);
    const res = await safeCall(requestExportLink(credential));
    setEmailingExport(false);
    if (res.ok) toast.success(res.message);
    else toast.error(res.error);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Edit entry</CardTitle>
            {entry.status === "confirmed" || entry.status === "pending_consent" ? (
              <StatusBadge confirmed={entry.status === "confirmed"} />
            ) : (
              <span className="text-xs font-medium text-muted-foreground">
                {STATUS_TEXT[entry.status]}
              </span>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
              <Controller
                control={control}
                name="direction"
                render={({ field }) => (
                  <Tabs value={field.value} onValueChange={(v) => field.onChange(v)}>
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
                  <Label htmlFor="m-job">Work or job</Label>
                  <Input id="m-job" maxLength={80} {...register("jobTitle")} />
                  <FieldError message={formState.errors.jobTitle?.message} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="m-year">
                    Year <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="m-year"
                    type="number"
                    inputMode="numeric"
                    min={MIN_YEAR}
                    max={MAX_YEAR}
                    {...register("year")}
                  />
                  <FieldError message={formState.errors.year?.message} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="m-name">Their name</Label>
                  <div className="flex gap-2">
                    <Input
                      id="m-name"
                      maxLength={60}
                      className="flex-1"
                      {...register("personFirstName")}
                    />
                    <Input
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
                  <Label htmlFor="m-city">City and state</Label>
                  <div className="flex gap-2">
                    <Input
                      id="m-city"
                      maxLength={80}
                      className="flex-1"
                      {...register("personCity")}
                    />
                    <Input
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
                    <Tabs value={field.value} onValueChange={(v) => field.onChange(v)}>
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
                  <Label htmlFor="m-pemail">
                    Their email{" "}
                    <span className="text-muted-foreground">(so they can confirm)</span>
                  </Label>
                  <Input id="m-pemail" type="email" {...register("personEmail")} />
                  <FieldError message={formState.errors.personEmail?.message} />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="m-aemail">
                  Your email{" "}
                  <span className="text-muted-foreground"> optional to recover your link </span>
                </Label>
                <Input id="m-aemail" type="email" {...register("authorEmail")} />
                <FieldError message={formState.errors.authorEmail?.message} />
              </div>

              <Button type="submit" className="w-full" disabled={formState.isSubmitting}>
                {formState.isSubmitting ? "Saving…" : "Save changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-base">Export and delete</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={onExport} disabled={exporting}>
              <Download className="size-4" />
              {exporting ? "Preparing…" : "Download CSV"}
            </Button>
            <Button
              variant="outline"
              onClick={onEmailExport}
              disabled={emailingExport}
            >
              <Mail className="size-4" />
              {emailingExport ? "Sending…" : "Email me the CSV"}
            </Button>
            <Dialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
              <DialogTrigger
                render={
                  <Button variant="destructive">
                    <Trash2 className="size-4" /> Delete entry
                  </Button>
                }
              />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete this entry?</DialogTitle>
                  <DialogDescription>
                    This removes the memory for everyone and can&apos;t be
                    undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setConfirmingDelete(false)}
                  >
                    Keep it
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={onDelete}
                  >
                    Delete
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      <SentencePreview values={values} />
    </div>
  );
}
