"use client";

import * as React from "react";
import {
  ShieldCheck,
  Brain,
  MinusCircle,
  HelpCircle,
} from "lucide-react";
import { ExplorerEvidenceStatus } from "@/types/research-explorer";
import { cn } from "@/lib/utils";

interface EpistemicBadgeProps {
  status: ExplorerEvidenceStatus;
  className?: string;
  showExplanation?: boolean;
}

const STATUS_CONFIG: Record<
  ExplorerEvidenceStatus,
  {
    label: string;
    description: string;
    variant: "from_document" | "ai_interpretation" | "outline" | "not_established";
    icon: React.ComponentType<{ className?: string }>;
    accentClass: string;
  }
> = {
  from_document: {
    label: "Document Evidence",
    description: "Directly verified against source paper text with page citation.",
    variant: "from_document",
    icon: ShieldCheck,
    accentClass: "text-emerald-700 dark:text-emerald-300 border-emerald-300/80 bg-emerald-50 dark:bg-emerald-950/40",
  },
  ai_interpretation: {
    label: "AI Synthesis",
    description: "Analytical explanation, intuitive analogy, or evaluative commentary.",
    variant: "ai_interpretation",
    icon: Brain,
    accentClass: "text-amber-700 dark:text-amber-300 border-amber-300/80 bg-amber-50 dark:bg-amber-950/40",
  },
  not_reported: {
    label: "Not Reported",
    description: "The publication's authors omitted or did not report this detail.",
    variant: "outline",
    icon: MinusCircle,
    accentClass: "text-slate-600 dark:text-slate-400 border-slate-300 bg-slate-100/60 dark:bg-slate-900/40",
  },
  not_established: {
    label: "Not Established",
    description: "Empirically unverified, ambiguous, or identified as an open research gap.",
    variant: "not_established",
    icon: HelpCircle,
    accentClass: "text-rose-700 dark:text-rose-300 border-rose-300/80 bg-rose-50 dark:bg-rose-950/40",
  },
};

export function EpistemicBadge({
  status,
  className,
  showExplanation = false,
}: EpistemicBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.from_document;
  const Icon = config.icon;

  return (
    <div className="inline-flex items-center gap-1.5" title={config.description}>
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-colors",
          config.accentClass,
          className
        )}
      >
        <Icon className="h-2.5 w-2.5 shrink-0" />
        <span>{config.label}</span>
      </span>

      {showExplanation && (
        <span className="text-[10px] text-muted-foreground hidden md:inline">
          ({config.description})
        </span>
      )}
    </div>
  );
}
