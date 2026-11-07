import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { documentStore } from "@/lib/storage/document-store";
import { DocumentViewer } from "@/features/pdf-analysis/components/document-viewer";

interface DocumentWorkspaceProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentWorkspacePage({
  params,
}: DocumentWorkspaceProps) {
  const { id } = await params;

  const isSample = id === "sample";
  const document = isSample ? null : await documentStore.get(id);

  if (!isSample && !document) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pt-12 text-center animate-in fade-in duration-300">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Document Not Found</AlertTitle>
          <AlertDescription className="text-xs mt-1">
            The document with identifier <code>{id}</code> does not exist or was evicted from ephemeral memory.
          </AlertDescription>
        </Alert>
        <div className="pt-2">
          <Link href="/new?mode=document">
            <Button size="sm">Upload a New PDF Document</Button>
          </Link>
        </div>
      </div>
    );
  }

  // If a real document is present, render the interactive DocumentViewer
  if (document) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="space-y-1">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Dashboard</span>
            </Link>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Workspace: {document.metadata.sanitizedFilename}
            </h2>
            <p className="text-xs text-muted-foreground">
              Evidence-grounded document analysis and page-level citation exploration.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/new?mode=document">
              <Button size="sm" variant="outline" className="text-xs">
                Upload Another
              </Button>
            </Link>
          </div>
        </div>

        <DocumentViewer
          document={document}
          initialExplorerData={document.explorerData || null}
          initialReport={document.analysisReport || null}
        />
      </div>
    );
  }

  // Fallback blueprint for sample shell
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="space-y-1">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Document Intelligence Shell
            </h2>
            <Badge variant="outline" className="font-mono text-[11px]">
              Phase 1 Shell
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Structured analysis workspace illustrating evidence boundaries and grounded document Q&A.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/new?mode=document">
            <Button size="sm" variant="outline" className="text-xs">
              Upload PDF
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardHeader className="border-b border-border pb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Report Structure Blueprint
                </span>
                <Badge variant="from_document" className="text-[10px]">
                  evidence-grounded
                </Badge>
              </div>
              <CardTitle className="text-lg font-bold mt-1 text-foreground">
                Document Synthesis & Evidence Matrix
              </CardTitle>
              <CardDescription className="text-xs">
                Exhibiting how structured analysis results render with explicit evidence citations.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <BookOpen className="h-3.5 w-3.5 text-primary" />
                  <span>Executive Summary</span>
                </h4>
                <div className="rounded-lg border border-border bg-card p-4 text-xs leading-relaxed text-foreground">
                  The analysis report contract organizes paper insights into verified categories.
                  Every statement is tagged with its evidence origin: document content,
                  retrieved web literature, or AI analytical interpretation.
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Key Findings & Evidence Attribution</span>
                </h4>

                <div className="space-y-2">
                  <div className="rounded-lg border border-border p-3.5 space-y-2 bg-card">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">
                        Document-Extracted Fact
                      </span>
                      <Badge variant="from_document" className="text-[10px]">
                        From Document (p. 4)
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      &ldquo;Multi-head attention allows the model to jointly attend to information
                      from different representation subspaces at different positions.&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <Card className="flex flex-col h-full min-h-[500px]">
            <CardHeader className="border-b border-border pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-semibold">
                    Document-Grounded Q&A
                  </CardTitle>
                </div>
                <Badge variant="outline" className="text-[10px]">Phase 5</Badge>
              </div>
              <CardDescription className="text-xs">
                Ask targeted questions about the extracted document text.
              </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col justify-between p-4 space-y-4">
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div className="space-y-1 max-w-xs">
                  <div className="text-xs font-semibold text-foreground">
                    Grounded Conversation Ready
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Once document analysis is performed, document-grounded Q&A activates in Phase 5.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-border space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    disabled
                    placeholder="Document Q&A engine activates in Phase 5..."
                    className="flex-1 h-9 rounded-md border border-input bg-muted/50 px-3 text-xs placeholder:text-muted-foreground/60 disabled:cursor-not-allowed"
                  />
                  <Button size="sm" disabled className="h-9 text-xs">
                    Ask
                  </Button>
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Strict Grounding: Enabled</span>
                  <span>Anti-Hallucination Guard: Active</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
