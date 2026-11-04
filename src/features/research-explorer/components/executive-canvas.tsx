"use client";

import * as React from "react";
import {
  Lightbulb,
  Sparkles,
  Target,
  ArrowRight,
  HelpCircle,
  Users,
  Brain,
  CheckCircle2,
} from "lucide-react";
import { ExecutiveResearchOverview, ReadingMode } from "@/types/research-explorer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ExecutiveCanvasProps {
  overview: ExecutiveResearchOverview;
  readingMode: ReadingMode;
}

export function ExecutiveCanvas({ overview, readingMode }: ExecutiveCanvasProps) {
  const isBeginner = readingMode === "beginner";

  return (
    <Card className="border-border shadow-xs overflow-hidden">
      <CardHeader className="bg-muted/30 border-b border-border/60 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">
              Executive Research Canvas
            </CardTitle>
          </div>
          <Badge
            variant={isBeginner ? "secondary" : "outline"}
            className="text-[10px] font-mono capitalize"
          >
            {isBeginner ? "Beginner Perspective" : "Technical Perspective"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4 text-xs leading-relaxed">
        {/* Dual Primary Explanation */}
        {isBeginner ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
              <span className="text-[11px] font-semibold text-primary uppercase tracking-wider block">
                Plain-Language Overview
              </span>
              <p className="text-sm text-foreground leading-relaxed">
                {overview.beginnerExplanation}
              </p>
            </div>

            {overview.beginnerAnalogy && (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/20 p-3.5 space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-semibold text-xs">
                  <Lightbulb className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Intuitive Analogy & Mental Model:</span>
                </div>
                <p className="text-xs text-foreground/90 italic pl-5">
                  &ldquo;{overview.beginnerAnalogy}&rdquo;
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-4 space-y-2">
            <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider block">
              Core Technical Contribution
            </span>
            <p className="text-xs text-foreground leading-relaxed">
              {overview.technicalContribution}
            </p>
          </div>
        )}

        {/* 3-Column Structured Synthesis */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="rounded-md border border-border p-3 space-y-1 bg-card">
            <span className="font-semibold text-foreground flex items-center gap-1">
              <Target className="h-3 w-3 text-primary" /> Problem Addressed
            </span>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              {overview.problemAddressed}
            </p>
          </div>

          <div className="rounded-md border border-border p-3 space-y-1 bg-card">
            <span className="font-semibold text-foreground flex items-center gap-1">
              <HelpCircle className="h-3 w-3 text-primary" /> Why It Matters
            </span>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              {overview.whyItMatters}
            </p>
          </div>

          <div className="rounded-md border border-border p-3 space-y-1 bg-card">
            <span className="font-semibold text-foreground flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" /> What Was Discovered
            </span>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              {overview.whatDiscovered}
            </p>
          </div>
        </div>

        {/* Who Benefits Chips */}
        {overview.whoBenefits && overview.whoBenefits.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/50">
            <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" /> Beneficiaries:
            </span>
            {overview.whoBenefits.map((b, i) => (
              <span
                key={i}
                className="inline-block px-2 py-0.5 rounded bg-muted text-[11px] text-muted-foreground"
              >
                {b}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
