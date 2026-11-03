# AI Research Analyzer — Project Context & Engineering Specification

> **Document Status:** Authoritative Master Source of Truth  
> **Last Synchronized:** 2026-11-03  
> **Workspace:** `E:\Research Analyzer`  
> **Target Framework:** Next.js 15 (App Router) + TypeScript (Strict) + Tailwind CSS + OpenAI SDK  

---

## 1. Project Identity & Purpose

**Product Name:** AI Research Analyzer  
**Product Category:** AI-Powered Academic Research Workspace & Literature Intelligence Platform  
**Target Audience:** Students, independent scholars, graduate researchers, and academic professionals analyzing complex scientific literature, comparing research papers, and investigating open research topics.

### Core Value Proposition
AI Research Analyzer bridges the gap between raw research papers (PDFs, arXiv preprints, scholarly publications) and deep academic understanding. Unlike generic AI chatbots that hallucinate citations, summarize without context, or produce ungrounded prose, AI Research Analyzer operates on strict academic research integrity:
1. **Traceable Evidence:** Every factual assertion is tagged with exact, 1-indexed page citations linking directly to the source document.
2. **Epistemic Clarity:** Clear categorization separates verified document evidence (`from_document` / `supported`), analytical synthesis (`ai_interpretation`), and unestablished or missing claims (`not_established` / `not_found`).
3. **Honest Abstention:** When an uploaded paper or queried passage does not support a claim, the system explicitly abstains rather than inventing plausible-sounding facts.
4. **Structured Research Output:** Outputs 12 comprehensive analytical sections covering methodology, research gaps, limitations, and conceptual models.

---

## 2. Current Technology Stack

| Layer | Technology | Version | Purpose & Architecture Role |
|---|---|---|---|
| **Framework** | Next.js (App Router) | `15.5.9` | Full-stack React framework with React 19, Server Components, and API Route Handlers. |
| **Language** | TypeScript | `^5` (Strict) | Strict end-to-end type safety, zero `any` policy for domain contracts. |
| **Styling & UI** | Tailwind CSS + Lucide Icons | `^3.4.1` / `^1.16.0` | Swiss Modernism 2.0 design tokens, high information density, accessible ARIA primitives. |
| **AI Inference** | OpenAI SDK (`openai`) | `^4.85.4` | Official SDK executing `client.responses.create()` (fallback to chat completions). |
| **Default Model** | `gpt-4o-mini` | Configurable | High-speed, cost-effective reasoning model with 128k context window. |
| **PDF Extraction** | `unpdf` | `^2.1.0` | Pure TypeScript/JS pdf.js wrapper with zero native C++ runtime dependencies. |
| **Validation** | Zod | `^3.24.2` | Runtime schema validation for server env, API requests, and LLM JSON outputs. |
| **Storage (Current)** | Ephemeral In-Memory Store | Custom TS | In-memory singleton stores (`DocumentStore`, `ConversationStore`) adhering to ADR-004. |
| **Package Manager** | pnpm | `^11.13.0` | Fast, deterministic disk-efficient dependency management. |
| **Testing** | Vitest | `^3.0.5` | Fast ESM unit, integration, and security test runner. |
| **Linting** | ESLint + Next.js Plugin | `^9` | Static analysis enforcing clean React/Next.js best practices. |

---

## 3. Actual Project Architecture

The application enforces a unidirectional four-tier architecture with strict boundary enforcement:

```
[ Browser Client ]
       │
       ├── User interactions, drag-and-drop file upload, topic exploration
       ├── Clickable page citation pills (p. 1, p. 4) with smooth page scrolling
       └── Accessible Swiss Modernism 2.0 UI components (Badge as span, Card, Button)
       │
       ▼
[ Presentation & Route Layer (`src/app`) ]
       │
       ├── App Router Layouts, Pages, Error Boundaries (`error.tsx`), Loading (`loading.tsx`)
       ├── UI Primitives (`src/components/ui/*`)
       └── Feature Components:
             ├── `src/features/research/` (Topic analysis, structured report viewer)
             ├── `src/features/pdf-analysis/` (Upload dropzone, DocumentViewer, DocumentReportViewer)
             └── `src/features/document-chat/` (DocumentChat, claim badges, sources accordion)
       │
       ▼
[ Server Boundary & API Handlers (`src/app/api`) ]
       │
       ├── `POST /api/research/analyze-topic` (Zod validation, OpenAI prompt orchestration)
       ├── `POST /api/documents/upload` (Multipart file validation, unpdf extraction, store insertion)
       ├── `GET  /api/documents/[id]` (Document metadata and page-by-page text retrieval)
       ├── `POST /api/documents/[id]/analyze` (Context budgeting, prompt isolation, OpenAI Responses API)
       ├── `POST /api/documents/[id]/chat` (BM25 passage retrieval, OpenAI Responses API chat)
       ├── `DELETE /api/documents/[id]/chat` (Clear conversation session)
       └── `GET  /api/health` (Runtime diagnostics, active AI provider check)
       │
       ▼
[ Domain Core & Infrastructure Services (`src/lib`) ]
       │
       ├── `src/lib/pdf/`
       │     ├── `validator.ts` (Magic bytes %PDF-, 10MB limit, path traversal sanitization, safe IDs)
       │     ├── `extractor.ts` (unpdf text extraction, scanned PDF detection, word/char counts)
       │     └── `budgeter.ts` (60k-char context budgeting, strategic weighted sampling, XML escaping)
       ├── `src/lib/retrieval/`
       │     └── `retriever.ts` (Deterministic BM25 passage chunking, page query boosting, abstention)
       ├── `src/lib/ai/`
       │     ├── `provider.ts` (Abstract AIProvider contract & domain error taxonomy)
       │     ├── `openai.provider.ts` (OpenAI Responses API client with completions fallback)
       │     ├── `prompts.ts` (XML prompt envelopes, injection defense directives)
       │     └── `parsers.ts` (Markdown code fence stripping, Zod schema validation)
       └── `src/lib/storage/`
             ├── `document-store.ts` (In-memory document repository with TTL cleanup)
             └── `conversation-store.ts` (Bounded 20-message in-memory conversation store)
```

---

## 4. Completed Phase History

### Phase 1: Foundation, App Shell & Design System (Completed — Commit `d0e52da`)
- Established Next.js 15 App Router architecture with TypeScript strict mode and Tailwind CSS.
- Implemented Swiss Modernism 2.0 design system: high contrast, strict typographic hierarchy, neutral palettes, and accessible card/table layouts.
- Built application shell (`/`, `/new`, `/documents`, `/settings`) with responsive sidebar and navigation.
- Fixed hydration mismatches by rendering `Badge` as an inline `<span>` element (Commit `944d0c7`).

### Phase 2: Server-Side AI Integration & Topic Research (Completed — Commits `fa2eb57`, `f68d942`)
- Initially prototyped with Groq, then permanently migrated to the official OpenAI SDK (`openai`) using the modern Responses API (`client.responses.create()`).
- Completely purged `groq-sdk` and legacy Groq dependencies.
- Standardized environment validation with Zod (`OPENAI_API_KEY`, `OPENAI_MODEL`).
- Built topic-based research workflow generating 8 structured report sections with evidence tagging.
- Implemented domain error mapping (`AIAuthError`, `AIRateLimitError`, `AIQuotaExceededError`, `AITimeoutError`, `AIResponseParseError`).

### Phase 3: PDF Upload & Reliable Text Extraction (Completed — Commit `64da6aa`)
- Integrated `unpdf` for zero-native-dependency, cross-platform PDF parsing.
- Implemented strict server-side validation: `%PDF-` magic bytes header verification, 10MB size enforcement, and path-traversal filename sanitization.
- Preserved strict 1-indexed page boundaries with per-page and total word/character metrics.
- Built scanned / image-only PDF detection (< 50 chars or < 5 words/page), surfacing transparent `OCR_REQUIRED` disclaimers.
- Zero PDF content transmitted to external AI providers in this phase.
- Established ephemeral `DocumentStore` abstraction.

### Phase 4: PDF Analysis & Evidence-Grounded Reports (Completed — Commits `ed2049a`, `4c6a9a7`)
- Connected extracted PDF documents to OpenAI Responses API for deep academic synthesis.
- Built context-aware long document budgeter (60,000 character limit) with weighted strategic sampling: opening/abstract (40%), conclusion/discussion (35%), and middle methodology (25%).
- Implemented XML passage envelope isolation (`<document_passage page="N">`) and prompt injection neutralization.
- Structured report contract covering 12 academic sections with verifiable 1-indexed page citations.
- Built interactive frontend `DocumentReportViewer` with clickable citation navigation to extracted pages.
- Successfully executed live OpenAI verification and comprehensive QA audit (Commit `4c6a9a7`).

### Current Codebase State Regarding Document Chat (Commit `267df7c`)
- An initial in-memory document chat prototype was developed in commit `267df7c`, featuring deterministic BM25 passage retrieval (`retriever.ts`), in-memory conversation storage (`conversation-store.ts`), and claim-level page citations.
- **Clarification:** While this grounded Q&A foundation is operational in code, the full, expanded scope of Phase 5 (Scholarly Paper Import from URL/arXiv/DOI, SSRF defense suite, Research Library foundation, and automation event hooks) has **NOT** been implemented. Phase 5 is officially designated as the **NEXT** phase to be comprehensively delivered.

---

## 5. Verified Testing & Build Status

- **Automated Test Suites:** 17 test files, **92 / 92 tests passing (100%)** via Vitest.
  - Unit tests: PDF validator, PDF extractor, document budgeter, document retriever, conversation store, parsers, prompts.
  - Integration tests: Document upload, document analysis, document chat, OpenAI provider, Phase 4 QA audit.
  - Security tests: Secret isolation (server-key leak prevention), chat XML delimiter sanitization, prompt injection defenses.
- **TypeScript Strictness:** Clean compilation with zero errors (`tsc --noEmit`).
- **ESLint:** Clean run with zero warnings or errors (`next lint`).
- **Production Build:** Next.js production build cleanly compiles all 11 application routes.

---

## 6. Current Git Checkpoint & Verified Commits

- **Active Branch:** `main`
- **Working Tree:** Clean (zero uncommitted changes in source code)
- **Verified Commit Log:**
  1. `267df7c` — `feat(phase-5): implement document chat, deterministic passage retrieval, and grounded Q&A`
  2. `4c6a9a7` — `fix(qa): harden schema resilience, budgeter char counts, and scanned PDF error codes`
  3. `ed2049a` — `feat(phase-4): implement grounded PDF analysis, page citations, and context budgeting`
  4. `64da6aa` — `feat(phase-3): implement server-side PDF upload, page-by-page text extraction, and scanned document detection`
  5. `944d0c7` — `fix(ui): resolve HTML hydration mismatch by rendering Badge as span and replacing CardDescription container`
  6. `f68d942` — `feat(ai): activate OpenAI Responses API as sole provider and remove groq-sdk`
  7. `55140a3` — `feat(phase-2): complete server-side Groq integration and topic analysis workflow`
  8. `fa2eb57` — `feat(phase-2): migrate AI provider to OpenAI Responses API and implement topic analysis workflow`
  9. `d0e52da` — `feat(phase-1): establish application shell, Swiss Modernism design system, and documentation`

---

## 7. Existing Implemented Features & Endpoints

### User-Facing Features
1. **Interactive Dashboard (`/`):** Summary statistics, quick action triggers, research history placeholder, and health status indicators.
2. **New Research Workspace (`/new`):** Dual-mode input with Topic Analysis tab and PDF Upload dropzone with live validation and stage-by-stage progress feedback.
3. **Extracted Document Viewer (`/documents/[id]`):** Page-by-page digital viewer with word counts, full text extraction inspection, scanned PDF warnings, and interactive citation jumping.
4. **Structured Document Analysis (`/documents/[id]`):** 12-section evidence-grounded research reports with clickable page citations, coverage metrics, and markdown export.
5. **Grounded Document Chat Prototype (`/documents/[id]`):** Interactive Q&A tab with claim citations, sources accordion, retrieval transparency metrics, and example research prompts.
6. **System Diagnostics & Settings (`/settings`):** Active AI provider verification (`openai`), model confirmation (`gpt-4o-mini`), and storage mode reporting.

### Operational API Endpoints
- `GET  /api/health` — Service health, active AI provider, and configuration checks.
- `POST /api/research/analyze-topic` — Topic analysis generating structured report via OpenAI Responses API.
- `POST /api/documents/upload` — Multipart PDF upload, magic bytes check, page-by-page extraction via `unpdf`.
- `GET  /api/documents/[id]` — Retrieve stored document metadata and extracted pages.
- `POST /api/documents/[id]/analyze` — Context-budgeted document analysis via OpenAI Responses API.
- `POST /api/documents/[id]/chat` — Grounded document chat with BM25 passage retrieval.
- `DELETE /api/documents/[id]/chat` — Reset conversation history for a document.

---

## 8. Current Limitations & Technical Debt

1. **Ephemeral In-Memory Storage:** Uploaded documents and chat sessions reside strictly in Node.js server memory (`DocumentStore`, `ConversationStore`). Restarting the server clears all data. (Persistent PostgreSQL/Supabase storage is scheduled for Phase 6).
2. **No OCR Support:** Scanned or image-only PDFs cannot be processed digitally. The system detects this condition and returns `OCR_REQUIRED` (422) with a user disclaimer. (Tesseract / cloud OCR is deferred to later phases).
3. **Zero Vector DB / Embeddings:** Retrieval relies on deterministic BM25 keyword matching across in-memory page chunks. No external vector stores (pgvector, Pinecone) or embedding API calls are used.
4. **Single-Document Scope:** Document analysis and chat operate strictly on one document at a time. Multi-document cross-synthesis is scheduled for Phase 7.
5. **No Remote Scholarly Import Yet:** Papers can currently only be ingested via direct local PDF file upload. Remote PDF URLs, arXiv IDs, and DOI resolution are not yet implemented (scheduled for expanded Phase 5).
6. **No Automated Research Triggers:** No background cron jobs, webhook listeners, or event dispatchers are currently executing (scheduled for Phase 10).

---

## 9. Security Boundaries & Invariants

1. **Server-Side Key Isolation:** `OPENAI_API_KEY` is strictly confined to server-side code (`src/lib/ai/*`, Route Handlers). It must never have a `NEXT_PUBLIC_` prefix, never appear in client bundles, and never be logged or returned in API responses.
2. **Untrusted Data Boundary:** All uploaded files, user topics, extracted text, and future remote URL payloads are treated as untrusted data inputs.
3. **Prompt Injection Defense:** Model prompts wrap external data in explicit XML envelopes (`<user_topic>`, `<document_passage page="N">`, `<retrieved_passage page="N">`). System prompts explicitly direct the model to treat content within these tags as passive data, ignoring any embedded instructions or overrides.
4. **File Upload Security:** File upload verifies the `%PDF-` signature within the first 1024 bytes, enforces a 10MB maximum limit, sanitizes filenames to prevent path traversal (`..`, `/`, `\`), and assigns internal collision-resistant IDs (`doc_${timestamp}_${random}`).
5. **SSRF Defense Architecture (Mandatory for Remote Ingestion):**
   - Protocol restriction: Allow `https://` only (disallow `http://`, `file://`, `ftp://`, `gopher://`).
   - Host validation: Resolve DNS before fetching; immediately deny private/loopback IP ranges (`127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`, `::1`, `fc00::/7`).
   - Header verification: Validate `Content-Type: application/pdf` or expected JSON before consuming body streams.
   - Redirect bounds: Follow at most 3 redirects, re-verifying SSRF safety on each hop.
   - Size & Timeout caps: Enforce 15MB download limit and 15-second socket timeout.

---

## 10. Expanded Phase 5 Scope & Requirements

The user has formally defined the complete, expanded scope for **Phase 5**:
**DOCUMENT CHAT + RESEARCH PAPER IMPORT + RESEARCH LIBRARY FOUNDATION**

### 1. Grounded Document Chat (Full-Document Scope)
- Retain and harden the grounded document Q&A engine.
- Search across ALL extracted pages (1 to N) using deterministic BM25 passage chunking.
- Claim-level page citations (`pageReferences: [2, 5]`) with visual evidence status badges (`supported`, `partially_supported`, `not_found`, `interpretation`).
- Clickable citations that navigate and highlight the source page in the workspace.
- Multi-turn conversation memory (bounded to 20 messages per session).
- Explicit abstention when evidence is absent from the document.

### 2. Research Paper Import Engine
Support 4 distinct ingestion channels:
1. **Local PDF Upload:** Existing validated file upload dropzone.
2. **Public PDF URL Import:** Ingest papers directly from accessible HTTPS URLs with server-side fetching and streaming validation.
3. **arXiv Paper Import:** Accept arXiv URLs or identifiers (e.g. `https://arxiv.org/abs/2301.12345` or `2301.12345`), fetch paper metadata via arXiv API, and download the source PDF via `https://arxiv.org/pdf/{id}.pdf`.
4. **DOI / Scholarly Metadata Import:** Accept DOIs (e.g. `10.1145/3318464.3389700`), resolve paper metadata via Crossref / OpenAlex / Semantic Scholar open APIs, and locate open-access PDF URLs via Unpaywall where available.

### 3. Safe Remote Document Fetching & SSRF Defense Layer
- Implement `src/lib/security/ssrf.ts` to validate all remote URLs before dispatching HTTP requests.
- Strict IP pinning, loopback blocklists, AWS/GCP metadata IP blocking (`169.254.169.254`), and bound redirection checks.

### 4. Smart Document Processing Pipeline
- Single unified pipeline regardless of ingestion source:
  `Fetch / Upload -> Validate Signature & Size -> Extract Pages (unpdf) -> Scanned Check -> Generate Safe ID & Library Metadata -> Ephemeral Store`.

### 5. In-Memory Research Library Foundation
- Extend `DocumentStore` to maintain an in-memory catalog of all ingested research papers with rich metadata:
  `id`, `title`, `authors`, `abstract`, `year`, `venue`, `doi`, `arxivId`, `sourceType` (`upload`, `url`, `arxiv`, `doi`), `pageCount`, `wordCount`, `uploadedAt`.
- Frontend Research Library tab on the dashboard to browse, search, and reopen papers.

### 6. Event Architecture Foundation (For Future Automations)
- Design a lightweight, synchronous in-memory event emitter/dispatcher (`src/lib/events/event-bus.ts`) to emit domain lifecycle events:
  - `paper.imported`
  - `paper.analyzed`
  - `chat.message_sent`
- Prepares the application for Phase 10 research automations without adding premature complexity.

---

## 11. Explicitly Excluded Functionality (What NOT to Build in Phase 5)

To maintain focus and avoid scope bloat, the following are strictly prohibited in Phase 5:
- ❌ **No Persistent Database:** Do not introduce PostgreSQL, Supabase, Prisma, or SQLite. Keep storage strictly in-memory per ADR-004.
- ❌ **No External Vector Databases:** Do not introduce Pinecone, Weaviate, Qdrant, or pgvector.
- ❌ **No External Embedding APIs:** Do not introduce `text-embedding-3-*` or other vectorization API calls.
- ❌ **No Optical Character Recognition (OCR):** Do not integrate Tesseract or cloud vision OCR for scanned documents.
- ❌ **No Paid External Search APIs:** Do not integrate Google Search API, Bing Search API, or Tavily. Use only free, open academic APIs (arXiv, Crossref, OpenAlex, Semantic Scholar).
- ❌ **No User Authentication / Accounts:** Do not introduce NextAuth, Clerk, or Supabase Auth.
- ❌ **No Multi-Document Synthesis:** Comparing multiple papers is strictly reserved for Phase 7.

---

## 12. Long-Term Roadmap (10 Phases)

| Phase | Title | Status | Primary Deliverables & Objectives |
|---|---|---|---|
| **Phase 1** | Foundation, App Shell & Design System | **COMPLETED** | Next.js 15 App Router, Swiss Modernism 2.0 design tokens, responsive app shell, navigation. |
| **Phase 2** | Server-Side OpenAI Integration & Topic Research | **COMPLETED** | OpenAI Responses API integration, topic-based research workflow, 8-section reports, domain error handling. |
| **Phase 3** | PDF Upload & Reliable Text Extraction | **COMPLETED** | Server-side PDF validation, `unpdf` page boundary mapping, scanned document detection, ephemeral document store. |
| **Phase 4** | PDF Analysis & Evidence-Grounded Reports | **COMPLETED** | Context-budgeted document analysis, 12 academic report sections, clickable page citations, prompt injection defense. |
| **Phase 5** | Document Chat + Scholarly Paper Import + Research Library Foundation | **NEXT** | Grounded Q&A, URL/arXiv/DOI paper import, SSRF defense suite, in-memory Research Library, and event bus foundation. |
| **Phase 6** | Persistence, Projects & Research History | Planned | Supabase / PostgreSQL database integration, user research workspaces, persistent paper library, project tagging. |
| **Phase 7** | Multi-Document Synthesis & Literature Reviews | Planned | Cross-paper comparative analysis, matrix generation, citation graph synthesis, and literature review builder. |
| **Phase 8** | Web Research & Live Academic Source Discovery | Planned | Controlled academic search integration, live paper discovery, preprint tracking, and verified external citations. |
| **Phase 9** | Export, Polish & Production Readiness | Planned | Publication-ready PDF/Markdown/BibTeX export, responsive refinement, performance auditing, WCAG AA accessibility. |
| **Phase 10** | Extensible Research Automation System | Planned | Event-driven research monitors, automated arXiv digest generation, periodic literature updates, and customizable research workflows. |

---

## 13. Important Development Conventions

1. **Package Management:** Always use `pnpm` (`pnpm add`, `pnpm test`, `pnpm build`). Never use `npm` or `yarn`.
2. **Strict TypeScript:** No `any`. Explicitly type all API inputs, outputs, component props, and domain models.
3. **Server / Client Isolation:**
   - Any file importing Node.js standard libraries (`fs`, `crypto`, `path`, `net`, `dns`) must be server-only.
   - Interactive components using hooks (`useState`, `useEffect`) must have `"use client"` at the top.
   - Server keys (`OPENAI_API_KEY`) must never be imported in client components.
4. **Error Handling:** Use custom domain error classes inheriting from `Error`. Map all domain errors to standard HTTP status codes and structured JSON response envelopes.
5. **Testing Verification:** After any meaningful changes, run `pnpm test`, `pnpm type-check`, and `pnpm lint` to ensure zero regressions.

---

## 14. 20 Rules for Future AI Coding Agents

Every AI coding agent operating on this codebase must strictly observe these 20 fundamental engineering rules:

1. **Server-Side AI Confidentiality:** Never expose `OPENAI_API_KEY` to client components, browser bundles, network responses, or console logs. Keep AI inference strictly server-side.
2. **Grounded Evidence & Zero Hallucination:** Clearly distinguish verified document evidence from AI interpretation. Never fabricate citations, quotes, DOIs, URLs, or page numbers.
3. **Untrusted Data Boundary:** Treat all user inputs, uploaded PDFs, remote URLs, and external paper metadata as untrusted. Enclose them in structural XML envelopes and instruct the model to ignore any embedded directives.
4. **SSRF Defense Architecture:** Never fetch arbitrary remote URLs without strict protocol restriction (HTTPS only), pre-request DNS resolution checks, private/loopback IP blocklists, and redirect bounds.
5. **Ephemeral-First Storage:** Maintain in-memory abstractions (`DocumentStore`, `ConversationStore`) until Phase 6 introduces persistence. Do not prematurely add database dependencies.
6. **Vector DB Postponement:** Do not introduce external vector databases (Pinecone, pgvector) or paid search APIs until explicitly scheduled in Phase 7/8. Rely on deterministic, lightweight retrieval.
7. **Modular AI Provider:** Keep the `AIProvider` interface intact. Support OpenAI Responses API as default. Do not tightly couple business logic to a single model or provider.
8. **Deterministic Document Processing:** Maintain page-level boundary tracking, character budgets, and deterministic retrieval before relying on LLM context windows.
9. **Comprehensive Testing:** Write unit, integration, and security tests for every new feature. Maintain 100% passing tests across all test suites before completing any phase.
10. **Strict Schema Validation:** Validate all request inputs and AI model outputs with Zod schemas. Fail fast on malformed data with descriptive errors.
11. **Error Code Standardization:** Map all domain errors to standard HTTP status codes and domain error codes. Never return raw stack traces or unhandled exceptions to the client.
12. **Progressive UI/UX:** Follow Swiss Modernism design principles. Provide clear progress states, error boundaries, empty states, and accessible keyboard interactions.
13. **Citation Interactivity:** Ensure every page citation is clickable and navigates directly to the corresponding extracted document page with visual highlighting.
14. **Honest Abstention:** When evidence is insufficient or missing from the document, explicitly state that rather than generating plausible speculation.
15. **Scanned PDF Transparency:** When a PDF requires OCR, inform the user clearly with actionable error codes (`OCR_REQUIRED`). Do not silently produce empty analysis.
16. **Bounded Context Management:** Keep conversation history and context windows strictly bounded to prevent memory leaks and token budget explosions.
17. **Event Architecture Preparedness:** Design modules with event hooks to prepare for future research automations without adding premature complexity.
18. **Documentation Synchronization:** Update all documentation files (`ARCHITECTURE.md`, `API_SPECIFICATION.md`, `DECISIONS.md`, `DEVELOPMENT_PROGRESS.md`, `TESTING.md`, `PROJECT_CONTEXT.md`) after every completed phase.
19. **Git Hygiene:** Commit frequently with conventional commit messages. Never leave working trees in a broken state.
20. **No Assumptions:** Read actual workspace files, verify actual configurations, and never guess when requirements can be confirmed from the codebase or documentation.
