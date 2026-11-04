import {
  Cpu,
  ShieldCheck,
  HardDrive,
  CheckCircle2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          <span>System Diagnostics & Architecture</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground mt-1">
          Settings & Environment Status
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-1">
          Verify runtime parameters, model configuration, and security boundaries.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* OpenAI Inference Configuration */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold">OpenAI Responses Engine</CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px]">Server-Side Only</Badge>
            </div>
            <CardDescription className="text-xs">
              Official OpenAI JavaScript/TypeScript SDK with Responses API.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-border">
              <span className="text-muted-foreground">Configured Model (OPENAI_MODEL)</span>
              <span className="font-mono font-medium text-foreground">
                gpt-4o-mini
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-border">
              <span className="text-muted-foreground">Alternative High-Reasoning Model</span>
              <span className="font-mono font-medium text-foreground">
                gpt-4o / o3-mini
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-border">
              <span className="text-muted-foreground">API Interface</span>
              <span className="font-mono font-medium text-foreground">client.responses.create()</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-muted-foreground">API Key Ingestion</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Isolated in .env.local
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Document Engine & Storage Parameters */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold">Document & Storage Engine</CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px]">Phase 1-5 Ephemeral</Badge>
            </div>
            <CardDescription className="text-xs">
              Upload limitations and persistence state.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-border">
              <span className="text-muted-foreground">Max File Upload Limit</span>
              <span className="font-mono font-medium text-foreground">10 MB (10,485,760 B)</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-border">
              <span className="text-muted-foreground">Supported Formats</span>
              <span className="font-medium text-foreground">PDF (.pdf)</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-border">
              <span className="text-muted-foreground">Current Persistence Layer</span>
              <span className="font-medium text-foreground">In-Memory (Phase 1-5)</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-muted-foreground">Production Database (Phase 6)</span>
              <span className="text-muted-foreground font-mono">Supabase PostgreSQL (Pending)</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Architecture Reminder */}
      <Alert variant="info">
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>Security Architecture Enforcement</AlertTitle>
        <AlertDescription className="text-xs leading-relaxed">
          <code>OPENAI_API_KEY</code> is strictly stored server-side, never bundled into client scripts, and never exposed in browser responses. All inference calls pass exclusively through server-side provider modules.
        </AlertDescription>
      </Alert>
    </div>
  );
}
