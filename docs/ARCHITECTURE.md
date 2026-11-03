# AI Research Analyzer — System Architecture

> **Document Status:** Active / Authoritative  
> **Last Updated:** 2026-11-03 (Phase 5: Document Chat & Evidence-Grounded Q&A)  
> **Target Framework:** Next.js 15 (App Router) + TypeScript + Tailwind CSS

---

## 1. Architectural Principles

1. **Separation of Concerns:** Strict layer isolation between presentation (`src/app`, `src/components`), domain features (`src/features/*`), infrastructure/services (`src/lib/*`), and shared types/contracts (`src/types/*`).
2. **Server-Side AI Confidentiality:** All interactions with AI APIs reside solely on the server. No client component or browser bundle shall ever import or receive `OPENAI_API_KEY`.
3. **Phase-Isolated Document Processing:** PDF parsing, validation, and text extraction are strictly server-side processes operating independently of LLM calls. In Phase 3, zero document content is transmitted to external AI providers.
4. **Modular AI Provider Abstraction:** Inference services implement an abstract `AIProvider` interface (`src/lib/ai/provider.ts`), decoupling domain logic from specific model providers. The official **OpenAI SDK** (`openai`) with the modern **Responses API** (`client.responses.create()`) is the active default provider (`OpenAIProvider`).
5. **Evidence-Grounded Reporting & Zero Hallucination:** Claims produced by the model must be explicitly categorized:
   - `from_document`: Grounded with extracted text and exact page numbers.
   - `retrieved_source`: Backed by an external source.
   - `ai_interpretation`: Analytical extrapolation by the model.
   - `not_established`: Stating explicitly when evidence is missing.
6. **Untrusted Data Boundary:** Uploaded PDFs, web content, and user topics are treated strictly as untrusted data inputs:
   - File validation checks magic bytes (`%PDF-`), enforces size limits (`MAX_UPLOAD_SIZE_BYTES`), and sanitizes filenames against directory traversal (`..`, slashes).
   - Prompts encapsulate user inputs with explicit XML isolation delimiters (`<user_topic>`, `<document_passage page="N">`).
7. **Progressive Resilience:** Failures in external LLM calls or PDF extraction are caught by standardized domain errors (`PDFValidationError`, `PDFPayloadTooLargeError`, `PDFInvalidSignatureError`, `PDFCorruptedError`, `PDFEncryptedError`, `AIAuthError`, `AIRateLimitError`, `AIResponseParseError`) and returned as actionable envelopes.

---

## 2. System Layering & Module Boundaries

```
[ Browser / Client ]
        │  (User interaction, drag-and-drop file upload, accessible UI)
        ▼
[ Presentation & Route Layer ]
   - src/app/ (Next.js App Router: layouts, pages, loading/error boundaries)
   - src/components/ui/ (Atomic, accessible Swiss Modernism 2.0 components: Badge as span, Button, Card)
   - src/components/layout/ (App shell, navigation, header, sidebar)
        │
        ▼
[ Domain Feature Layer ]
   - src/features/research/ (Topic analysis forms, report viewer, evidence badges)
   - src/features/pdf-analysis/ (Upload dropzone, page-by-page DocumentViewer, DocumentReportViewer, interactive citation navigation)
   - src/features/document-chat/ (Interactive DocumentChat, claim citations, sources accordion, retrieval transparency)
   - src/features/projects/ (Project listing, cards, status)
        │
        ▼
[ Server Boundary: API Handlers & Route Handlers ]
   - src/app/api/documents/upload/route.ts      (POST: multipart upload & extraction)
   - src/app/api/documents/[id]/route.ts        (GET: document & extracted pages retrieval)
   - src/app/api/documents/[id]/analyze/route.ts (POST: grounded document analysis via OpenAI Responses API)
   - src/app/api/documents/[id]/chat/route.ts   (POST: grounded document chat; DELETE: clear session)
   - src/app/api/research/analyze-topic/route.ts (POST: topic analysis via OpenAI Responses API)
   - src/app/api/health/route.ts                (GET: health check & config diagnostics)
        │
        ▼
[ Core Services & Processing Engine ]
   - src/lib/pdf/
       ├── validator.ts          (Magic bytes %PDF-, size cap, filename sanitization, safe ID)
       ├── extractor.ts          (unpdf page-by-page extraction, scanned detection, word counting)
       ├── budgeter.ts           (Context-aware page budgeting, coverage metrics, XML injection sanitization)
       └── index.ts              (Barrel exports)
   - src/lib/retrieval/
       └── retriever.ts          (Deterministic BM25-inspired passage chunker & relevance ranking)
   - src/lib/ai/
       ├── provider.ts           (Abstract AIProvider interface & domain error classes)
       ├── openai.provider.ts    (OpenAI Responses API client.responses.create wrapper)
       ├── prompts.ts            (Defensive prompt templates, XML boundaries, schema instructions)
       ├── parsers.ts            (Markdown fence sanitization & Zod schema validation)
       └── index.ts              (Provider factory: getAIProvider())
        │
        ▼
[ Data Access & Persistence Layer ]
   - src/lib/storage/
       ├── document-store.ts     (In-memory repository implementing DocumentStore for Phases 1-5)
       └── conversation-store.ts (Bounded in-memory repository for Document Chat sessions)
        │
        ▼
[ Shared Validation, Types & Utils ]
   - src/lib/validation/         (Zod schemas for topic, document analysis, and chat requests/responses)
   - src/types/document.ts       (ExtractedPage, DocumentMetadata, ExtractedDocument)
   - src/types/chat.ts           (ChatMessage, ChatAssistantMessage, ChatEvidenceStatus, ChatRetrievalInfo)
   - src/types/research.ts       (Topic ResearchReport & DocumentAnalysisReport, KeyFinding, DetailedSection)
   - src/lib/utils.ts            (Tailwind utility merge, formatting helpers)
```

---

## 3. Directory Structure & Responsibilities

```
e:\Research Analyzer\
├── docs/                              # Technical specifications & ADRs
│   ├── ARCHITECTURE.md                # System architecture (this document)
│   ├── API_SPECIFICATION.md           # REST contract, request/response envelopes
│   ├── DATABASE_SCHEMA.md             # Supabase / PostgreSQL schema (Phase 6)
│   ├── DECISIONS.md                   # Architecture Decision Records (ADR-001 - ADR-009)
│   ├── DEVELOPMENT_PROGRESS.md        # Phase-by-phase implementation log
│   └── TESTING.md                     # Test strategy, automated suites & smoke-test procedure
├── src/
│   ├── app/                           # App Router routes & layouts
│   │   ├── api/
│   │   │   ├── documents/
│   │   │   │   ├── upload/route.ts    # POST: multipart/form-data upload & extraction
│   │   │   │   └── [id]/route.ts      # GET: retrieve extracted document
│   │   │   ├── health/route.ts        # System health & engine config
│   │   │   └── research/
│   │   │       └── analyze-topic/     # POST: topic research analysis
│   │   ├── documents/[id]/page.tsx    # Document intelligence workspace
│   │   ├── new/page.tsx               # Topic research & PDF upload tabs
│   │   ├── settings/page.tsx          # Diagnostics & architecture verification
│   │   └── page.tsx                   # Executive overview dashboard
│   ├── components/                    # Reusable UI & Layouts
│   │   ├── layout/                    # AppShell, Sidebar, Header
│   │   └── ui/                        # Button, Card, Badge (as span), Alert, Textarea, Skeleton
│   ├── features/
│   │   ├── pdf-analysis/components/   # DocumentViewer, DocumentReportViewer, interactive citations
│   │   └── research/components/       # ReportViewer, SectionCard, EvidenceBadge
│   ├── lib/
│   │   ├── pdf/                       # PDF validator, unpdf extractor, budgeter
│   │   ├── storage/                   # DocumentStore in-memory repository
│   │   ├── ai/                        # OpenAI Responses provider, prompts, and parsers
│   │   ├── validation/                # Zod schemas (research.schema.ts, env.schema.ts)
│   │   └── utils.ts                   # Tailwind utility merge
│   └── types/                         # TypeScript interfaces (document.ts, research.ts, api.ts)
└── tests/                             # Vitest test suite (92 tests)
    ├── fixtures/                      # Mock PDF buffers & JSON reports
    ├── integration/                   # Document upload, document analysis, document chat & OpenAI integration tests
    ├── security/                      # Secret isolation, boundary audit & chat injection tests
    └── unit/                          # PDF validator, PDF extractor, budgeter, retriever, conversation store, prompts, and parser tests
```

---

## 4. PDF Text Extraction & Integrity Standards

1. **Extraction Engine:** Pure TypeScript/JavaScript runtime parsing via `unpdf` with direct access to Mozilla's pdf.js text streams.
2. **Page Boundary Preservation:** Extracted text is stored per page (1-indexed) with individual character and word counts, ensuring citations in subsequent phases refer directly to actual document pages.
3. **Scanned / Image-Only Detection:**
   - Threshold: Total extracted text < 50 characters or average words per page < 5 across the document.
   - Outcome: Automatically sets `isScanned: true` and `ocrRequired: true`, rendering an honest disclaimer that OCR is not supported in the MVP.
4. **Security & Input Sanitization:**
   - Client MIME types are never trusted alone; magic bytes `%PDF-` are verified within the file buffer.
   - Filenames are sanitized using `path.posix.basename`, removing path traversal sequences (`..`), slashes, and control characters.
   - Internal document IDs are generated securely (`doc_${timestamp}_${random}`).

---

## 5. Grounded PDF Analysis & Context Budgeting Standards (Phase 4)

1. **Context-Aware Budgeting:**
   - Long documents exceeding budget (`DEFAULT_MAX_CHAR_BUDGET = 60,000` chars) are budgeted into an introductory window (40%), conclusion window (35%), and middle sampling window (25%).
   - Exact page numbers are strictly preserved in budgeted passages.
   - Transparent coverage metrics (`coveragePercentage`, `isPartialCoverage`, `analyzedPages`) are computed and validated.
2. **Prompt Injection Defense:**
   - Document text is treated as untrusted data.
   - Characters `<` and `>` are sanitized within passages.
   - Passages are enclosed in `<document_passage page="N">` tags.
   - System prompts enforce strict anti-override rules and prohibit inventing page numbers, citations, DOIs, or URLs.
3. **Evidence Attribution & Verifiable Citations:**
   - `from_document`: Directly grounded claims citing exact analyzed pages in `pageReferences: number[]`.
   - `ai_interpretation`: Contextual or analytical synthesis by the model.
   - `not_established`: Unverified or unaddressed dimensions.
4. **Interactive Citation UX:**
   - Clicking citation badges in the analysis report triggers tab switching and smooth scrolling to the exact cited page in the Document Workspace viewer.

---

## 6. Document Chat & Deterministic Passage Retrieval (Phase 5)

1. **Full-Document Scope (Zero Phase 4 Sampling Restrictions):**
   - Document Q&A searches across ALL extracted pages (1 to N) stored in `DocumentStore`, ensuring findings on any page can be answered.
2. **Deterministic BM25 Chunking & Ranking (`src/lib/retrieval/retriever.ts`):**
   - Pages are segmented into overlapping passages (~900 chars with 150-char overlap) retaining exact 1-indexed page associations.
   - Queries are normalized and filtered for stop words, ranking passages with BM25 term frequency-inverse document frequency weighting.
   - Explicit page numbers in queries (e.g., "what is on page 4?") are detected and boosted.
   - Top-ranked passages (bounded by 5 chunks and 10,000 chars) are supplied to the prompt. If no passages match, returns an empty set so the model abstains rather than hallucinations.
3. **Bounded Ephemeral Session Management (`src/lib/storage/conversation-store.ts`):**
   - Sessions are identified by `conv_${timestamp}_${random}` and strictly associated with the target `documentId`.
   - Maximum 20 messages per session with LRU eviction across 50 active sessions.
   - Recent conversation turns (up to 6 messages) are passed in `<conversation_context>` for dialogue continuity.
4. **Evidence Grounding & Interactive Navigation:**
   - Models return structured claims with `pageReferences` and source relevance explanations.
   - Four evidence states: `supported`, `partially_supported`, `not_found`, and `interpretation`.
   - Clicking any citation badge jumps directly to the cited page in the Document Workspace reader.
