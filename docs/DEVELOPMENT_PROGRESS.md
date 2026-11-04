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
| **Phase 5** | Document Chat + Scholarly Paper Import + Research Library Foundation | **COMPLETED** | 2026-11-03 |
| **Phase 5.5** | Research Explorer Experience & Academic Intelligence | **COMPLETED** | 2026-11-05 |
| **Phase 6** | Research Explorer Core & Epistemic Deep Dive | Planned (Next) | — |
| **Phase 7** | Visual Intelligence & Reconstructed Scientific Artifacts | Planned | — |
| **Phase 8** | Persistent Research Workspace (PostgreSQL/Supabase) | Planned | — |
| **Phase 9** | Multi-Paper Literature Intelligence & Synthesis Matrix | Planned | — |
| **Phase 10** | Scholarly Discovery & Open Access Ingestion | Planned | — |
| **Phase 11** | Background Automation Engine & Alerting | Planned | — |
| **Phase 12** | Production Hardening, Multi-Format Exports & Scale | Planned | — |

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

## Phase 5: Document Chat + Scholarly Paper Import + Research Library Foundation (Completed)

### 1. Requirements Delivered
- **Part A — Grounded Document Chat & BM25 Passage Retrieval:**
  - Designed and implemented a lightweight, deterministic server-side passage retrieval engine operating across ALL extracted pages (1 to N) stored in `DocumentStore` without Phase 4 sampling restrictions (`src/lib/retrieval/retriever.ts`).
  - Chunks document pages into overlapping segments (~900 chars, 150-char overlap) strictly preserving 1-indexed original page numbers.
  - Implemented BM25/TF-IDF term weighting across chunks, with explicit page number detection (e.g. boosting page 4 when the user specifies "on page 4").
  - Bounded passage selection (top 5 chunks up to 10,000 characters).
  - Explicit abstention: if no passages meet the relevance threshold, returns an empty set so the model abstains rather than hallucinates.
  - Bounded in-memory conversation storage (`src/lib/storage/conversation-store.ts`) with 20-message FIFO eviction.
  - Grounded Chat Prompts & Schema Contracts (`chatAssistantResponseSchema`) with 4 evidence statuses: `supported`, `partially_supported`, `not_found`, and `interpretation`.
  - Claim-level attribution: models return individual claims with specific `pageReferences: number[]` and `evidenceStatus`.
  - Clickable page citation pills (`p. 2`, `p. 5`) with smooth navigation and visual highlighting in the Document Workspace.
  - REST routes: `POST /api/documents/[id]/chat` and `DELETE /api/documents/[id]/chat`.
- **Part B — Multi-Source Scholarly Paper Import & SSRF Defense:**
  - Added new source-import interface supporting 4 ingestion modes: Local PDF upload, Public PDF URL, arXiv paper URL/ID, and academic DOI.
  - Built modular metadata provider adapters (`src/lib/import/providers/`): Crossref, OpenAlex, arXiv, and Semantic Scholar.
  - Automatic Open Access PDF discovery: retrieves public open-access PDF links via OpenAlex and arXiv.
  - Honest paywall handling: when full text is unavailable, displays complete scholarly metadata, official publisher link, clear paywall explanation, and offers manual PDF upload fallback.
  - SSRF Defense Architecture (`src/lib/security/ssrf.ts`):
    - HTTPS-only enforcement.
    - Pre-request DNS resolution checks blocking private, loopback, link-local, multicast, and cloud metadata IP ranges (`127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`, `::1`, `fc00::/7`).
    - Bound redirection (max 3 hops) with SSRF revalidation on every hop.
    - Streaming byte counter capping downloads at 15 MB.
    - Strict 15-second request timeouts.
    - Content-Type verification and `%PDF-` magic bytes header validation.
    - Rejection of HTML error pages pretending to be PDFs (`HTML_NOT_PDF`).
    - Zero forwarding of client credentials or cookies.
- **Part C — Smart Document Processing Pipeline:**
  - Implemented unified coordinated processing workflow (`src/lib/pipeline/document-processor.ts`):
    `Import -> Validate Signature & Size -> Extract Pages (unpdf) -> Attach Scholarly Metadata -> Classify Document -> Compute SHA-256 Content Hash -> Ephemeral Store -> Emit Domain Events`.
  - Rule-based document type classification (`classifyDocument`): classifies papers as `preprint`, `review_article`, `thesis`, `conference_paper`, `technical_report`, or `research_paper`.
  - Preserved Phase 3 and Phase 4 functionality without duplicating extraction logic.
- **Part D — Research Library Foundation:**
  - Implemented `/documents` Research Library workspace.
  - Listing, searching by title/author/DOI (`documentStore.search`), opening in workspace, and deleting papers.
  - Clear banner explaining in-memory storage is temporary and will be replaced by persistent storage in Phase 6.
  - REST route: `GET /api/documents` and `DELETE /api/documents/[id]`.
- **Part E — Future Automation Event Bus:**
  - Implemented lightweight, synchronous in-memory event bus (`src/lib/events/event-bus.ts`).
  - Defined 7 domain event types: `document.uploaded`, `document.imported`, `document.extracted`, `document.classified`, `document.analysis.completed`, `document.analysis.failed`, `document.chat.created`.
  - Preserves sliding in-memory history window (100 events) for automation triggers and verification.

### 2. Quality Assurance & Test Verification
- **Automated Vitest Suite (130 tests passing across 23 files):**
  - `tests/security/ssrf-defense.test.ts` (12 tests): Loopback IPv4/IPv6, private ranges, link-local, cloud metadata, non-HTTPS protocols, embedded credentials, internal hostnames, redirect to private IP, HTML response rejection, magic bytes signature rejection, and valid PDF fetch.
  - `tests/unit/source-resolver.test.ts` (12 tests): arXiv abstract/PDF URL normalization, raw arXiv IDs, legacy IDs, DOI extraction from URLs and text, punctuation stripping, open-access resolution, and paywalled notice.
  - `tests/integration/paper-import.test.ts` (4 tests): Empty source 422, SSRF attempt 400, paywalled DOI 200 metadata-only response, open-access arXiv end-to-end import into Research Library.
  - `tests/integration/library.test.ts` (3 tests): List all papers, search by keyword (?q=mamba), and delete paper by ID.
  - `tests/unit/event-bus.test.ts` (3 tests): Subscription, unsubscription, sliding history window.
  - `tests/unit/document-classifier.test.ts` (4 tests): Preprint, review article, conference paper, research paper classification.
  - Retained all prior suites: document chat (6 tests), retriever (7 tests), conversation store (6 tests), chat parsers (5 tests), chat security (3 tests), phase 4 QA audit (9 tests), document analysis (7 tests), document budgeter (4 tests), document prompts (3 tests), document parsers (4 tests), pdf validator (7 tests), pdf extractor (6 tests), document upload (5 tests), secret isolation (3 tests), parsers (7 tests), prompts (4 tests), openai provider (6 tests).
- **Verification Commands:**
  - `pnpm lint`: Zero warnings, zero errors (`No ESLint warnings or errors`).
  - `pnpm type-check`: Strict mode passed with zero errors (`tsc --noEmit`).
  - `pnpm test`: 130 / 130 tests passed across 23 test files.
  - `pnpm build`: Next.js production build succeeded with all 13 routes compiled.

### 3. Next Phase Readiness
- Ready for **Phase 6: Persistence, Projects, and History**.
- Scope boundary enforced: Phase 6 has NOT been started. Zero external database infrastructure or vector databases introduced. Storage remains strictly in-memory per ADR-004.
