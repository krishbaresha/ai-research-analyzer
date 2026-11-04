"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronRight,
  Bookmark,
  MessageSquare,
  FileText,
  HelpCircle,
  Quote,
  CheckCircle2,
} from "lucide-react";
import { ExplorerSectionItem, ReadingMode, ExplorerEvidenceStatus } from "@/types/research-explorer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ExplorerSectionsViewProps {
  sections: ExplorerSectionItem[];
  readingMode: ReadingMode;
  onSelectPage?: (pageNumber: number) => void;
  onAskAssistant?: (sectionTitle: string, contextText: string) => void;
}

const CLUSTER_METADATA: Record<
  string,
  { label: string; description: string }
> = {
  foundation: {
    label: "Foundation, Problem & Objectives",
    description: "Core motivation, antecedent paradigms, hypotheses, and intellectual contributions.",
  },
  methodology: {
    label: "Methodology, Design & Architecture",
    description: "Algorithmic formulations, data pipelines, variables, baseline controls, and experimental parameters.",
  },
  experiments: {
    label: "Experiments, Benchmarks & Empirical Findings",
    description: "Evaluation protocols, benchmark differentials, quantitative findings, and statistical rigor.",
  },
  evaluation: {
    label: "Critical Evaluation & Validity Assessment",
    description: "Evidenced strengths, experimental limitations, threats to internal validity, and ethical posture.",
  },
  impact: {
    label: "Theoretical Impact, Gaps & Future Directions",
    description: "Broader scientific implications, unaddressed research gaps, and recommended empirical avenues.",
  },
};

export function ExplorerSectionsView({
  sections,
  readingMode,
  onSelectPage,
  onAskAssistant,
}: ExplorerSectionsViewProps) {
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>(() => {
    // Expand first 4 sections by default
    const initial: Record<string, boolean> = {};
    sections.slice(0, 4).forEach((s) => {
      initial[s.id] = true;
    });
    return initial;
  });

  const isBeginner = readingMode === "beginner";

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Group sections by cluster
  const clusters = React.useMemo(() => {
    const map: Record<string, ExplorerSectionItem[]> = {
      foundation: [],
      methodology: [],
      experiments: [],
      evaluation: [],
      impact: [],
    };

    sections.forEach((s) => {
      const c = s.cluster || "foundation";
      if (!map[c]) map[c] = [];
      map[c].push(s);
    });

    return map;
  }, [sections]);

  const renderStatusBadge = (status: ExplorerEvidenceStatus) => {
    switch (status) {
      case "from_document":
        return (
          <Badge variant="from_document" className="text-[10px]">
            from_document
          </Badge>
        );
      case "ai_interpretation":
        return (
          <Badge variant="ai_interpretation" className="text-[10px]">
            ai_interpretation
          </Badge>
        );
      case "not_reported":
        return (
          <Badge variant="outline" className="text-[10px] text-muted-foreground">
            not_reported
          </Badge>
        );
      case "not_established":
        return (
          <Badge variant="not_established" className="text-[10px]">
            not_established
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {Object.entries(clusters).map(([clusterKey, clusterSections]) => {
        if (clusterSections.length === 0) return null;
        const meta = CLUSTER_METADATA[clusterKey] || {
          label: clusterKey,
          description: "",
        };

        return (
          <div key={clusterKey} id={`cluster-${clusterKey}`} className="space-y-3">
            <div className="border-b border-border/80 pb-2">
              <h3 className="text-sm font-bold text-foreground tracking-tight">
                {meta.label}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {meta.description}
              </p>
            </div>

            <div className="space-y-3">
              {clusterSections.map((section) => {
                const isExpanded = Boolean(expandedSections[section.id]);
                const content = isBeginner
                  ? section.beginnerExplanation
                  : section.researcherTechnical;

                return (
                  <Card
                    key={section.id}
                    className="border-border shadow-xs overflow-hidden transition-all"
                  >
                    <CardHeader
                      onClick={() => toggleSection(section.id)}
                      className="p-3.5 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer select-none"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-primary shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                          <CardTitle className="text-xs sm:text-sm font-semibold text-foreground">
                            {section.title}
                          </CardTitle>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {renderStatusBadge(section.evidenceStatus)}

                          {section.pageReferences && section.pageReferences.length > 0 && (
                            <div className="hidden sm:flex items-center gap-1">
                              {section.pageReferences.map((p) => (
                                <button
                                  key={p}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectPage?.(p);
                                  }}
                                  className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                                >
                                  <Bookmark className="h-2.5 w-2.5" />
                                  <span>p. {p}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    {isExpanded && (
                      <CardContent className="p-4 space-y-3 text-xs leading-relaxed animate-in fade-in duration-200">
                        {/* Main Text Content */}
                        <div className="text-foreground whitespace-pre-wrap leading-relaxed">
                          {content}
                        </div>

                        {/* Direct Document Quote Callout */}
                        {section.quote && (
                          <div className="rounded-md border-l-2 border-emerald-500 bg-muted/30 p-2.5 text-[11px] text-foreground/90 italic flex items-start gap-2">
                            <Quote className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>&ldquo;{section.quote}&rdquo;</span>
                          </div>
                        )}

                        {/* Action Footer: Query Assistant */}
                        <div className="pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                          <span className="text-muted-foreground">
                            Evidence: <strong>{section.evidenceStatus.replace("_", " ")}</strong>
                          </span>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              onAskAssistant?.(
                                section.title,
                                `${section.title}:\n${content}`
                              )
                            }
                            className="text-[11px] h-7 gap-1.5 text-primary hover:bg-primary/10 cursor-pointer"
                          >
                            <MessageSquare className="h-3 w-3" />
                            <span>Ask Assistant About This</span>
                          </Button>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
