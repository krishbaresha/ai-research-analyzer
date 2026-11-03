# AI Research Analyzer — System Architecture

> **Document Status:** Active / Authoritative  
> **Last Updated:** 2026-11-03 (Updated for OpenAI Responses API Migration)  
> **Target Framework:** Next.js 15 (App Router) + TypeScript + Tailwind CSS

---

## 1. Architectural Principles

1. **Separation of Concerns:** Strict layer isolation between presentation (`src/app`, `src/components`), domain features (`src/features/*`), infrastructure/services (`src/lib/*`), and shared types/contracts (`src/types/*`).
2. **Server-Side AI Confidentiality:** All interactions with LLM APIs reside solely on the server. No client component or browser bundle shall ever import or receive `OPENAI_API_KEY`.
3. **Modular AI Provider Abstraction:** Inference services implement an abstract `AIProvider` interface (`src/lib/ai/provider.ts`), decoupling the application from specific AI vendors. OpenAI Responses API (`client.responses.create()`) is the primary provider, with pluggable support for future providers.
4. **Evidence-Grounded Reporting & Zero Hallucination:** Claims produced by the model must be explicitly categorized:
   - `from_document`: Grounded with extracted text and page numbers.
   - `retrieved_source`: Backed by an external source.
   - `ai_interpretation`: Analytical extrapolation by the model.
   - `not_established`: Stating explicitly when evidence is missing.
5. **Untrusted Data Boundary:** Uploaded PDFs, web content, and user topics are treated strictly as untrusted data inputs. They are fed into model prompts with explicit XML isolation delimiters and defensive system prompting to prevent prompt injection.
6. **Progressive Resilience:** Failures in external LLM calls, quota limits, rate limits, or malformed outputs are caught by standardized domain errors (`AIAuthError`, `AIRateLimitError`, `AIQuotaExceededError`, `AITimeoutError`, `AIResponseParseError`) and returned as actionable envelopes.

---

## 2. System Layering & Module Boundaries

```
[ Browser / Client ]
        │  (User interaction, UI state, accessible forms)
        ▼
[ Presentation & Route Layer ]
   - src/app/ (Next.js App Router: layouts, pages, loading/error boundaries)
   - src/components/ui/ (Atomic, accessible Swiss Modernism 2.0 components)
   - src/components/layout/ (App shell, navigation, header, sidebar)
        │
        ▼
[ Domain Feature Layer ]
   - src/features/research/ (Topic analysis forms, report viewer, evidence badges)
   - src/features/pdf-analysis/ (Upload dropzone, extraction preview, coverage stats)
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
       ├── provider.ts           (Abstract AIProvider interface & domain error classes)
       ├── openai.provider.ts    (OpenAI Responses API client.responses.create wrapper)
       ├── prompts.ts            (Defensive prompt templates, XML boundaries, schema instructions)
       ├── parsers.ts            (Markdown fence sanitization & Zod schema validation)
       └── index.ts              (Provider factory: getAIProvider())
   - src/lib/pdf/
       ├── extractor.ts          (PDF parsing, page boundary preservation)
       ├── chunker.ts            (Context-aware text chunking with metadata)
       └── validator.ts          (MIME, size, magic bytes, integrity check)
        │
        ▼
[ Data Access & Persistence Layer ]
   - src/lib/db/
       ├── adapter.ts            (In-memory / file / Supabase adapter interface)
       └── memory-store.ts       (Phase 1-5 development store)
        │
        ▼
[ Shared Validation, Types & Utils ]
   - src/lib/validation/         (Zod schemas for inputs, outputs, env)
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
│   │   ├── ui/                         # Design system primitives (button, badge, card, input, textarea, alert, skeleton)
│   │   └── layout/                     # App shell components (sidebar, header, app-shell)
│   │
│   ├── features/                       # Domain-driven feature modules
│   │   └── research/                   # Topic analysis forms, report viewer, evidence badges
│   │       └── components/
│   │           └── report-viewer.tsx
│   │
│   ├── lib/                            # Infrastructure, core services & utilities
│   │   ├── ai/                         # Server-side LLM inference
│   │   │   ├── provider.ts             # AIProvider contract & domain error classes
│   │   │   ├── openai.provider.ts      # OpenAI Responses API client implementation
│   │   │   ├── prompts.ts              # Defensive prompts with evidence isolation
│   │   │   ├── parsers.ts              # Schema-validated JSON response parser
│   │   │   └── index.ts                # Provider factory singleton
│   │   ├── validation/                 # Shared validation schemas (Zod)
│   │   │   ├── env.schema.ts           # OPENAI_API_KEY, OPENAI_MODEL validation
│   │   │   └── research.schema.ts      # Topic request & report Zod contracts
│   │   └── utils.ts                    # General utilities (cn, formatBytes, formatDate)
│   │
│   └── types/                          # Core TypeScript domain definitions
│       ├── research.ts                 # ResearchReport, EvidenceLabel, FindingItem
│       ├── document.ts                 # DocumentMetadata, ExtractedPage, DocumentChunk
│       ├── api.ts                      # Standard ApiResponse<T>, ApiError
│       └── chat.ts                     # ChatMessage, CitationReference
│
├── tests/                              # Automated test suites
│   ├── unit/                           # Pure function tests (parsers, prompts)
│   │   ├── parsers.test.ts
│   │   └── prompts.test.ts
│   ├── integration/                    # Service-level integration tests (OpenAI provider)
│   │   └── openai-provider.test.ts
│   ├── security/                       # Secret boundary & isolation tests
│   │   └── secret-isolation.test.ts
│   └── fixtures/                       # Test assets (mock reports, sample payloads)
│       └── mock-openai-report.json
│
├── public/                             # Static public assets
├── .env.example                        # Template for environment variables (no secrets)
├── package.json                        # Dependencies and scripts
├── tsconfig.json                       # Strict TypeScript configuration
└── tailwind.config.ts                  # Tailwind configuration & design tokens
```

---

## 4. Coding & Architectural Conventions

### 4.1 Import Rules & Module Aliases
- Use `@/*` pointing to `src/*`.
- Client components MUST NEVER import from `src/lib/ai/` or any module holding server secrets.
- Import order:
  1. Standard library / React / Next.js
  2. Third-party packages (openai, lucide-react, zod)
  3. Internal aliases (`@/components/*`, `@/lib/*`, `@/features/*`, `@/types/*`)
  4. Relative imports (`./...`)

### 4.2 Security Architecture
1. **Environment Variable Hygiene:**
   - Server-only secrets (`OPENAI_API_KEY`) must never be prefixed with `NEXT_PUBLIC_`.
   - Access to secrets is centralized in `src/lib/validation/env.schema.ts`.
2. **Defensive Prompt Engineering:**
   - User inputs are enclosed in explicit structural tags (`<user_topic>`, `<scope_constraints>`).
   - System prompts explicitly forbid the model from obeying instructions found inside user input.
3. **Data Sanitization:**
   - Never print raw API keys in server logs or expose internal stack traces to the client.
