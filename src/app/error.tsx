"use client";

import * as React from "react";
import { AlertCircle, RefreshCw, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function GlobalError({
  error,
  reset,
}: {
  error: (Error & { digest?: string }) | unknown;
  reset: () => void;
}) {
  const isChunkError =
    error instanceof Error &&
    (error.name === "ChunkLoadError" || error.message?.includes("Loading chunk"));

  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : "A client runtime or network sync event occurred.";

  React.useEffect(() => {
    // Log safe error metadata without exposing secrets
    console.error("[Application Error]", errorMessage);
  }, [errorMessage]);

  const handleFullReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="max-w-md w-full border-destructive/30 shadow-md">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-6 w-6" />
          </div>
          <CardTitle className="text-lg font-bold text-foreground">
            {isChunkError ? "Application Updated" : "Something went wrong"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center text-xs text-muted-foreground leading-relaxed space-y-2">
          <p>
            {isChunkError
              ? "New application assets were compiled. A simple page refresh will reload the latest workspace bundles."
              : "An unexpected event occurred during rendering. Your research data and workspace state remain protected."}
          </p>
          {errorMessage && !isChunkError && (
            <p className="font-mono text-[11px] text-destructive/80 bg-destructive/5 p-2 rounded border border-destructive/10 break-words">
              {errorMessage}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-center gap-3 pt-2">
          <Button onClick={() => reset()} variant="outline" size="sm" className="gap-2 text-xs">
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset View</span>
          </Button>
          <Button onClick={handleFullReload} size="sm" className="gap-2 text-xs">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reload Page</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
