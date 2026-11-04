"use client";

import * as React from "react";
import {
  FileText,
  Calendar,
  Users,
  ExternalLink,
  BookOpen,
  Award,
  Layers,
  Compass,
} from "lucide-react";
import { ResearchIdentity } from "@/types/research-explorer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ResearchIdentityCardProps {
  identity: ResearchIdentity;
  onOpenPdf?: () => void;
}

export function ResearchIdentityCard({
  identity,
  onOpenPdf,
}: ResearchIdentityCardProps) {
  return (
    <Card className="border-border shadow-xs bg-gradient-to-br from-card via-card to-primary/5">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="text-[10px] font-mono uppercase tracking-wider">
              <Compass className="h-2.5 w-2.5 mr-1 text-primary" />
              {identity.researchDomain || "Academic Research"}
            </Badge>

            {identity.openAccessStatus && (
              <Badge variant="success" className="text-[10px] capitalize">
                Open Access: {identity.openAccessStatus}
              </Badge>
            )}

            <Badge variant="secondary" className="text-[10px]">
              <Layers className="h-2.5 w-2.5 mr-1" />
              {identity.pageCount} Pages
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {identity.arxivId && (
              <a
                href={`https://arxiv.org/abs/${identity.arxivId}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-mono text-primary hover:underline"
              >
                <span>arXiv:{identity.arxivId}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}

            {identity.doi && (
              <a
                href={`https://doi.org/${identity.doi}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-mono text-primary hover:underline"
              >
                <span>DOI</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-2 leading-tight">
          {identity.title}
        </CardTitle>

        {/* Authors and Venue */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground mt-1.5">
          {identity.authors && identity.authors.length > 0 && (
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              {identity.authors.slice(0, 4).join(", ")}
              {identity.authors.length > 4 ? " et al." : ""}
            </span>
          )}

          {identity.publicationYear && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {identity.publicationYear}
            </span>
          )}

          {identity.journalOrConference && (
            <span className="flex items-center gap-1 italic">
              <Award className="h-3.5 w-3.5" />
              {identity.journalOrConference}
            </span>
          )}
        </div>
      </CardHeader>
    </Card>
  );
}
