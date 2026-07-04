"use client";

import * as React from "react";
import { toast } from "sonner";
import { exportBackup, restoreBackup } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Download, Upload } from "lucide-react";

export function BackupRestoreCard() {
  const [exporting, setExporting] = React.useState(false);
  const [restoring, setRestoring] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  async function handleExport() {
    setExporting(true);
    const result = await exportBackup();
    setExporting(false);
    if (result?.error || !result.data) {
      toast.error(result?.error ?? "Backup failed");
      return;
    }
    const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sri-varahi-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup downloaded");
  }

  async function handleRestore(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm("Restore from this backup file? Existing records with matching IDs will be overwritten.")) {
      e.target.value = "";
      return;
    }
    setRestoring(true);
    const text = await file.text();
    const result = await restoreBackup(text);
    setRestoring(false);
    e.target.value = "";
    if (result?.error) toast.error(result.error);
    else toast.success("Backup restored");
  }

  return (
    <Card>
      <CardHeader><CardTitle>Database Backup</CardTitle></CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={handleExport} disabled={exporting}>
          <Download className="h-4 w-4" /> {exporting ? "Exporting..." : "Download Backup"}
        </Button>
        <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={restoring}>
          <Upload className="h-4 w-4" /> {restoring ? "Restoring..." : "Restore Backup"}
        </Button>
        <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleRestore} />
      </CardContent>
    </Card>
  );
}
