"use client";

import * as React from "react";
import {
  Quote,
  Copy,
  Check,
  Download,
  X,
  BookMarked,
  FileCode,
} from "lucide-react";
import { ResearchIdentity } from "@/types/research-explorer";
import { generateAcademicCitations, FormattedCitations } from "@/lib/export/citation-generator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AcademicCitationModalProps {
  identity: ResearchIdentity;
  isOpen: boolean;
  onClose: () => void;
}

export function AcademicCitationModal({
  identity,
  isOpen,
  onClose,
}: AcademicCitationModalProps) {
  const [activeTab, setActiveTab] = React.useState<"bibtex" | "apa" | "ieee" | "harvard" | "chicago">("bibtex");
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const citations: FormattedCitations = React.useMemo(() => {
    return generateAcademicCitations(identity);
  }, [identity]);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadBib = () => {
    const blob = new Blob([citations.bibtex], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${citations.citationKey}.bib`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-xl shadow-xl overflow-hidden space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Quote className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-foreground">
                Cite Academic Research Paper
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Standard citations formatted for Overleaf, Zotero, LaTeX, Word, and academic theses.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 pt-0">
          {/* Quick LaTeX Cite Key Banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/80">
            <div className="flex items-center gap-2 text-xs">
              <FileCode className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">LaTeX Key:</span>
              <code className="font-mono font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10">
                {citations.latexCite}
              </code>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopy(citations.latexCite, "latex")}
              className="text-[11px] h-7 gap-1"
            >
              {copiedKey === "latex" ? (
                <>
                  <Check className="h-3 w-3 text-emerald-600" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy \\cite</span>
                </>
              )}
            </Button>
          </div>

          {/* Reference Format Tabs */}
          <div className="flex border-b border-border gap-1 overflow-x-auto no-scrollbar">
            {(["bibtex", "apa", "ieee", "harvard", "chicago"] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setActiveTab(fmt)}
                className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-t-md transition-colors cursor-pointer ${
                  activeTab === fmt
                    ? "border-b-2 border-primary text-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>

          {/* Selected Citation Box */}
          <div className="relative rounded-lg border border-border/80 bg-muted/15 p-4">
            {activeTab === "bibtex" && (
              <pre className="font-mono text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed select-all overflow-x-auto">
                {citations.bibtex}
              </pre>
            )}

            {activeTab === "apa" && (
              <div className="text-xs text-foreground/90 leading-relaxed pl-6 -indent-6 select-all font-serif">
                {citations.apa}
              </div>
            )}

            {activeTab === "ieee" && (
              <div className="text-xs text-foreground/90 leading-relaxed select-all font-mono">
                {citations.ieee}
              </div>
            )}

            {activeTab === "harvard" && (
              <div className="text-xs text-foreground/90 leading-relaxed pl-6 -indent-6 select-all">
                {citations.harvard}
              </div>
            )}

            {activeTab === "chicago" && (
              <div className="text-xs text-foreground/90 leading-relaxed pl-6 -indent-6 select-all font-serif">
                {citations.chicago}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60">
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="text-[10px] font-mono">
                {identity.journalOrConference || "Scholarly Publication"}
              </Badge>
              {identity.doi && (
                <Badge variant="secondary" className="text-[10px] font-mono">
                  DOI: {identity.doi}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              {activeTab === "bibtex" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadBib}
                  className="text-xs h-8 gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download .bib</span>
                </Button>
              )}

              <Button
                size="sm"
                onClick={() =>
                  handleCopy(
                    activeTab === "bibtex"
                      ? citations.bibtex
                      : activeTab === "apa"
                      ? citations.apa
                      : activeTab === "ieee"
                      ? citations.ieee
                      : activeTab === "harvard"
                      ? citations.harvard
                      : citations.chicago,
                    activeTab
                  )
                }
                className="text-xs h-8 gap-1.5"
              >
                {copiedKey === activeTab ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Copied to Clipboard</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy {activeTab.toUpperCase()}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
