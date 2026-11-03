# AI Research Analyzer — Development Progress & Phase Tracker

> **Document Status:** Active  
> **Rule:** Must be updated after every completed phase.

---

## Overall Phase Roadmap

| Phase | Description | Status | Completion Date |
|---|---|---|---|
| **Phase 1** | Foundation, App Shell, and Design System | **COMPLETED** | 2026-11-03 |
| **Phase 2** | Server-Side OpenAI Integration (Responses API) & Topic-Based Analysis | **COMPLETED** | 2026-11-03 |
| **Phase 3** | PDF Upload and Reliable Text Extraction | **COMPLETED** | 2026-11-03 |
| **Phase 4** | PDF Analysis and Evidence-Grounded Reports | **COMPLETED** | 2026-11-03 |
| **Phase 5** | Document Chat + Scholarly Paper Import + Research Library Foundation | **NEXT / IN PROGRESS** (Expanded Scope Pending) | — |
| **Phase 6** | Persistence, Projects, and History | Planned | — |
| **Phase 7** | Multi-Document Synthesis and Literature Reviews | Planned | — |
| **Phase 8** | Web Research and Live Academic Source Discovery | Planned | — |
| **Phase 9** | Export, Polish, and Production Readiness | Planned | — |
| **Phase 10** | Extensible Research Automation System | Planned | — |

---

## Phase 3: PDF Upload and Reliable Text Extraction (Completed)

### 1. Requirements Delivered
- **Runtime-Compatible PDF Parsing Engine:**
  - Integrated `unpdf` (`^2.1.0`), a modern, pure TypeScript/JavaScript pdf.js wrapper with zero native C++ compilation dependencies.
  - Resolved `Uint8Array` / `Buffer` prototype constraints for seamless Node.js runtime execution.
- **Strict Server-Side File Validation:**
  - Enforced file size limits against `MAX_UPLOAD_SIZE_BYTES` (default 10 MB).
  - Validated PDF magic bytes signature (`%PDF-`) within the first 1024 bytes.
  - Sanitized filenames via `path.posix.basename`, stripping directory traversal (`..`), path slashes, null bytes, and control characters.
  - Generated safe, collision-resistant document IDs (`doc_${timestamp}_${random}`).
- **Page-by-Page Boundary Preservation:**
  - Extracted text streams page-by-page while strictly preserving 1-indexed page numbers.
  - Computed individual character counts and word counts per page and across the entire document.
  - Formatted combined `fullText` with structural delimiter tags (`--- Page N ---`).
- **Scanned / Image-Only PDF Detection:**
  - Evaluated character count and average words per page against academic thresholds (< 50 characters or < 5 words/page).
  - Automatically flags `isScanned: true` and `ocrRequired: true`.
  - Displays transparent disclaimer banners informing users that OCR is required but unsupported in MVP.
- **Handling of Edge Cases:**
  - Corrupted PDFs: caught and mapped to `PDFCorruptedError` (`CORRUPTED_PDF`, 422).
  - Encrypted / password-protected PDFs: mapped to `PDFEncryptedError` (`ENCRYPTED_PDF`, 422).
  - Empty files (0 bytes) & non-PDFs: rejected with clean status codes (400, 415).
- **Ephemeral Storage Abstraction:**
  - Created `src/lib/storage/document-store.ts` implementing `DocumentStore` in-memory repository pattern adhering to ADR-004.
  - Stored parsed documents with metadata and page arrays for instant retrieval.
- **API Routes:**
  - `POST /api/documents/upload`: Handles `multipart/form-data`, validates files, extracts text streams, saves to memory store, and returns status 201.
  - `GET /api/documents/[id]`: Retrieves document metadata and page text.
- **Frontend Upload & Extraction Interface:**
  - Connected the PDF tab in `src/app/new/page.tsx` with drag-and-drop zone and native file picker.
  - Added multi-step progress feedback ("Validating document headers...", "Parsing page boundaries...", "Indexing extracted passages...").
  - Implemented `DocumentViewer` component in `src/features/pdf-analysis/components/document-viewer.tsx` with page selector, word counts, copy full text, copy page, and scanned alert.
  - Updated `/documents/[id]` workspace page to load and render real extracted document pages from the store.
- **Security & Phase Isolation Guarantee:**
  - Strictly verified that zero PDF content is sent to OpenAI or external LLMs in Phase 3.
  - Automated security tests verify that `src/lib/pdf/*` and `src/app/api/documents/upload` make zero imports or calls to `openai` or `getAIProvider`.

### 2. Quality Assurance & Test Verification
- **Automated Vitest Suites (38 tests passing across 7 files):**
  - `tests/unit/pdf-validator.test.ts` (7 tests): Valid buffer, empty buffer, invalid magic bytes, invalid MIME, oversized file, filename sanitization, safe document ID generation.
  - `tests/unit/pdf-extractor.test.ts` (6 tests): Valid single-page, multi-page page boundary mapping, scanned detection, corrupted rejection, signature rejection, empty rejection.
  - `tests/integration/document-upload.test.ts` (5 tests): Full upload lifecycle, scanned upload, fake PDF rejection, missing file rejection, 404 retrieval.
  - `tests/security/secret-isolation.test.ts` (3 tests): Secret isolation, client import boundaries, and Phase 3 zero-AI call verification.
  - `tests/unit/parsers.test.ts` (7 tests): Report parser and markdown fence sanitization.
  - `tests/unit/prompts.test.ts` (4 tests): Prompt delimiters and anti-injection instructions.
  - `tests/integration/openai-provider.test.ts` (6 tests): Mocked OpenAI Responses API integration.
- `pnpm lint`: Zero warnings, zero errors.
- `pnpm type-check`: Strict mode passed with zero errors.
- `pnpm build`: Next.js production build succeeded with all 9 routes optimized.

### 3. Next Phase Readiness
- Ready for **Phase 4: PDF Analysis and Evidence-Grounded Reports**.

---

## Phase 4: PDF Analysis and Evidence-Grounded Research Reports (Completed)

### 1. Requirements Delivered
- **Document Store Integration:**
  - Connected the analytical engine directly to the ephemeral `DocumentStore` abstraction (`documentStore.get(documentId)`).
  - Validates document presence, throwing standard `404 NOT_FOUND` for expired or missing documents.
  - Inspects document extraction metrics and blocks unreadable scanned/image-only PDFs (`422 UNPROCESSABLE_ENTITY`, code `OCR_REQUIRED`).
- **Context-Aware Long Document Budgeter (`src/lib/pdf/budgeter.ts`):**
  - Designed and implemented a context-budgeting algorithm with a conservative ceiling of 60,000 characters (~15,000 tokens) to guarantee prompt reliability and prevent "lost-in-the-middle" attention degradation.
  - Preserves exact 1-indexed page boundaries across all sampled passages.
  - Automatically computes and transparently reports coverage metrics: `totalPages`, `analyzedPagesCount`, `analyzedPages`, `coveragePercentage`, and `isPartialCoverage`.
  - For short/medium papers (< 60,000 chars), processes 100% of pages.
  - For long documents exceeding budget, employs weighted strategic sampling: opening sections/abstract (40%), conclusion/discussion (35%), and evenly sampled methodology/results pages (25%).
- **Prompt Injection Defense & Structural Boundary Envelopes (`src/lib/ai/prompts.ts`):**
  - Treats all PDF content as untrusted input data.
  - Sanitizes angle brackets (`<`, `>`) in passage streams to prevent prompt template escape attacks.
  - Wraps each extracted page in defensive `<document_passage page="N">` XML envelopes.
  - Strict system instructions mandate valid JSON output, prohibit prompt modification, and strictly forbid fabricating citations, DOIs, URLs, or non-existent page numbers.
- **Evidence-Grounded Reporting Contracts & Zod Schemas:**
  - Updated `src/types/research.ts` with `DocumentAnalysisReport`, `DocumentAnalysisOverview`, `ObjectiveItem`, `DetailedSection`, `MethodologyAssessment`, and `ConceptItem`.
  - Defined strict Zod schemas in `src/lib/validation/research.schema.ts` ensuring `pageReferences: z.array(z.number().int().positive())` on all document-backed findings.
  - Distinguishes claims via `evidenceStatus`: `from_document` (grounded with exact page numbers), `ai_interpretation` (analytical synthesis), and `not_established` (unaddressed or missing).
- **Official OpenAI Responses API Integration (`src/lib/ai/openai.provider.ts`):**
  - Implemented `analyzeDocument(options: DocumentAnalysisOptions)` on `AIProvider` and `OpenAIProvider`.
  - Uses official `client.responses.create()` with robust fallback to `client.chat.completions.create()`.
  - Maps external errors cleanly to domain errors (`AIAuthError`, `AIRateLimitError`, `AIQuotaExceededError`, `AITimeoutError`, `AIResponseParseError`).
- **REST API Route (`POST /api/documents/[id]/analyze`):**
  - Accepts optional `focusArea` filter.
  - Returns `200 OK` with full validated `DocumentAnalysisReport` payload.
  - Accurately tracks inference `processingTimeMs` and returns active model identifier in metadata.
- **Frontend Workspace & Interactive Citation Navigation:**
  - Created `DocumentReportViewer` (`src/features/pdf-analysis/components/document-report-viewer.tsx`) with 12 structured report sections: Document Overview, Executive Summary, Research Objectives, Key Findings, Detailed Analysis, Methodology Assessment, Important Concepts, Strengths/Weaknesses, Limitations, Research Gaps, Conclusion, and Suggested Further Research.
  - Clickable page citation pills (`p. 1`, `p. 4`) with smooth navigation: clicking any citation switches to the "Extracted Pages" tab and scrolls directly to the cited page.
  - Analysis initiation UI in `src/features/pdf-analysis/components/document-viewer.tsx` with focus area input and live progress stepper.
  - Partial coverage alert banner when documents exceed context budget, detailing analyzed page ranges.
  - Markdown copy export functionality.

### 2. Quality Assurance & Test Verification
- **Automated Vitest Suite (65 tests passing across 12 files):**
  - `tests/integration/phase4-qa-audit.test.ts` (9 tests): Small PDF 1-indexed numbering, 12 report sections, citation bounds checking, >60k char strategic sampling, scanned PDF 422 OCR_REQUIRED enforcement, and topic regression.
  - `tests/unit/document-budgeter.test.ts` (4 tests): Full coverage for short PDFs, weighted sampling for large documents, empty document error handling, XML character sanitization.
  - `tests/unit/document-prompts.test.ts` (3 tests): XML passage envelope formatting, prompt injection defense, focus area inclusion.
  - `tests/unit/document-parsers.test.ts` (4 tests): Clean JSON parsing, markdown code block stripping, Zod schema validation, missing field rejection.
  - `tests/integration/document-analysis.test.ts` (7 tests): Complete end-to-end analysis lifecycle, page citation verification, partial coverage handling, scanned PDF rejection, missing document 404, invalid body handling, OpenAI error mapping.
  - Prior suites retained and verified: `pdf-validator` (7 tests), `pdf-extractor` (6 tests), `document-upload` (5 tests), `secret-isolation` (3 tests), `parsers` (7 tests), `prompts` (4 tests), `openai-provider` (6 tests).
- **Live OpenAI API Verification:**
  - Performed real live analysis using configured `OPENAI_API_KEY` and `gpt-4o-mini`.
  - Verified 100% accurate page citations matching document source passages.
  - Verified adversarial prompt injection resistance: malicious overrides embedded within PDF passages are neutralized.
  - Hardened schema resilience: added `stringArrayCoerce` and `pageReferencesCoerce` in `research.schema.ts` to seamlessly handle string-vs-array LLM output variations.
  - Hardened `budgeter.ts`: added safe fallback for missing/undefined `charCount` attributes (`p.charCount ?? p.text?.length ?? 0`).
  - Standardized scanned PDF error code to `OCR_REQUIRED` (HTTP 422).
- **Verification Commands:**
  - `pnpm lint`: Zero warnings, zero errors.
  - `pnpm type-check`: Strict mode passed with zero errors (`tsc --noEmit`).
  - `pnpm test`: 65 / 65 tests passed across 12 test files.
  - `pnpm build`: Next.js production build succeeded with all 10 routes compiled.

### 3. Next Phase Readiness
- Ready for **Phase 5: Document Chat (Grounded Q&A)**.
- Scope boundary enforced: Phase 5 has NOT been started. Zero chat persistence or embedding models introduced.

---

## Phase 5: Document Chat + Scholarly Paper Import + Research Library Foundation (Next / Prototype In Progress)

> **Clarification:** An initial in-memory document chat prototype featuring deterministic BM25 retrieval and claim citations was developed in commit `267df7c` with 92 passing tests. However, the user has formally expanded the scope of Phase 5 to encompass **Scholarly Paper Import (URL, arXiv, DOI)**, **SSRF Defense**, **Research Library Foundation**, and **Event Architecture Foundation**. Implementation of these expanded capabilities has **NOT** been started.

### 1. Requirements Delivered in Chat Prototype (Commit `267df7c`)
- **Full-Document Scope & Deterministic BM25 Passage Retrieval (`src/lib/retrieval/retriever.ts`):**
  - Designed and implemented a lightweight, deterministic server-side passage retrieval engine operating across ALL extracted pages (1 to N) stored in `DocumentStore` without Phase 4 sampling restrictions.
  - Chunks document pages into overlapping segments (~900 chars, 150-char overlap) strictly preserving 1-indexed original page numbers.
  - Tokenizes queries into normalized keywords with academic stop-word filtering.
  - Implements BM25/TF-IDF term weighting across chunks, with explicit page number detection (e.g. boosting page 4 when the user specifies "on page 4").
  - Bounded passage selection (top 5 chunks up to 10,000 characters).
  - Explicit abstention: if no passages meet the relevance threshold, returns an empty set so the model abstains rather than hallucinates.
  - Zero external vector databases, zero embedding APIs, zero new infrastructure.
- **Bounded In-Memory Conversation Storage (`src/lib/storage/conversation-store.ts`):**
  - Ephemeral session storage associating conversations strictly with their target `documentId`.
  - Enforces bounded history (maximum 20 messages per session) with FIFO/LRU eviction across 50 active sessions to prevent unbounded memory growth.
  - Validates document-to-conversation association, rejecting cross-document session tampering with HTTP 400.
  - Clear and delete session lifecycle operations.
- **Grounded Chat Prompts & Schema Contracts (`src/lib/ai/prompts.ts`, `src/lib/validation/chat.schema.ts`, `src/lib/ai/parsers.ts`):**
  - Defined `DOCUMENT_CHAT_SYSTEM_INSTRUCTION` and `buildDocumentChatPrompt` wrapping passages in `<retrieved_passage page="N">` tags with XML delimiter sanitization.
  - Defined strict Zod schemas for `chatAssistantResponseSchema`, requiring 4 evidence statuses: `supported`, `partially_supported`, `not_found`, and `interpretation`.
  - Claim-level attribution: models return individual claims with specific `pageReferences: number[]` and `evidenceStatus`.
  - Source tracking: models provide `sources: [{ pageNumber, relevanceReason, excerpt }]`.
  - Untrusted data boundary and anti-override instructions strictly enforced.
- **Official OpenAI Responses API Integration (`src/lib/ai/openai.provider.ts`):**
  - Added `chatDocument(options: DocumentChatOptions)` to `AIProvider` and `OpenAIProvider`.
  - Invokes `client.responses.create()` with robust fallback to `client.chat.completions.create()`.
  - Passes recent conversation history (up to 6 messages) for dialogue continuity.
- **REST API Routes (`POST /api/documents/[id]/chat` & `DELETE /api/documents/[id]/chat`):**
  - Validates document presence (`404 NOT_FOUND` for missing).
  - Blocks scanned/image-only PDFs (`422 UNPROCESSABLE_ENTITY`, code `OCR_REQUIRED`).
  - Supports conversation continuation and new session generation.
  - Returns standardized response with assistant message, claim citations, sources, and retrieval transparency metadata (`pagesSearched`, `pagesUsed`, `partialCoverage`).
- **Interactive Workspace UI (`src/features/document-chat/components/document-chat.tsx`):**
  - Clean academic research assistant layout with user and assistant message styling.
  - Evidence status badges: `Supported by Document`, `Partially Supported`, `Not in Document (Abstained)`, and `Analytical Interpretation`.
  - Clickable page citation pills (`p. 2`, `p. 5`) with smooth navigation: clicking any citation switches to the "Extracted Pages" tab, scrolls smoothly to that page card, and visually highlights it.
  - Sources accordion detailing why each page supports the answer.
  - Retrieval transparency pill: `"Searched X pages • Evidence cited from: p. Y, Z"`.
  - Empty state with 5 one-click example research questions.
  - Clear chat action and error recovery state.
  - Seamlessly integrated as a primary tab in `DocumentViewer` (`src/features/pdf-analysis/components/document-viewer.tsx`).

### 2. Quality Assurance & Test Verification
- **Automated Vitest Suite (92 tests passing across 17 files):**
  - `tests/unit/retriever.test.ts` (7 tests): Keyword normalization, explicit page number detection, overlapping chunking, multi-page retrieval (early/mid/late pages), page query boost, abstention on irrelevant queries, empty document handling.
  - `tests/unit/conversation-store.test.ts` (6 tests): Session creation, retrieval, chronological message storage, 20-message bounded history eviction, clear session, delete session.
  - `tests/unit/chat-parsers.test.ts` (5 tests): JSON parsing, code fence stripping, single-number-to-array coercion, invalid JSON error handling, missing required fields.
  - `tests/integration/document-chat.test.ts` (6 tests): End-to-end chat endpoint, new session creation, continuation with `conversationId`, 404 for missing document, 400 for document mismatch, 422 for scanned PDF, DELETE conversation clearing.
  - `tests/security/chat-security.test.ts` (3 tests): Rogue XML delimiter sanitization, prompt injection anti-override directives, secret isolation audit.
  - All prior test suites retained and passing: 65 tests across Phase 1–4 suites.
- **Live OpenAI API Verification:**
  - Tested supported question against real academic paper: accurately retrieved Page 2, quoted 3.2x/4.1x speedup, attached `pageReferences: [2]`, and returned `supported`.
  - Tested unsupported question (CRISPR): retrieved 0 passages, returned `evidenceStatus: "not_found"`, honestly stated the document does not mention the topic, zero hallucinated citations.
  - Tested follow-up question preserving conversation context.
- **Verification Commands:**
  - `pnpm lint`: Zero warnings, zero errors (`No ESLint warnings or errors`).
  - `pnpm type-check`: Strict mode passed with zero errors (`tsc --noEmit`).
  - `pnpm test`: 92 / 92 tests passed across 17 test files.
  - `pnpm build`: Next.js production build succeeded with all 11 routes compiled.

### 3. Expanded Phase 5 Scope Requirements (Pending Implementation)
1. **Public PDF URL Ingestion:** Stream remote HTTPS PDFs into the extraction pipeline with size bounds (15MB) and timeout limits (15s).
2. **arXiv Paper Import:** Ingest arXiv papers by ID or URL, retrieving metadata via arXiv API and downloading official preprints.
3. **DOI Paper Import:** Ingest papers by DOI, retrieving metadata via Crossref / OpenAlex / Semantic Scholar, and resolving open-access PDFs via Unpaywall.
4. **SSRF Defense Suite:** Implement strict IP resolution validation, blocking loopback, link-local, and cloud metadata ranges before HTTP dispatch.
5. **In-Memory Research Library Foundation:** Catalog papers with metadata and provide a dashboard library view.
6. **Event Architecture Hook:** Synchronous in-memory event bus emitting domain lifecycle events.

### 4. Phase Boundary Enforced
- Phase 5 expanded implementation has **NOT** been started in this turn.
- Zero source code changes made in `src/`.
- Zero database libraries (PostgreSQL, Supabase) or external vector DBs introduced. Storage remains strictly in-memory per ADR-004.
