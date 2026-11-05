"use client";

import * as React from "react";
import { Search, X, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ClusterFilter = "all" | "foundation" | "methodology" | "experiments" | "evaluation" | "impact";
export type EvidenceFilter = "all" | "from_document" | "ai_interpretation" | "not_reported" | "not_established";

interface SectionFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCluster: ClusterFilter;
  onClusterChange: (c: ClusterFilter) => void;
  selectedEvidence: EvidenceFilter;
  onEvidenceChange: (e: EvidenceFilter) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  totalVisible: number;
  totalSections: number;
}

export function SectionFilterBar({
  searchQuery,
  onSearchChange,
  selectedCluster,
  onClusterChange,
  selectedEvidence,
  onEvidenceChange,
  onExpandAll,
  onCollapseAll,
  totalVisible,
  totalSections,
}: SectionFilterBarProps) {
  const clusterOptions: Array<{ id: ClusterFilter; label: string }> = [
    { id: "all", label: "All Dimensions" },
    { id: "foundation", label: "Foundation" },
    { id: "methodology", label: "Methodology" },
    { id: "experiments", label: "Experiments" },
    { id: "evaluation", label: "Evaluation" },
    { id: "impact", label: "Impact & Gaps" },
  ];

  const evidenceOptions: Array<{ id: EvidenceFilter; label: string }> = [
    { id: "all", label: "All Statuses" },
    { id: "from_document", label: "Verified Evidence" },
    { id: "ai_interpretation", label: "AI Synthesis" },
    { id: "not_reported", label: "Not Reported" },
  ];

  return (
    <div className="bg-card border border-border rounded-xl p-3 sm:p-4 space-y-3 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search across 30 dimensions (e.g. baseline, dataset, ablation, limitations)..."
            className="w-full h-8 pl-8 pr-8 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Global Expand / Collapse controls */}
        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onExpandAll}
            className="h-7 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
            title="Expand all section cards"
          >
            <ChevronDown className="h-3 w-3" />
            <span>Expand All</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onCollapseAll}
            className="h-7 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
            title="Collapse all section cards"
          >
            <ChevronUp className="h-3 w-3" />
            <span>Collapse</span>
          </Button>
          <span className="text-[11px] text-muted-foreground font-mono ml-1">
            {totalVisible} / {totalSections}
          </span>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/40">
        {/* Cluster Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mr-1 shrink-0">
            Cluster:
          </span>
          {clusterOptions.map((c) => (
            <button
              key={c.id}
              onClick={() => onClusterChange(c.id)}
              className={cn(
                "px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer",
                selectedCluster === c.id
                  ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Evidence Status Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mr-1 shrink-0">
            Evidence:
          </span>
          {evidenceOptions.map((e) => (
            <button
              key={e.id}
              onClick={() => onEvidenceChange(e.id)}
              className={cn(
                "px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer",
                selectedEvidence === e.id
                  ? "bg-secondary text-secondary-foreground font-semibold shadow-2xs"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {e.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
