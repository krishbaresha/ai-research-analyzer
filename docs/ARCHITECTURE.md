# AI Research Analyzer — System Architecture

> **Document Status:** Active / Authoritative  
> **Last Updated:** 2026-11-03  
> **Target Framework:** Next.js 15 (App Router) + TypeScript + Tailwind CSS

---

## 1. Architectural Principles

1. **Separation of Concerns:** Strict layer isolation between presentation (`src/app`, `src/components`), domain features (`src/features/*`), infrastructure/services (`src/lib/*`), and shared types/contracts (`src/types/*`).
2. **Server-Side AI Confidentiality:** All interactions with the Groq API reside solely on the server. No client component or browser bundle shall ever import or receive `GROQ_API_KEY`.
3. **Evidence-Grounded Reporting & Zero Hallucination:** Claims produced by the model must be explicitly categorized:
   - `from_document`: Grounded with extracted text and page numbers.
   - `retrieved_source`: Backed by an external source.
   - `ai_interpretation`: Analytical extrapolation by the model.
   - `not_established`: Stating explicitly when evidence is missing.
4. **Untrusted Data Boundary:** Uploaded PDFs and web content are treated strictly as untrusted data inputs. They are fed into model prompts with explicit isolation delimiters and defensive system prompting to prevent prompt injection.
5. **Progressive Resilience:** Failures in external LLM calls, rate limits, or malformed outputs are gracefully caught and presented as actionable errors without crashing the client application.

---

## 2. System Layering & Module Boundaries

```
[ Browser / Client ]
        │  (User interaction, UI state, accessible forms)
        ▼
[ Presentation & Route Layer ]
   - src/app/ (Next.js App Router: layouts, pages, loading/error boundaries)
   - src/components/ui/ (Atomic, accessible primitive components)
   - src/components/layout/ (App shell, navigation, header, sidebar)
        │
        ▼
[ Domain Feature Layer ]
   - src/features/research/ (Topic analysis forms, scope preview, report view)
   - src/features/pdf-analysis/ (Upload dropzone, extraction preview, report view)
   - src/features/document-chat/ (Grounded Q&A panel, citation viewer)
   - src/features/projects/ (Project listing, cards, status)
        │
        ▼
[ Server Boundary: API Handlers & Server Actions ]
   - src/app/api/research/analyze-topic/route.ts
   - src/app/api/documents/upload/route.ts
   - src/app/api/documents/[id]/analyze/route.ts
   - src/app/api/documents/[id]/chat/route.ts
        │
        ▼
[ Core Services & Processing Engine ]
   - src/lib/ai/
       ├── groq.service.ts       (Groq SDK wrapper, rate limiting, error handling)
       ├── prompts.ts            (Defensive prompt templates, evidence schema prompts)
       └── parsers.ts            (Structured JSON output validation with Zod)
   - src/lib/pdf/
       ├── extractor.ts          (PDF parsing, page boundary preservation)
       ├── chunker.ts            (Context-aware text chunking with metadata)
       └── validator.ts          (MIME, size, magic bytes, integrity check)
        │
        ▼
[ Data Access & Persistence Layer ]
   - src/lib/db/
       ├── client.ts             (Database client: local adapter or Supabase)
       ├── repository.ts         (Abstract repository pattern for projects & documents)
       └── storage.ts            (Document storage: local temp storage / secure bucket)
        │
        ▼
[ Shared Validation, Types & Utils ]
   - src/lib/validation/         (Zod schemas for inputs, outputs, configs)
   - src/types/                  (Domain types, report contracts, API types)
   - src/lib/utils/              (Formatting, styling helpers, cn utility)
```

---

## 3. Directory Structure & Responsibilities

```
e:\Research Analyzer\
├── docs/                               # Project documentation & architectural records
│   ├── ARCHITECTURE.md                 # System architecture & module boundaries
│   ├── DATABASE_SCHEMA.md              # Conceptual & relational data models
│   ├── API_SPECIFICATION.md            # HTTP endpoints & server action contracts
│   ├── DECISIONS.md                    # Architectural Decision Records (ADRs)
│   ├── AGENT_SKILLS.md                 # Agent skills & MCP tool inventory
│   ├── DEVELOPMENT_PROGRESS.md         # Phased implementation progress log
│   └── TESTING.md                      # Test strategies, fixtures & test cases
│
├── src/
│   ├── app/                            # Next.js App Router (Pages, Routes, Layouts)
│   │   ├── (dashboard)/                # Dashboard layout group
│   │   │   ├── page.tsx                # Main dashboard entry (recent projects, status)
│   │   │   ├── new/                    # Start new topic research or upload
│   │   │   │   └── page.tsx
│   │   │   ├── research/[id]/          # Research report workspace
│   │   │   │   └── page.tsx
│   │   │   ├── documents/[id]/         # Document viewer & grounded Q&A workspace
│   │   │   │   └── page.tsx
│   │   │   └── settings/               # Model configuration & environment status
│   │   │       └── page.tsx
│   │   ├── api/                        # Server-side API Route Handlers
│   │   │   ├── research/
│   │   │   │   └── analyze-topic/route.ts
│   │   │   ├── documents/
│   │   │   │   ├── upload/route.ts
│   │   │   │   ├── [id]/analyze/route.ts
│   │   │   │   └── [id]/chat/route.ts
│   │   │   └── health/route.ts
│   │   ├── layout.tsx                  # Root layout (fonts, providers, metadata)
│   │   ├── globals.css                 # Tailwind CSS styles & CSS custom properties
│   │   └── error.tsx / not-found.tsx   # Global error handling & 404 boundaries
│   │
│   ├── components/                     # Reusable UI component library
│   │   ├── ui/                         # Design system primitives (buttons, inputs, cards, dialogs)
│   │   └── layout/                     # App shell components (sidebar, header, mobile nav)
│   │
│   ├── features/                       # Domain-driven feature modules
│   │   ├── research/                   # Topic analysis forms, report rendering, evidence labels
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── types/
│   │   ├── pdf-analysis/               # PDF upload dropzone, processing status, coverage stats
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── types/
│   │   ├── document-chat/              # Grounded Q&A conversation panel, citation links
│   │   │   ├── components/
│   │   │   └── hooks/
│   │   └── projects/                   # Project lists, empty states, project cards
│   │       ├── components/
│   │       └── hooks/
│   │
│   ├── lib/                            # Infrastructure, core services & utilities
│   │   ├── ai/                         # Server-side LLM inference
│   │   │   ├── groq.service.ts         # Groq client, model dispatch, retry & timeout
│   │   │   ├── prompts.ts              # Defensive prompts with evidence isolation
│   │   │   └── parsers.ts              # Schema-validated JSON response parser
│   │   ├── pdf/                        # PDF extraction & text chunking
│   │   │   ├── extractor.ts            # Page-aware text extraction
│   │   │   ├── chunker.ts              # Context chunking with page metadata
│   │   │   └── validator.ts            # PDF MIME, size & header validation
│   │   ├── db/                         # Persistence abstraction
│   │   │   ├── adapter.ts              # In-memory / file / Supabase adapter interface
│   │   │   └── memory-store.ts         # Phase 1-5 development store
│   │   ├── validation/                 # Shared validation schemas (Zod)
│   │   │   ├── env.schema.ts           # GROQ_API_KEY, GROQ_MODEL, limits validation
│   │   │   ├── research.schema.ts      # Topic analysis request & report schemas
│   │   │   └── document.schema.ts      # PDF upload & chat query schemas
│   │   └── utils/                      # General utilities (tailwind merge, formatting)
│   │
│   └── types/                          # Core TypeScript domain definitions
│       ├── research.ts                 # ResearchReport, EvidenceLabel, AnalysisSection
│       ├── document.ts                 # DocumentMetadata, ExtractedPage, DocumentChunk
│       ├── api.ts                      # Standard ApiResponse<T>, ApiError
│       └── chat.ts                     # ChatMessage, CitationReference
│
├── tests/                              # Automated test suites
│   ├── unit/                           # Pure function tests (chunker, parsers, validators)
│   │   ├── pdf-validator.test.ts
│   │   ├── chunker.test.ts
│   │   └── report-parser.test.ts
│   ├── integration/                    # Service-level integration tests
│   │   ├── groq-service.test.ts
│   │   └── pdf-extractor.test.ts
│   └── fixtures/                       # Test assets (sample PDFs, mocked LLM responses)
│       ├── sample-valid.pdf
│       ├── sample-empty.pdf
│       └── mock-groq-report.json
│
├── public/                             # Static public assets
├── .env.example                        # Template for environment variables (no secrets)
├── package.json                        # Dependencies and scripts
├── tsconfig.json                       # Strict TypeScript configuration
├── tailwind.config.ts                  # Tailwind configuration & design tokens
└── next.config.ts                      # Next.js server configuration
```

---

## 4. Coding & Architectural Conventions

### 4.1 Import Rules & Module Aliases
- Use `@/*` pointing to `src/*`.
- Client components MUST NEVER import from `src/lib/ai/` or any module holding server secrets.
- Import order:
  1. Standard library / React / Next.js
  2. Third-party packages (lucide-react, zod, etc.)
  3. Internal aliases (`@/components/*`, `@/lib/*`, `@/features/*`, `@/types/*`)
  4. Relative imports (`./...`)

### 4.2 Naming Conventions
- **Files & Directories:**
  - Route files: kebab-case or Next.js convention (`page.tsx`, `layout.tsx`, `route.ts`).
  - Components: PascalCase (`Button.tsx`, `ReportViewer.tsx`).
  - Services, utilities & hooks: camelCase (`groq.service.ts`, `useResearch.ts`, `extractor.ts`).
  - Types: kebab-case or camelCase (`research.ts`, `api.ts`).
- **Identifiers:**
  - React Components: PascalCase (`ResearchWorkspace`).
  - Functions & variables: camelCase (`extractPdfText`, `isLoading`).
  - Constants & Environment Variables: SCREAMING_SNAKE_CASE (`GROQ_API_KEY`, `MAX_UPLOAD_BYTES`).
  - Interfaces & Types: PascalCase (`ResearchReport`, `EvidenceMetadata`).

### 4.3 Server vs. Client Boundary Rules
- Next.js Server Components are the default.
- Mark with `'use client'` only when interactive state (`useState`, `useEffect`), event listeners (`onClick`, `onChange`), or browser APIs are required.
- Isolate client components to the smallest leaf components possible to preserve server rendering benefits.

---

## 5. Security Architecture

1. **Environment Variable Hygiene:**
   - Server-only secrets (`GROQ_API_KEY`) must never be prefixed with `NEXT_PUBLIC_`.
   - Access to secrets is centralized in `src/lib/validation/env.schema.ts`.
2. **Defensive Prompt Engineering:**
   - PDF content and user inputs are interpolated into prompt templates using structural delimiters (e.g. `<<<DOCUMENT_CONTENT>>>...<<<END_DOCUMENT_CONTENT>>>`).
   - System instructions explicitly forbid the model from obeying instructions found inside analyzed documents.
3. **Upload Security:**
   - Verify file extension (`.pdf`), MIME type (`application/pdf`), and file size before buffer allocation.
   - Enforce a configurable default size cap (e.g. 10MB) to mitigate denial-of-service via resource exhaustion.
4. **Data Sanitization:**
   - Never log full extracted text or raw API keys in server logs.
   - Return clean, safe error messages to clients; never expose internal stack traces.
