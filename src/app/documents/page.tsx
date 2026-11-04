"use client";

import * as React from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  PlusCircle,
  Trash2,
  ExternalLink,
  Info,
  Calendar,
  Users,
  ArrowRight,
} from "lucide-react";
import { DocumentMetadata } from "@/types/document";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

export default function ResearchLibraryPage() {
  const [documents, setDocuments] = React.useState<DocumentMetadata[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const fetchDocuments = React.useCallback(async (query = "") => {
    setIsLoading(true);
    setError(null);
    try {
      const url = query.trim()
        ? `/api/documents?q=${encodeURIComponent(query.trim())}`
        : "/api/documents";
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to load research papers.");
      }
      setDocuments(data.data.documents as DocumentMetadata[]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load documents.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDocuments(searchQuery);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to remove this paper from your Research Library?")) {
      return;
    }

    setIsDeleting(id);
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to delete document.");
      }
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete document.");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            <span>Research Library Foundation</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground mt-1">
            Research Library
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Manage, search, and interrogate imported academic papers, preprints, and analyzed PDFs.
          </p>
        </div>

        <Link href="/new?mode=document">
          <Button size="sm" className="gap-2 text-xs">
            <PlusCircle className="h-4 w-4" />
            <span>Add Research Paper</span>
          </Button>
        </Link>
      </div>

      {/* Search and Filters Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search papers by title, author, arXiv ID, or DOI..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
        <Button type="submit" variant="outline" size="sm" className="text-xs">
          Search
        </Button>
        {searchQuery && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              fetchDocuments("");
            }}
            className="text-xs"
          >
            Clear
          </Button>
        )}
      </form>

      {/* Error state */}
      {error && (
        <Alert variant="destructive">
          <AlertTitle className="text-xs font-bold">Error Loading Library</AlertTitle>
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && documents.length === 0 && (
        <Card className="p-8 sm:p-12 text-center border-dashed border-2">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
            <BookOpen className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            {searchQuery ? "No matching research papers found" : "Your Research Library is empty"}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 leading-relaxed">
            {searchQuery
              ? `No papers matched "${searchQuery}". Try a different keyword or title.`
              : "Import an academic paper via PDF upload, arXiv URL, DOI, or direct public link to begin analysis."}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Link href="/new?mode=document">
              <Button size="sm" className="text-xs gap-1.5">
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Import Paper</span>
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Documents Grid */}
      {!isLoading && documents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc) => (
            <Card
              key={doc.id}
              className="flex flex-col justify-between hover:border-primary/40 transition-colors group shadow-xs"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <Badge variant="outline" className="text-[10px] font-mono uppercase">
                      {doc.sourceType || "upload"}
                    </Badge>
                    {doc.documentType && doc.documentType !== "unknown" && (
                      <Badge variant="secondary" className="text-[10px] capitalize">
                        {doc.documentType.replace("_", " ")}
                      </Badge>
                    )}
                    {doc.openAccessStatus && doc.openAccessStatus !== "unknown" && (
                      <Badge variant="success" className="text-[10px] capitalize">
                        OA: {doc.openAccessStatus}
                      </Badge>
                    )}
                  </div>

                  <button
                    type="button"
                    title="Delete document"
                    disabled={isDeleting === doc.id}
                    onClick={(e) => handleDelete(doc.id, e)}
                    className="text-muted-foreground hover:text-destructive p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="sr-only">Delete</span>
                  </button>
                </div>

                <CardTitle className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">
                  {doc.title || doc.sanitizedFilename}
                </CardTitle>

                {doc.authors && doc.authors.length > 0 && (
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1">
                    <Users className="h-3 w-3 shrink-0" />
                    <span className="truncate">
                      {doc.authors.slice(0, 3).join(", ")}
                      {doc.authors.length > 3 ? " et al." : ""}
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground mt-1 pt-1">
                  {doc.publicationYear && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{doc.publicationYear}</span>
                    </span>
                  )}
                  {doc.journalOrConference && (
                    <span className="truncate max-w-[200px] italic">
                      {doc.journalOrConference}
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="py-2 text-[11px] text-muted-foreground border-t border-border/50">
                <div className="flex items-center justify-between">
                  <span>{doc.pageCount} pages • {doc.totalWordCount.toLocaleString()} words</span>
                  <span className="font-mono text-[10px]">ID: {doc.id.slice(0, 16)}...</span>
                </div>
              </CardContent>

              <CardFooter className="pt-3 pb-3 border-t border-border flex items-center justify-between bg-muted/10">
                <div className="flex items-center gap-2">
                  {doc.doi && (
                    <a
                      href={`https://doi.org/${doc.doi}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-mono text-primary hover:underline inline-flex items-center gap-0.5"
                    >
                      <span>DOI</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                  {doc.arxivId && (
                    <a
                      href={`https://arxiv.org/abs/${doc.arxivId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-mono text-primary hover:underline inline-flex items-center gap-0.5"
                    >
                      <span>arXiv</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>

                <Link href={`/documents/${doc.id}`}>
                  <Button size="sm" variant="outline" className="text-xs h-7 gap-1">
                    <span>Open Workspace</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
