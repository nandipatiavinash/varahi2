"use client";

import { LogOut } from "lucide-react";
import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export function Topbar({ ownerEmail }: { ownerEmail: string }) {
  return (
    <header className="no-print sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur md:px-6">
      <div />
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-primary/50 sm:inline">{ownerEmail}</span>
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm">
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}
