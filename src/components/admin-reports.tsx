"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listReports, resolveReport } from "@/server/actions/reports";
import { safeCall } from "@/lib/client-errors";

export type AdminReport = Awaited<ReturnType<typeof listReports>>[number];

export function AdminReports({
  adminKey,
  initial,
}: {
  adminKey: string;
  initial: AdminReport[];
}) {
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);

  async function resolve(reportId: string, action: "restore" | "remove") {
    setBusy(reportId);
    const res = await safeCall(resolveReport(adminKey, reportId, action));
    setBusy(null);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setRows((rs) => rs.filter((r) => r.reportId !== reportId));
    toast.success(action === "restore" ? "Entry restored." : "Entry removed.");
  }

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          No open reports.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <Card key={r.reportId}>
          <CardContent className="space-y-3">
            <p className="font-medium leading-snug">{r.sentence}</p>
            <p className="text-sm text-muted-foreground">
              <strong>Reason:</strong> {r.reason}
              {r.details ? ` — ${r.details}` : ""}
            </p>
            <p className="text-xs text-muted-foreground">
              Reported {new Date(r.reportedAt).toLocaleString()}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={busy === r.reportId}
                onClick={() => resolve(r.reportId, "restore")}
              >
                Restore entry
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={busy === r.reportId}
                onClick={() => resolve(r.reportId, "remove")}
              >
                Remove entry
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
