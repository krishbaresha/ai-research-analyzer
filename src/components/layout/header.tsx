"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Menu, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandIcon } from "@/components/brand/logo";

interface HeaderProps {
  onMobileMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
}

export function Header({
  onMobileMenuToggle,
  isMobileMenuOpen,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/95 px-4 sm:px-6 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMobileMenuToggle}
          className="inline-flex md:hidden items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>

        <Link href="/" className="md:hidden flex items-center">
          <BrandIcon size={28} />
        </Link>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Workspace
          </span>
          <span className="hidden sm:inline-block text-muted-foreground/40">/</span>
          <h1 className="text-sm font-semibold text-foreground">
            Academic Research Intelligence
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Safe status indicator without leaked secrets */}
        <div className="hidden lg:flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Server-Side Isolation Active</span>
        </div>

        <Link href="/new">
          <Button size="sm" className="h-8 gap-1.5 text-xs font-medium">
            <Plus className="h-3.5 w-3.5" />
            <span>New Research</span>
          </Button>
        </Link>
      </div>
    </header>
  );
}
