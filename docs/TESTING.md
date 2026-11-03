# AI Research Analyzer — Testing Strategy & Quality Assurance

> **Status:** Active  
> **Last Test Run:** 2026-11-03 (Phase 4: PDF Analysis & Evidence-Grounded Reports)  
> **Active AI Provider:** OpenAI (`gpt-4o-mini`) via `client.responses.create()`  
> **Active PDF Engine:** `unpdf` (`^2.1.0`) with page boundary mapping and context-aware page budgeting

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

## 3. Test Suites & Verification Results (Phase 4)

| Test Suite | File | Tests | Result | Purpose |
|---|---|---|---|---|
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

**Total:** 11 test files, 56 automated tests, 100% passing.

---

## 4. Phase Verification Summary

| Check | Tool / Command | Result | Details |
|---|---|---|---|
| **Unit & Integration Tests** | `vitest run` | **56 / 56 PASSED** | All document analysis, budgeting, PDF extraction, prompt, provider, and security tests pass. |
| **TypeScript Strictness** | `pnpm type-check` | **PASSED (0 errors)** | Zero type errors with strict mode enabled. |
| **Next.js Linter** | `pnpm lint` | **PASSED (0 warnings)** | Clean lint run, zero warnings or errors. |
| **Production Build** | `pnpm build` | **PASSED** | All 10 static and server-rendered routes compile cleanly. |
| **Client Secret Isolation** | Automated scan | **VERIFIED** | No keys or server services accessible to browser bundles. |
| **Context Window Budgeting** | Vitest suite | **VERIFIED** | Long documents are budgeted within 60,000 chars with exact coverage metrics. |

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
