# AI Research Analyzer — System Architecture

> **Document Status:** Active / Authoritative  
> **Last Updated:** 2026-11-03 (Phase 2: Complete Migration to OpenAI Responses API)  
> **Target Framework:** Next.js 15 (App Router) + TypeScript + Tailwind CSS

---

## 1. Architectural Principles

1. **Separation of Concerns:** Strict layer isolation between presentation (`src/app`, `src/components`), domain features (`src/features/*`), infrastructure/services (`src/lib/*`), and shared types/contracts (`src/types/*`).
2. **Server-Side AI Confidentiality:** All interactions with AI APIs reside solely on the server. No client component or browser bundle shall ever import or receive `OPENAI_API_KEY`.
3. **Modular AI Provider Abstraction:** Inference services implement an abstract `AIProvider` interface (`src/lib/ai/provider.ts`), decoupling domain logic from specific model providers. The official **OpenAI SDK** (`openai`) with the modern **Responses API** (`client.responses.create()`) is the active default provider (`OpenAIProvider`), with a robust fallback to structured completions.
4. **Evidence-Grounded Reporting & Zero Hallucination:** Claims produced by the model must be explicitly categorized:
   - `from_document`: Grounded with extracted text and page numbers.
   - `retrieved_source`: Backed by an external source.
   - `ai_interpretation`: Analytical extrapolation by the model.
   - `not_established`: Stating explicitly when evidence is missing.
5. **Untrusted Data Boundary:** Uploaded PDFs, web content, and user topics are treated strictly as untrusted data inputs. They are fed into model prompts with explicit XML isolation delimiters (`<user_topic>`, `<scope_constraints>`) and defensive system prompting to prevent prompt injection.
6. **Progressive Resilience:** Failures in external LLM calls, rate limits, or malformed outputs are caught by standardized domain errors (`AIAuthError`, `AIRateLimitError`, `AIQuotaExceededError`, `AITimeoutError`, `AIResponseParseError`) and returned as actionable envelopes.

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
   - src/app/api/health/route.ts
   - src/app/api/documents/upload/route.ts (Phase 3)
   - src/app/api/documents/[id]/analyze/route.ts (Phase 3)
   - src/app/api/documents/[id]/chat/route.ts (Phase 4)
        │
        ▼
[ Core Services & Processing Engine ]
   - src/lib/ai/
       ├── provider.ts           (Abstract AIProvider interface & domain error classes)
       ├── openai.provider.ts    (OpenAI Responses API client.responses.create wrapper)
       ├── prompts.ts            (Defensive prompt templates, XML boundaries, schema instructions)
       ├── parsers.ts            (Markdown fence sanitization & Zod schema validation)
       └── index.ts              (Provider factory: getAIProvider())
   - src/lib/pdf/ (Phase 3)
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
   - src/lib/utils.ts            (Formatting, styling helpers, cn utility)
```

---

## 3. Directory Structure & Responsibilities

```
e:\Research Analyzer\
├── .env.example                       # Documented environment template with OPENAI_API_KEY placeholder
├── docs/                              # Project technical specifications & ADRs
│   ├── ARCHITECTURE.md                # System architecture (this document)
│   ├── API_SPECIFICATION.md           # REST contract, request/response envelopes
│   ├── DATABASE_SCHEMA.md             # Supabase / PostgreSQL schema (Phase 6)
│   ├── DECISIONS.md                   # Architecture Decision Records (ADR-001 - ADR-008)
│   ├── DEVELOPMENT_PROGRESS.md        # Phase-by-phase implementation log
│   └── TESTING.md                     # Test strategy, automated suites & smoke-test procedure
├── src/
│   ├── app/                           # App Router routes & layouts
│   │   ├── api/
│   │   │   ├── health/                # System health endpoint (reporting OpenAI config status)
│   │   │   └── research/
│   │   │       └── analyze-topic/     # POST endpoint for topic research analysis
│   │   ├── new/                       # Inquiry formulation & report generation workspace
│   │   ├── settings/                  # Diagnostics & architecture verification
│   │   └── page.tsx                   # Executive overview dashboard
│   ├── components/                    # Reusable UI & Layouts
│   │   ├── layout/                    # AppShell, Sidebar, Header
│   │   └── ui/                        # Button, Card, Badge, Alert, Textarea, Skeleton
│   ├── features/
│   │   └── research/                  # ReportViewer, SectionCard, EvidenceBadge
│   ├── lib/
│   │   ├── ai/                        # OpenAI Responses provider, prompts, and schema parsers
│   │   ├── validation/                # Zod schemas (research.schema.ts, env.schema.ts)
│   │   └── utils.ts                   # Tailwind utility merge
│   └── types/                         # TypeScript interfaces (research.ts, api.ts)
└── tests/                             # Vitest test suite
    ├── fixtures/                      # Mock OpenAI report fixture
    ├── integration/                   # OpenAI provider integration test
    ├── security/                      # Secret isolation & boundary audit
    └── unit/                          # Prompts generation & parser tests
```

---

## 4. AI Provider Architecture & Fallback Strategy

The application adopts the **Modular AI Provider Pattern**:

1. **Active Primary Provider:** `OpenAIProvider` (`src/lib/ai/openai.provider.ts`).
2. **SDK & API:** Official `openai` npm package (v7+) invoking `client.responses.create({ model, instructions, input })`.
3. **Model Selection:**
   - Default: `gpt-4o-mini` (high intelligence, fast latency, minimal token cost for structured academic extraction).
   - Configurable: via `OPENAI_MODEL` environment variable (e.g., `gpt-4o`, `o3-mini`).
4. **Adaptive Graceful Fallback:** If an older model or endpoint does not support `responses.create()`, `OpenAIProvider` automatically falls back to `client.chat.completions.create({ response_format: { type: "json_object" } })`.
5. **Contract Validation:** The model response is parsed via `parseAndValidateReport` which sanitizes Markdown markdown blocks (````json ... ````) and verifies the payload against `researchReportSchema`.

---

## 5. Security & Isolation Standard

- **No Client Secrets:** `OPENAI_API_KEY` is validated by Zod exclusively on the server (`src/lib/validation/env.schema.ts`). It is never prefixed with `NEXT_PUBLIC_`.
- **Zero Client Bundle Bleed:** Vitest automated security tests (`tests/security/secret-isolation.test.ts`) recursively verify that neither `openai` SDK nor `OPENAI_API_KEY` is referenced in any client (`"use client"`) file.
- **Defensive Boundary Delimiters:** Prompts encapsulate user inputs within unambiguous XML tags (`<user_topic>...</user_topic>`), preventing user inputs from hijacking instruction flow.
