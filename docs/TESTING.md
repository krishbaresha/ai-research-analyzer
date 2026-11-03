# AI Research Analyzer — Testing Strategy & Quality Assurance

> **Status:** Active  
> **Last Test Run:** 2026-11-03 (Phase 5: Document Chat & Grounded Q&A)  
> **Active AI Provider:** OpenAI (`gpt-4o-mini`) via `client.responses.create()`  
> **Active PDF Engine:** `unpdf` (`^2.1.0`) with page boundary mapping and deterministic BM25 passage retrieval

---

## 1. Testing Philosophy & Pyramid

Our testing strategy ensures groundedness, security, and interface stability across all phases without premature complexity:

```
         ▲
        / \     E2E / Browser Tests (Playwright)
       /   \    - Critical user journeys: New Topic -> Report, PDF Upload -> Extraction
      /-----\
     /       \   Integration Tests (Vitest)
    /         \  - Multipart file upload route, in-memory store, OpenAI Responses API
   /-----------\
  /             \ Unit Tests (Vitest)
 /               \ - PDF validator, unpdf extractor, scanned detector, prompts, parsers
-------------------
```

---

## 2. Test Execution Commands

```bash
# Run all unit, integration, and security tests
pnpm test

# Run tests in watch mode during development
pnpm exec vitest

# Run TypeScript strict type-check
pnpm type-check

# Run Next.js linter
pnpm lint

# Run production build
pnpm build
```

---

## 3. Test Suites & Verification Results (Phase 5)

| Test Suite | File | Tests | Result | Purpose |
|---|---|---|---|---|
| **SSRF Defense Suite** | `tests/security/ssrf-defense.test.ts` | 12 | **PASSED** | Verifies loopback, link-local, private, cloud metadata IP blocking, HTTPS protocol enforcement, redirect loop & private redirect bounds, HTML response rejection, signature check, and valid PDF streaming. |
| **Source Resolver & Adapters** | `tests/unit/source-resolver.test.ts` | 12 | **PASSED** | Verifies arXiv URL/ID normalization, legacy arXiv formats, DOI extraction, trailing punctuation handling, OpenAlex/Crossref open-access resolution, and paywall notifications. |
| **Paper Import Integration** | `tests/integration/paper-import.test.ts` | 4 | **PASSED** | Verifies `POST /api/documents/import-source` endpoint: validation failure (422), SSRF rejection (400), paywalled DOI handling (200), and open-access PDF import into Research Library (201). |
| **Research Library Integration** | `tests/integration/library.test.ts` | 3 | **PASSED** | Verifies `GET /api/documents` listing, keyword search filtering (`?q=mamba`), and `DELETE /api/documents/[id]`. |
| **Domain Event Bus** | `tests/unit/event-bus.test.ts` | 3 | **PASSED** | Verifies subscription, unsubscription, and sliding in-memory history window across domain events. |
| **Document Classifier** | `tests/unit/document-classifier.test.ts` | 4 | **PASSED** | Verifies rule-based classification for preprints, review articles, conference papers, and standard research papers. |
| **Document Retriever** | `tests/unit/retriever.test.ts` | 7 | **PASSED** | Verifies BM25/TF-IDF keyword tokenization, page query extraction, overlapping page chunking, multi-page retrieval across all pages, explicit page boosting, abstention on irrelevant queries, and empty document handling. |
| **Conversation Store** | `tests/unit/conversation-store.test.ts` | 6 | **PASSED** | Verifies ephemeral session creation, session lookup, chronological message append, 20-message bounded context FIFO eviction, clear session, and session deletion. |
| **Document Chat Parsers** | `tests/unit/chat-parsers.test.ts` | 5 | **PASSED** | Verifies JSON parsing against `chatAssistantResponseSchema`, markdown code fence stripping, single-number page citation coercion, syntax error handling, and missing field rejection. |
| **Document Chat Integration** | `tests/integration/document-chat.test.ts` | 6 | **PASSED** | Verifies `POST /api/documents/[id]/chat` endpoint, session generation, follow-up continuation, 404 for missing document, 400 for document ID session mismatch, 422 for scanned PDF, and `DELETE` session clearing. |
| **Chat Security & Prompt Injection** | `tests/security/chat-security.test.ts` | 3 | **PASSED** | Verifies rogue XML delimiter sanitization, prompt injection anti-override directives, and checks that chat client components have zero access to server keys. |
| **Phase 4 QA Audit Suite** | `tests/integration/phase4-qa-audit.test.ts` | 9 | **PASSED** | Comprehensive audit testing small PDFs, multi-page boundary sequential preservation, 12-section presence, citation bounds integrity, 60k-char budget sampling, scanned PDF 422 OCR_REQUIRED enforcement, and topic regression. |
| **Document Analysis Integration** | `tests/integration/document-analysis.test.ts` | 7 | **PASSED** | Verifies `POST /api/documents/[id]/analyze`, end-to-end grounded report generation, page citation preservation, partial coverage handling, scanned PDF 422 rejection, 404 missing document handling, and OpenAI error mapping. |
| **Document Budgeter** | `tests/unit/document-budgeter.test.ts` | 4 | **PASSED** | Verifies full coverage for documents under budget, weighted strategic sampling for long documents, empty document error handling, and XML character sanitization. |
| **Document Prompts & Injection Defense** | `tests/unit/document-prompts.test.ts` | 3 | **PASSED** | Verifies defensive `<document_passage page="N">` XML envelopes, anti-override constraints, and focus area inclusion. |
| **Document Parsers & Schema Validation** | `tests/unit/document-parsers.test.ts` | 4 | **PASSED** | Verifies clean JSON parsing, markdown code fence stripping, Zod schema validation, and missing section rejection. |
| **PDF Validator** | `tests/unit/pdf-validator.test.ts` | 7 | **PASSED** | Validates valid buffers, 0-byte rejection, `%PDF-` signature checks, non-PDF MIME rejection, 10MB limit enforcement, filename traversal sanitization, and safe ID generation. |
| **PDF Extractor** | `tests/unit/pdf-extractor.test.ts` | 6 | **PASSED** | Verifies page-by-page extraction, multi-page boundary mapping, scanned/image-only PDF detection, corrupted PDF rejection, non-PDF rejection, and empty buffer handling. |
| **Document Upload Integration** | `tests/integration/document-upload.test.ts` | 5 | **PASSED** | Verifies `POST /api/documents/upload` multipart parsing, in-memory storage, `GET /api/documents/[id]` retrieval, scanned OCR flagging, 415 fake file rejection, and 400 empty body handling. |
| **Secret Isolation & AI Boundaries** | `tests/security/secret-isolation.test.ts` | 3 | **PASSED** | Verifies `OPENAI_API_KEY` isolation, zero client-side server imports, and verifies that client bundles cannot access server keys. |
| **Topic JSON Sanitizer & Parser** | `tests/unit/parsers.test.ts` | 7 | **PASSED** | Verifies stripping of markdown code fences, validation against `researchReportSchema`, and rejection of malformed JSON. |
| **Topic Prompts & Anti-Injection** | `tests/unit/prompts.test.ts` | 4 | **PASSED** | Verifies structural isolation delimiters (`<user_topic>`, `<scope_constraints>`) and defensive system instructions forbidding prompt overrides. |
| **OpenAI Provider Integration (Mocked)** | `tests/integration/openai-provider.test.ts` | 6 | **PASSED** | Verifies `client.responses.create()` calls, `AIAuthError` on missing key, 401 handling, 429 quota/rate limit error mapping, and malformed output rejection. |

**Total:** 23 test files, 130 automated tests, 100% passing.

---

## 4. Phase Verification Summary

| Check | Tool / Command | Result | Details |
|---|---|---|---|
| **Unit & Integration Tests** | `vitest run` | **130 / 130 PASSED** | All document chat, retrieval, budgeting, extraction, prompt, provider, and SSRF security tests pass. |
| **TypeScript Strictness** | `pnpm type-check` | **PASSED (0 errors)** | Zero type errors with strict mode enabled. |
| **Next.js Linter** | `pnpm lint` | **PASSED (0 warnings)** | Clean lint run, zero warnings or errors. |
| **Production Build** | `pnpm build` | **PASSED** | All 11 static and server-rendered routes compile cleanly. |
| **Client Secret Isolation** | Automated scan | **VERIFIED** | No keys or server services accessible to browser bundles. |
| **Live OpenAI Chat Smoke Test**| Live execution | **VERIFIED** | Real API call succeeded via `gpt-4o-mini`, answering supported question with page citations and honestly abstaining on unsupported question. |
| **Prompt Injection Defense** | Adversarial test | **VERIFIED** | Malicious overrides and XML delimiter escapes inside passages neutralized. |
| **Deterministic BM25 Retrieval** | Vitest suite | **VERIFIED** | All extracted pages indexed and searched with zero vector DB infrastructure. |

---

## 5. Manual Smoke-Test Procedure for PDF Upload & Grounded Analysis

Follow these steps on your local machine to verify the Phase 4 PDF analysis interface:

### Step 1: Start Development Server
```bash
pnpm dev
```
Open `http://localhost:3000` in your browser.

### Step 2: Upload an Academic PDF
1. Go to `http://localhost:3000/new?mode=document`.
2. Upload any valid academic research paper (e.g. 5–15 pages).
3. Click **Extract Text**.
4. Observe the extracted text rendered page-by-page.

### Step 3: Run Grounded Document Analysis
1. In the right-hand panel of the Document Viewer, notice the **Generate Grounded Research Report** section.
2. (Optional) Provide a research focus area (e.g., *"Focus on computational methodology and empirical benchmarks"*).
3. Click **Analyze Document with OpenAI**.
4. Observe the live multi-step status feedback:
   - *"Retrieving extracted pages from store..."*
   - *"Applying context budget & formatting XML passages..."*
   - *"Synthesizing evidence-grounded report via OpenAI Responses API..."*
   - *"Validating report schema and page citations..."*

### Step 4: Verify Grounded Citations & Interactive Navigation
1. Inspect the generated 12-section research report:
   - **Document Overview:** Total pages, analyzed pages count, coverage percentage badge (100%).
   - **Research Objectives:** Status badges and page citations.
   - **Key Findings:** Badges showing `From Document` along with clickable page pills like `p. 1`, `p. 4`.
   - **Detailed Analysis & Methodology:** Evidence citations on every technical section.
2. Click any page citation badge (`p. 2`).
3. Notice that the view instantly switches to the **Extracted Pages** tab, scrolls smoothly to Page 2, and visually highlights the page card.
4. Click **Copy Report** to copy the full structured report as formatted academic Markdown.

### Step 5: Test Scanned / Image-Only PDF Safeguard
1. Upload a scanned PDF with no extractable text.
2. Attempt to analyze the document.
3. Observe that the analysis button is disabled with an explanatory disclaimer that OCR is required.

### Step 6: Test Grounded Document Chat & Q&A (Phase 5)
1. In the Document Workspace, click the **Document Chat & Q&A** tab.
2. Notice the empty state with 5 suggested academic research questions and the indexed pages counter.
3. Click an example question (e.g., *"What is the main objective of this research?"*) or type a custom question.
4. Observe the live loading indicator: *"Searching extracted pages & synthesizing grounded answer..."*.
5. Observe the assistant's structured response:
   - Evidence status badge (`Supported by Document` or `Partially Supported`).
   - Claim breakdown with clickable citation pills like `p. 1`, `p. 3`.
   - Retrieved sources accordion showing page numbers and relevance reasons.
   - Retrieval transparency banner: *"Searched X pages • Evidence cited from: p. Y, Z"*.
6. Click any citation chip (e.g. `p. 2`):
   - The view automatically switches to the **Extracted Pages** tab.
   - The viewer smoothly scrolls to Page 2 and visually highlights the page card.
7. Ask an unsupported question (e.g., *"Does this paper discuss CRISPR gene editing?"*):
   - Observe that the assistant honestly abstains with `Not in Document (Abstained)`.
   - Zero hallucinated citations or page numbers.
8. Click **Clear Chat** and verify that the conversation history resets cleanly.
