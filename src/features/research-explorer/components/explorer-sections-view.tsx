"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronRight,
  Bookmark,
  MessageSquare,
  Quote,
  AlertCircle,
  Info,
  MinusCircle,
} from "lucide-react";
import { ExplorerSectionItem, ReadingMode } from "@/types/research-explorer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EpistemicBadge } from "./epistemic-badge";
import { SectionFilterBar, ClusterFilter, EvidenceFilter } from "./section-filter-bar";

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
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCluster, setSelectedCluster] = React.useState<ClusterFilter>("all");
  const [selectedEvidence, setSelectedEvidence] = React.useState<EvidenceFilter>("all");

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

  // Filter sections by search query, cluster, and evidence status
  const filteredSections = React.useMemo(() => {
    return sections.filter((s) => {
      // 1. Cluster check
      if (selectedCluster !== "all" && s.cluster !== selectedCluster) {
        return false;
      }
      // 2. Evidence status check
      if (selectedEvidence !== "all" && s.evidenceStatus !== selectedEvidence) {
        return false;
      }
      // 3. Search query check
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = s.title.toLowerCase().includes(q);
        const matchesBeginner = s.beginnerExplanation.toLowerCase().includes(q);
        const matchesTechnical = s.researcherTechnical.toLowerCase().includes(q);
        const matchesQuote = s.quote?.toLowerCase().includes(q) || false;
        return matchesTitle || matchesBeginner || matchesTechnical || matchesQuote;
      }
      return true;
    });
  }, [sections, selectedCluster, selectedEvidence, searchQuery]);

  // Group filtered sections by cluster
  const clusters = React.useMemo(() => {
    const map: Record<string, ExplorerSectionItem[]> = {
      foundation: [],
      methodology: [],
      experiments: [],
      evaluation: [],
      impact: [],
    };

    filteredSections.forEach((s) => {
      const c = s.cluster || "foundation";
      if (!map[c]) map[c] = [];
      map[c].push(s);
    });

    return map;
  }, [filteredSections]);

  const handleExpandAll = () => {
    const next: Record<string, boolean> = {};
    filteredSections.forEach((s) => {
      next[s.id] = true;
    });
    setExpandedSections(next);
  };

  const handleCollapseAll = () => {
    setExpandedSections({});
  };

  return (
    <div className="space-y-6">
      {/* Interactive Filter and Search Bar */}
      <SectionFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCluster={selectedCluster}
        onClusterChange={setSelectedCluster}
        selectedEvidence={selectedEvidence}
        onEvidenceChange={setSelectedEvidence}
        onExpandAll={handleExpandAll}
        onCollapseAll={handleCollapseAll}
        totalVisible={filteredSections.length}
        totalSections={sections.length}
      />

      {filteredSections.length === 0 ? (
        <Card className="border-dashed border-border/80 bg-muted/10 p-8 text-center space-y-2">
          <Info className="h-6 w-6 text-muted-foreground mx-auto" />
          <h4 className="text-xs font-semibold text-foreground">
            No Dimensions Matched Your Filter
          </h4>
          <p className="text-[11px] text-muted-foreground">
            Try adjusting your search query or clearing the cluster/evidence filters.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setSelectedCluster("all");
              setSelectedEvidence("all");
            }}
            className="text-xs text-primary"
          >
            Reset Filters
          </Button>
        </Card>
      ) : (
        Object.entries(clusters).map(([clusterKey, clusterSections]) => {
          if (clusterSections.length === 0) return null;
          const meta = CLUSTER_METADATA[clusterKey] || {
            label: clusterKey,
            description: "",
          };

          return (
            <div key={clusterKey} id={`cluster-${clusterKey}`} className="space-y-3">
              <div className="border-b border-border/80 pb-2 flex items-baseline justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground tracking-tight">
                    {meta.label}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    {meta.description}
                  </p>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground font-semibold">
                  {clusterSections.length} dimension{clusterSections.length === 1 ? "" : "s"}
                </span>
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
                            <EpistemicBadge status={section.evidenceStatus} />

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
                                    title={`Jump to Page ${p} in Extracted Document`}
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
                          {/* Negative Reporting Callout when Not Reported */}
                          {section.evidenceStatus === "not_reported" && (
                            <div className="rounded-lg border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-2.5 text-[11px] text-muted-foreground flex items-center gap-2">
                              <MinusCircle className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                              <span>
                                <strong>Honest Negative Reporting:</strong> This academic dimension was not reported or documented in the published text.
                              </span>
                            </div>
                          )}

                          {/* Not Established / Open Gap Callout */}
                          {section.evidenceStatus === "not_established" && (
                            <div className="rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 p-2.5 text-[11px] text-rose-800 dark:text-rose-300 flex items-center gap-2">
                              <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                              <span>
                                <strong>Unestablished / Open Gap:</strong> Evidence for this claim is ambiguous, unproven, or identified as an open research question.
                              </span>
                            </div>
                          )}

                          {/* Main Text Content */}
                          <div className="text-foreground whitespace-pre-wrap leading-relaxed">
                            {content}
                          </div>

                          {/* Direct Document Quote Callout */}
                          {section.quote && (
                            <div className="rounded-md border-l-2 border-emerald-500 bg-muted/30 p-2.5 text-[11px] text-foreground/90 italic flex items-start gap-2">
                              <Quote className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <span>&ldquo;{section.quote}&rdquo;</span>
                                {section.pageReferences && section.pageReferences.length > 0 && (
                                  <button
                                    onClick={() => onSelectPage?.(section.pageReferences[0])}
                                    className="ml-2 font-mono text-[10px] text-emerald-600 hover:underline not-italic cursor-pointer"
                                  >
                                    (Page {section.pageReferences.join(", ")})
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Action Footer: Query Assistant */}
                          <div className="pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                            <EpistemicBadge
                              status={section.evidenceStatus}
                              showExplanation
                            />

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
        })
      )}
    </div>
  );
}
