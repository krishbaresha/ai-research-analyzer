import Link from "next/link";
import { FileQuestion, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="max-w-md w-full border-border shadow-md">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <FileQuestion className="h-6 w-6" />
          </div>
          <CardTitle className="text-lg font-bold text-foreground">
            Page Not Found
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center text-xs text-muted-foreground leading-relaxed">
          The requested research workspace or page does not exist or may have been archived.
        </CardContent>
        <CardFooter className="flex justify-center pt-2">
          <Link href="/">
            <Button size="sm" variant="outline" className="gap-2 text-xs">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Return to Dashboard</span>
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
