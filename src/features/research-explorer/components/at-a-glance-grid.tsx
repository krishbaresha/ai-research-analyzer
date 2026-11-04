"use client";

import * as React from "react";
import {
  Target,
  Cpu,
  Database,
  Trophy,
  Zap,
  AlertOctagon,
  Github,
  ShieldCheck,
  Bookmark,
  FileQuestion,
} from "lucide-react";
import { ResearchAtAGlance, MetricCard, ExplorerEvidenceStatus } from "@/types/research-explorer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AtAGlanceGridProps {
  glance: ResearchAtAGlance;
  onSelectPage?: (pageNumber: number) => void;
}

export function AtAGlanceGrid({ glance, onSelectPage }: AtAGlanceGridProps) {
  const cards: Array<{
    id: string;
    card: MetricCard;
    icon: React.ReactNode;
    fallbackLabel: string;
  }> = [
    {
      id: "objective",
      card: glance.coreObjective,
      icon: <Target className="h-4 w-4 text-primary" />,
      fallbackLabel: "Core Objective",
    },
    {
      id: "methodology",
      card: glance.methodologyApproach,
      icon: <Cpu className="h-4 w-4 text-blue-600" />,
      fallbackLabel: "Methodology",
    },
    {
      id: "dataset",
      card: glance.datasetOrSample,
      icon: <Database className="h-4 w-4 text-purple-600" />,
      fallbackLabel: "Dataset & Sample",
    },
    {
      id: "result",
      card: glance.keyEmpiricalResult,
      icon: <Trophy className="h-4 w-4 text-emerald-600" />,
      fallbackLabel: "Key Result",
    },
    {
      id: "compute",
      card: glance.computationalCost,
      icon: <Zap className="h-4 w-4 text-amber-600" />,
      fallbackLabel: "Compute & Cost",
    },
    {
      id: "limitations",
      card: glance.primaryLimitations,
      icon: <AlertOctagon className="h-4 w-4 text-rose-600" />,
      fallbackLabel: "Key Limitations",
    },
    {
      id: "reproducibility",
      card: glance.reproducibilityStatus,
      icon: <Github className="h-4 w-4 text-slate-700 dark:text-slate-300" />,
      fallbackLabel: "Reproducibility",
    },
    {
      id: "ethics",
      card: glance.ethicalStatus,
      icon: <ShieldCheck className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />,
      fallbackLabel: "Ethical Status",
    },
  ];

  const getStatusBadge = (status: ExplorerEvidenceStatus) => {
    switch (status) {
      case "from_document":
        return (
          <Badge variant="from_document" className="text-[9px] px-1 py-0">
            Document Fact
          </Badge>
        );
      case "ai_interpretation":
        return (
          <Badge variant="ai_interpretation" className="text-[9px] px-1 py-0">
            AI Evaluation
          </Badge>
        );
      case "not_reported":
        return (
          <Badge variant="outline" className="text-[9px] px-1 py-0 text-muted-foreground">
            Not Reported
          </Badge>
        );
      case "not_established":
        return (
          <Badge variant="not_established" className="text-[9px] px-1 py-0">
            Not Established
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Research At A Glance
        </h3>
        <span className="text-[11px] text-muted-foreground">
          8 Core Scholarly Dimensions
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(({ id, card, icon, fallbackLabel }) => (
          <Card
            key={id}
            className={cn(
              "border-border/80 shadow-2xs hover:border-primary/40 transition-colors flex flex-col justify-between p-3.5 space-y-2",
              card.status === "not_reported" ? "bg-muted/20 opacity-80" : "bg-card"
            )}
          >
            <div>
              <div className="flex items-center justify-between gap-1 pb-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  {icon}
                  <span className="truncate">{card.label || fallbackLabel}</span>
                </div>
                {getStatusBadge(card.status)}
              </div>

              <div className="text-xs font-semibold text-foreground mt-1 line-clamp-2">
                {card.headline}
              </div>

              {card.detail && card.detail !== card.headline && (
                <p className="text-[11px] text-muted-foreground mt-1 line-clamp-3 leading-relaxed">
                  {card.detail}
                </p>
              )}
            </div>

            {/* Page Citation Anchor */}
            {card.pageReferences && card.pageReferences.length > 0 && (
              <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Source:</span>
                <div className="flex flex-wrap gap-1">
                  {card.pageReferences.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => onSelectPage?.(p)}
                      title={`Navigate to Page ${p} in PDF Reader`}
                      className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                    >
                      <Bookmark className="h-2.5 w-2.5" />
                      <span>p. {p}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
