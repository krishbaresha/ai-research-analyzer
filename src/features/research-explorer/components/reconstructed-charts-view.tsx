"use client";

import * as React from "react";
import { BarChart3, Bookmark, AlertCircle, Info } from "lucide-react";
import { ReconstructedChart } from "@/types/research-explorer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ReconstructedChartsViewProps {
  charts: ReconstructedChart[];
  onSelectPage?: (pageNumber: number) => void;
}

export function ReconstructedChartsView({
  charts,
  onSelectPage,
}: ReconstructedChartsViewProps) {
  if (!charts || charts.length === 0) {
    return (
      <Card className="border-dashed border-border/80 bg-muted/10 p-6 text-center space-y-2">
        <div className="mx-auto h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
          <BarChart3 className="h-5 w-5" />
        </div>
        <h4 className="text-xs font-semibold text-foreground">
          No Quantitative Tables Detected for Chart Reconstruction
        </h4>
        <p className="text-[11px] text-muted-foreground max-w-md mx-auto leading-relaxed">
          In strict compliance with our Academic Integrity standards, the system never invents or estimates chart values. Visual charts are only reconstructed when unambiguous numerical tables are published in the paper text.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {charts.map((chart) => {
        const maxValue = Math.max(...chart.data.map((d) => d.value), 1);

        return (
          <Card key={chart.id} className="border-border shadow-xs overflow-hidden">
            <CardHeader className="bg-muted/20 border-b border-border/60 pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-semibold">
                    {chart.title}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px] font-mono">
                    Unit: {chart.unit}
                  </Badge>
                  <Badge variant="from_document" className="text-[10px]">
                    Reconstructed from Source Data
                  </Badge>
                </div>
              </div>

              <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-3 mt-1">
                <span>Source: <strong>{chart.sourceTableOrSection}</strong></span>
                <button
                  type="button"
                  onClick={() => onSelectPage?.(chart.pageNumber)}
                  className="inline-flex items-center gap-1 text-primary hover:underline font-mono cursor-pointer"
                >
                  <Bookmark className="h-3 w-3" />
                  <span>Page {chart.pageNumber}</span>
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {/* Horizontal Bar Chart Graphic */}
              <div className="space-y-2.5">
                {chart.data.map((point, idx) => {
                  const percentage = Math.min(100, Math.max(5, (point.value / maxValue) * 100));

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium text-foreground flex items-center gap-1.5">
                          {point.category}
                          {point.isProposed && (
                            <Badge variant="success" className="text-[9px] px-1 py-0">
                              Proposed Method
                            </Badge>
                          )}
                          {point.baseline && (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              (Baseline)
                            </span>
                          )}
                        </span>
                        <span className="font-mono font-bold text-foreground">
                          {point.value} {chart.unit}
                        </span>
                      </div>

                      {/* Bar Fill */}
                      <div className="h-5 w-full bg-muted/60 rounded-md overflow-hidden relative flex items-center">
                        <div
                          style={{ width: `${percentage}%` }}
                          className={`h-full transition-all duration-500 rounded-md ${
                            point.isProposed
                              ? "bg-gradient-to-r from-blue-600 to-primary"
                              : "bg-slate-400 dark:bg-slate-600"
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chart Caption & Interpretation */}
              {chart.caption && (
                <div className="rounded-md bg-muted/30 p-2.5 border border-border/50 text-[11px] text-muted-foreground leading-relaxed flex items-start gap-2">
                  <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <span>{chart.caption}</span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
