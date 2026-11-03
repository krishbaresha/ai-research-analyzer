"use client";

import * as React from "react";
import {
  Send,
  Sparkles,
  Bot,
  User,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  ShieldCheck,
  FileSearch,
} from "lucide-react";
import { ExtractedDocument } from "@/types/document";
import {
  ChatMessage,
  ChatEvidenceStatus,
  ChatRetrievalInfo,
} from "@/types/chat";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface DocumentChatProps {
  document: ExtractedDocument;
  onSelectPage: (pageNumber: number) => void;
}

const EXAMPLE_QUESTIONS = [
  "What is the main objective of this research?",
  "Explain the methodology and benchmark datasets used.",
  "What are the core empirical findings?",
  "What limitations and research gaps did the authors identify?",
  "Summarize the technical results presented in this paper.",
];

export function DocumentChat({ document, onSelectPage }: DocumentChatProps) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = React.useState<string | null>(null);
  const [inputMessage, setInputMessage] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [lastRetrieval, setLastRetrieval] = React.useState<ChatRetrievalInfo | null>(null);

  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    setErrorMessage(null);
    setInputMessage("");
    setIsLoading(true);

    // Optimistically add user message to thread
    const userMsg: ChatMessage = {
      id: `local_${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch(`/api/documents/${document.metadata.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationId,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(
          json.error?.message || `Chat request failed with status ${res.status}`
        );
      }

      const { conversationId: newConvId, message: assistantMsg, retrieval } = json.data;
      if (newConvId) setConversationId(newConvId);
      if (retrieval) setLastRetrieval(retrieval);

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to communicate with document chat assistant.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (!conversationId) {
      setMessages([]);
      setLastRetrieval(null);
      return;
    }

    try {
      await fetch(
        `/api/documents/${document.metadata.id}/chat?conversationId=${conversationId}`,
        { method: "DELETE" }
      );
    } catch {
      // Ignore network errors on cleanup
    } finally {
      setMessages([]);
      setConversationId(null);
      setLastRetrieval(null);
      setErrorMessage(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderEvidenceBadge = (status: ChatEvidenceStatus) => {
    switch (status) {
      case "supported":
        return (
          <Badge variant="from_document" className="text-[10px] gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Supported by Document</span>
          </Badge>
        );
      case "partially_supported":
        return (
          <Badge variant="secondary" className="text-[10px] gap-1 bg-amber-500/10 text-amber-500 border-amber-500/20">
            <AlertCircle className="h-3 w-3" />
            <span>Partially Supported</span>
          </Badge>
        );
      case "not_found":
        return (
          <Badge variant="not_established" className="text-[10px] gap-1">
            <HelpCircle className="h-3 w-3" />
            <span>Not in Document (Abstained)</span>
          </Badge>
        );
      case "interpretation":
        return (
          <Badge variant="ai_interpretation" className="text-[10px] gap-1">
            <Lightbulb className="h-3 w-3" />
            <span>Analytical Interpretation</span>
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Chat Container */}
      <Card className="flex flex-col h-[700px] border border-border">
        {/* Header */}
        <CardHeader className="py-3 px-4 border-b border-border flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span>Grounded Document Chat</span>
                <span className="text-[11px] font-mono text-muted-foreground font-normal">
                  (Phase 5)
                </span>
              </CardTitle>
              <CardDescription className="text-xs">
                Ask questions strictly grounded in {document.metadata.sanitizedFilename}
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {lastRetrieval && (
              <Badge variant="outline" className="hidden sm:inline-flex text-[10px] font-mono font-normal">
                Indexed: {lastRetrieval.pagesSearched} pages
              </Badge>
            )}
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearChat}
                disabled={isLoading}
                className="text-xs text-muted-foreground hover:text-foreground h-8 px-2"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Clear Chat
              </Button>
            )}
          </div>
        </CardHeader>

        {/* Message Thread Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Empty State */}
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 animate-in fade-in duration-300">
              <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <FileSearch className="h-6 w-6" />
              </div>
              <div className="max-w-md space-y-1.5">
                <h3 className="text-sm font-semibold text-foreground">
                  Document-Grounded Q&A Ready
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ask any question about this paper. The assistant indexes all {document.metadata.pageCount} extracted pages, retrieves relevant passages, and provides evidence citations with exact page navigation.
                </p>
              </div>

              {/* Example Question Chips */}
              <div className="w-full max-w-lg space-y-2 pt-2 text-left">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Suggested Questions:
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  {EXAMPLE_QUESTIONS.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleSendMessage(q)}
                      className="text-left text-xs p-2.5 rounded-lg border border-border bg-card/60 hover:bg-accent/40 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-between group cursor-pointer"
                    >
                      <span>{q}</span>
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" && (
                <div className="h-7 w-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
                  <Bot className="h-3.5 w-3.5" />
                </div>
              )}

              <div
                className={cn(
                  "max-w-[85%] rounded-lg p-3 text-xs leading-relaxed space-y-3",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground ml-auto"
                    : "bg-muted/40 border border-border text-foreground"
                )}
              >
                {/* User Content */}
                {msg.role === "user" && <p className="whitespace-pre-wrap">{msg.content}</p>}

                {/* Assistant Content */}
                {msg.role === "assistant" && (
                  <div className="space-y-3">
                    {/* Evidence Status Badge */}
                    <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2">
                      {renderEvidenceBadge(msg.evidenceStatus)}
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {/* Main Answer */}
                    <p className="whitespace-pre-wrap text-foreground/90 font-sans">
                      {msg.answer}
                    </p>

                    {/* Claim-by-Claim Citation Breakdown */}
                    {msg.claims && msg.claims.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-border/40">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                          Verified Claims & Citations:
                        </span>
                        <div className="space-y-1">
                          {msg.claims.map((claim, cIdx) => (
                            <div
                              key={cIdx}
                              className="p-2 rounded bg-background/60 border border-border/60 text-[11px] flex items-start justify-between gap-2"
                            >
                              <span className="text-foreground/90">{claim.statement}</span>
                              {claim.pageReferences && claim.pageReferences.length > 0 && (
                                <div className="flex items-center gap-1 shrink-0">
                                  {claim.pageReferences.map((pNum) => (
                                    <button
                                      key={pNum}
                                      type="button"
                                      onClick={() => onSelectPage(pNum)}
                                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors cursor-pointer"
                                      title={`Navigate to Page ${pNum}`}
                                    >
                                      <span>p. {pNum}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sources & Citations Accordion */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                          Retrieved Document Sources:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.sources.map((src, sIdx) => (
                            <button
                              key={sIdx}
                              type="button"
                              onClick={() => onSelectPage(src.pageNumber)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-accent/40 border border-border hover:border-primary/40 text-[11px] text-muted-foreground hover:text-foreground transition-all cursor-pointer text-left"
                            >
                              <span className="font-mono text-primary font-semibold">
                                Page {src.pageNumber}:
                              </span>
                              <span className="truncate max-w-[200px]">
                                {src.relevanceReason}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {msg.role === "user" && (
                <div className="h-7 w-7 rounded-md bg-secondary border border-border flex items-center justify-center text-secondary-foreground shrink-0 mt-0.5">
                  <User className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 justify-start animate-in fade-in duration-200">
              <div className="h-7 w-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
                <Bot className="h-3.5 w-3.5 animate-spin" />
              </div>
              <div className="max-w-[85%] rounded-lg p-3 bg-muted/40 border border-border text-foreground space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                  <span>Searching extracted pages & synthesizing grounded answer...</span>
                </div>
                <div className="h-2 w-48 bg-primary/20 rounded animate-pulse" />
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <Alert variant="destructive" className="py-2.5 text-xs">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-xs font-semibold">Chat Assistant Error</AlertTitle>
              <AlertDescription className="text-[11px] mt-0.5">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Retrieval Transparency Pill */}
        {lastRetrieval && lastRetrieval.pagesUsed.length > 0 && (
          <div className="px-4 py-1.5 bg-accent/20 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5 font-mono">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Searched {lastRetrieval.pagesSearched} pages • Evidence cited from:{" "}
              {lastRetrieval.pagesUsed.map((p) => `p. ${p}`).join(", ")}
            </span>
          </div>
        )}

        {/* Input Area */}
        <div className="p-3 border-t border-border bg-card">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2"
          >
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about this research document... (Enter to send, Shift+Enter for newline)"
              className="min-h-[50px] max-h-[120px] resize-none text-xs leading-relaxed"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="sm"
              disabled={isLoading || !inputMessage.trim()}
              className="h-10 px-3 cursor-pointer shrink-0"
            >
              <Send className="h-4 w-4 mr-1" />
              <span>Ask</span>
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
