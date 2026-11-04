import Link from "next/link";
import {
  FileUp,
  Search,
  ArrowRight,
  FileSearch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandSymbol } from "@/components/brand/logo";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero / Executive Welcome */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-6 sm:p-8 shadow-sm">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <BrandSymbol size={16} />
            <span>Traceable Academic Intelligence</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Structured, Evidence-Grounded Research Workspace
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Turn research questions and uploaded academic papers into structured,
            verifiable analyses with explicit evidence boundaries—distinguishing
            source facts from model interpretations without hallucination.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link href="/new?mode=topic">
            <Button className="gap-2">
              <Search className="h-4 w-4" />
              <span>Explore Research Topic</span>
            </Button>
          </Link>
          <Link href="/new?mode=document">
            <Button variant="outline" className="gap-2">
              <FileUp className="h-4 w-4" />
              <span>Import / Upload Paper</span>
            </Button>
          </Link>
          <Link href="/documents">
            <Button variant="ghost" className="gap-2">
              <FileSearch className="h-4 w-4" />
              <span>Research Library</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              Recent Research Projects
            </h3>
            <p className="text-xs text-muted-foreground">
              Saved analyses and document workspaces
            </p>
          </div>
          <Link href="/new">
            <Button variant="ghost" size="sm" className="text-xs gap-1">
              <span>Create New</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {/* Intentional Empty State */}
        <Card className="border-dashed border-2 border-border/80 bg-card/50">
          <CardContent className="flex flex-col items-center justify-center p-8 sm:p-12 text-center space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <FileSearch className="h-7 w-7" />
            </div>
            <div className="max-w-md space-y-1.5">
              <h4 className="text-base font-semibold text-foreground">
                No Research Projects Created Yet
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                You haven&apos;t conducted any research analyses in this session. Start by
                investigating an academic question or uploading a PDF document.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link href="/new?mode=topic">
                <Button size="sm" className="gap-2 text-xs">
                  <Search className="h-3.5 w-3.5" />
                  <span>Start Topic Research</span>
                </Button>
              </Link>
              <Link href="/new?mode=document">
                <Button size="sm" variant="outline" className="gap-2 text-xs">
                  <FileUp className="h-3.5 w-3.5" />
                  <span>Upload Document</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
