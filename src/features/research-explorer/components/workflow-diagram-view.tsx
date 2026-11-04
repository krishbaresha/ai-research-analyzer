"use client";

import * as React from "react";
import { GitCommit, ArrowDown, ArrowRight, Bookmark, Layers, GitBranch } from "lucide-react";
import { WorkflowDiagram } from "@/types/research-explorer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface WorkflowDiagramViewProps {
  diagrams: WorkflowDiagram[];
  onSelectPage?: (pageNumber: number) => void;
}

export function WorkflowDiagramView({
  diagrams,
  onSelectPage,
}: WorkflowDiagramViewProps) {
  if (!diagrams || diagrams.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {diagrams.map((diag) => (
        <Card key={diag.id} className="border-border shadow-xs overflow-hidden">
          <CardHeader className="bg-muted/20 border-b border-border/60 pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold">
                  {diag.title}
                </CardTitle>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="text-[10px] font-mono capitalize">
                  {diag.diagramType.replace("_", " ")}
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  AI-Synthesized Workflow
                </Badge>
              </div>
            </div>

            <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-1">
              <span>Source Methodology:</span>
              <button
                type="button"
                onClick={() => onSelectPage?.(diag.sourcePage)}
                className="inline-flex items-center gap-1 text-primary hover:underline font-mono cursor-pointer"
              >
                <Bookmark className="h-3 w-3" />
                <span>Page {diag.sourcePage}</span>
              </button>
            </div>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            {/* Step Pipeline Flow */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {diag.steps.map((step, idx) => (
                <div
                  key={step.stepNumber}
                  className="rounded-lg border border-border bg-card p-3 space-y-2 flex flex-col justify-between relative group hover:border-primary/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-mono font-bold flex items-center justify-center">
                        {step.stepNumber}
                      </span>
                      {step.pageReference && (
                        <button
                          type="button"
                          onClick={() => onSelectPage?.(step.pageReference!)}
                          className="text-[10px] font-mono text-muted-foreground hover:text-primary cursor-pointer"
                        >
                          p. {step.pageReference}
                        </button>
                      )}
                    </div>
                    <h5 className="text-xs font-semibold text-foreground pt-1">
                      {step.title}
                    </h5>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {step.technicalNote && (
                    <div className="pt-2 border-t border-border/40 text-[10px] font-mono text-primary/90 bg-muted/30 px-2 py-1 rounded">
                      {step.technicalNote}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {diag.caption && (
              <p className="text-[11px] text-muted-foreground italic border-t border-border/40 pt-2">
                {diag.caption}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
