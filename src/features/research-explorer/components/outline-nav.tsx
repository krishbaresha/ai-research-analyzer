"use client";

import * as React from "react";
import {
  Layers,
  MessageSquare,
  Download,
  GraduationCap,
  Microscope,
  Quote,
} from "lucide-react";
import { ReadingMode } from "@/types/research-explorer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface OutlineNavItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ComponentType<{ className?: string }>;
}

interface OutlineNavProps {
  items: OutlineNavItem[];
  activeId: string;
  onNavigate: (id: string) => void;
  readingMode: ReadingMode;
  onReadingModeChange: (mode: ReadingMode) => void;
  onPrintPdf: () => void;
  onExportWord: () => void;
  onOpenCite?: () => void;
  onViewPages?: () => void;
  onOpenChat: () => void;
}

export function OutlineNav({
  items,
  activeId,
  onNavigate,
  readingMode,
  onReadingModeChange,
  onPrintPdf,
  onExportWord,
  onOpenCite,
  onViewPages,
  onOpenChat,
}: OutlineNavProps) {
  return (
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border border-border rounded-xl p-2.5 sm:px-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
      {/* Navigation jump pills with scroll-spy highlighting */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeId === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-all cursor-pointer",
                isActive
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {Icon && <Icon className="h-3 w-3 shrink-0" />}
              <span>{item.label}</span>
              {typeof item.count === "number" && item.count > 0 && (
                <span
                  className={cn(
                    "text-[10px] px-1 py-0.2 rounded-full",
                    isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Right side: Dual Perspective Reading Mode + Export Actions */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Reading Mode Switcher */}
        <div className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => onReadingModeChange("beginner")}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer",
              readingMode === "beginner"
                ? "bg-card text-foreground font-semibold shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Plain English explanations, intuitive analogies, and educational guidance"
          >
            <GraduationCap className="h-3.5 w-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Beginner</span>
          </button>
          <button
            type="button"
            onClick={() => onReadingModeChange("researcher")}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer",
              readingMode === "researcher"
                ? "bg-card text-foreground font-semibold shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Methodological rigor, mathematical formulas, and scientific precision"
          >
            <Microscope className="h-3.5 w-3.5 text-blue-600" />
            <span className="hidden sm:inline">Researcher</span>
          </button>
        </div>

        {/* Export & Chat Actions */}
        <div className="flex items-center gap-1">
          {onOpenCite && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenCite}
              className="h-8 gap-1.5 text-xs text-primary border-primary/30 hover:bg-primary/10"
              title="Cite Paper (BibTeX, APA, IEEE, Overleaf)"
            >
              <Quote className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Cite</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onPrintPdf}
            className="h-8 gap-1.5 text-xs"
            title="Download Academic PDF Report (.pdf)"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden md:inline">PDF</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onExportWord}
            className="h-8 gap-1.5 text-xs"
            title="Download Word Document (.doc)"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Word</span>
          </Button>
          {onViewPages && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewPages}
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              title="View Raw Extracted Pages"
            >
              <Layers className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Pages</span>
            </Button>
          )}
          <Button
            variant="default"
            size="sm"
            onClick={onOpenChat}
            className="h-8 gap-1.5 text-xs shadow-2xs font-semibold"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Ask Paper AI</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
