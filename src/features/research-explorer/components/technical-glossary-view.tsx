"use client";

import * as React from "react";
import { BookOpen, Search, Bookmark, Lightbulb } from "lucide-react";
import { GlossaryTerm, ReadingMode } from "@/types/research-explorer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface TechnicalGlossaryViewProps {
  glossary: GlossaryTerm[];
  readingMode: ReadingMode;
  onSelectPage?: (pageNumber: number) => void;
}

export function TechnicalGlossaryView({
  glossary,
  readingMode,
  onSelectPage,
}: TechnicalGlossaryViewProps) {
  const [search, setSearch] = React.useState("");
  const isBeginner = readingMode === "beginner";

  const filtered = (glossary || []).filter(
    (g) =>
      g.term.toLowerCase().includes(search.toLowerCase()) ||
      g.plainDefinition.toLowerCase().includes(search.toLowerCase()) ||
      g.technicalDefinition.toLowerCase().includes(search.toLowerCase())
  );

  if (!glossary || glossary.length === 0) {
    return null;
  }

  return (
    <Card className="border-border shadow-xs">
      <CardHeader className="bg-muted/20 border-b border-border/60 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">
              Technical Glossary & Concept Index ({glossary.length} Terms)
            </CardTitle>
          </div>

          <div className="w-full sm:w-64">
            <Input
              placeholder="Filter glossary terms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs h-8"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((item, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-border/80 bg-card p-3 space-y-1.5 flex flex-col justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-foreground tracking-tight">
                    {item.term}
                  </span>
                  {item.pageReferences && item.pageReferences.length > 0 && (
                    <div className="flex items-center gap-1">
                      {item.pageReferences.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => onSelectPage?.(p)}
                          className="text-[10px] font-mono text-muted-foreground hover:text-primary cursor-pointer"
                        >
                          p. {p}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {isBeginner ? (
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {item.plainDefinition}
                  </p>
                ) : (
                  <p className="text-[11px] text-foreground/90 font-mono text-[10.5px] leading-relaxed">
                    {item.technicalDefinition}
                  </p>
                )}

                {isBeginner && item.analogy && (
                  <div className="rounded bg-muted/40 p-2 text-[10.5px] text-muted-foreground italic flex items-start gap-1.5">
                    <Lightbulb className="h-3 w-3 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Analogy: {item.analogy}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
