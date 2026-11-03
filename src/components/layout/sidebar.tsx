"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  FileText,
  PlusCircle,
  Settings,
  Sparkles,
  Cpu,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: Compass,
  },
  {
    title: "New Research",
    href: "/new",
    icon: PlusCircle,
  },
  {
    title: "Document Workspace",
    href: "/documents/sample",
    icon: FileText,
  },
  {
    title: "System & Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-screen w-64 flex-col border-r border-border bg-card text-card-foreground select-none",
        className
      )}
      aria-label="Sidebar Navigation"
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Sparkles className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <div className="text-sm font-bold tracking-tight text-foreground">
            Research Analyzer
          </div>
          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Swiss Modernism 2.0
          </div>
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 space-y-1 p-3">
        <div className="px-3 py-2 text-[10px] font-semibold text-muted-foreground tracking-wider uppercase">
          Navigation
        </div>
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2.5 text-xs font-medium transition-all duration-150 cursor-pointer",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 transition-colors",
                  isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <span className="flex-1">{item.title}</span>
              {item.badge && (
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[10px] font-medium",
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Model & System Badge in Footer */}
      <div className="border-t border-border p-4">
        <div className="rounded-lg border border-border bg-background/50 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Cpu className="h-3.5 w-3.5 text-primary" />
            <span>AI Provider</span>
          </div>
          <div className="mt-1 text-[11px] font-mono text-muted-foreground truncate">
            Groq LPU Inference
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Engine Ready
            </span>
            <span className="flex items-center gap-1 font-mono">
              <Layers className="h-3 w-3" />
              Phase 2
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
