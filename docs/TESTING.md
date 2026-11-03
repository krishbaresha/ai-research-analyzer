# AI Research Analyzer — Testing Strategy & Quality Assurance

> **Status:** Active  
> **Last Test Run:** 2026-11-03 (Phase 3: PDF Upload & Text Extraction)  
> **Active AI Provider:** OpenAI (`gpt-4o-mini`) via `client.responses.create()`  
> **Active PDF Engine:** `unpdf` (`^2.1.0`) with page boundary mapping and zero external LLM calls

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

## 3. Test Suites & Verification Results (Phase 3)

| Test Suite | File | Tests | Result | Purpose |
|---|---|---|---|---|
| **PDF Validator** | `tests/unit/pdf-validator.test.ts` | 7 | **PASSED** | Validates valid buffers, 0-byte rejection, `%PDF-` signature checks, non-PDF MIME rejection, 10MB limit enforcement, filename traversal sanitization, and safe ID generation. |
| **PDF Extractor** | `tests/unit/pdf-extractor.test.ts` | 6 | **PASSED** | Verifies page-by-page extraction, multi-page boundary mapping, scanned/image-only PDF detection, corrupted PDF rejection, non-PDF rejection, and empty buffer handling. |
| **Document Upload Integration** | `tests/integration/document-upload.test.ts` | 5 | **PASSED** | Verifies `POST /api/documents/upload` multipart parsing, in-memory storage, `GET /api/documents/[id]` retrieval, scanned OCR flagging, 415 fake file rejection, and 400 empty body handling. |
| **Secret Isolation & AI Boundaries** | `tests/security/secret-isolation.test.ts` | 3 | **PASSED** | Verifies `OPENAI_API_KEY` isolation, zero client-side server imports, and guarantees that Phase 3 PDF extraction makes zero calls to OpenAI or external LLMs. |
| **JSON Sanitizer & Report Parser** | `tests/unit/parsers.test.ts` | 7 | **PASSED** | Verifies stripping of markdown code fences, validation against `researchReportSchema`, and rejection of malformed JSON. |
| **Prompts & Anti-Injection** | `tests/unit/prompts.test.ts` | 4 | **PASSED** | Verifies structural isolation delimiters (`<user_topic>`, `<scope_constraints>`) and defensive system instructions forbidding prompt overrides. |
| **OpenAI Provider Integration (Mocked)** | `tests/integration/openai-provider.test.ts` | 6 | **PASSED** | Verifies `client.responses.create()` calls, `AIAuthError` on missing key, 401 handling, 429 quota/rate limit error mapping, and malformed output rejection. |

**Total:** 7 test files, 38 automated tests, 100% passing.

---

## 4. Phase Verification Summary

| Check | Tool / Command | Result | Details |
|---|---|---|---|
| **Unit & Integration Tests** | `vitest run` | **38 / 38 PASSED** | All PDF, prompt, provider, and security tests pass. |
| **TypeScript Strictness** | `pnpm type-check` | **PASSED (0 errors)** | Zero type errors with strict mode enabled. |
| **Next.js Linter** | `pnpm lint` | **PASSED (0 warnings)** | Clean lint run. |
| **Production Build** | `pnpm build` | **PASSED** | All static and server-rendered routes compile cleanly. |
| **Client Secret Isolation** | Automated scan | **VERIFIED** | No keys or server services accessible to browser bundles. |
| **Zero LLM Transmission** | Automated scan | **VERIFIED** | PDF extraction modules do not import or invoke OpenAI. |

---

## 5. Manual Smoke-Test Procedure for PDF Upload

Follow these steps on your local machine to verify the Phase 3 PDF extraction interface:

### Step 1: Start Development Server
```bash
pnpm dev
```
Open `http://localhost:3000` in your browser.

### Step 2: Navigate to Document Analysis
1. In the sidebar or on the dashboard hero, click **Upload Research PDF** (or go to `http://localhost:3000/new?mode=document`).
2. Verify the **PDF Document Analysis** tab is selected.
3. Observe the dropzone with 10 MB limit and page-boundary guarantees.

### Step 3: Test Uploading a Valid PDF
1. Drag and drop any academic research PDF (or click "Select PDF File").
2. Notice the selected file badge showing the filename and formatted size.
3. Click **Extract Text**.
4. Observe the live multi-step extraction feedback:
   - *"Validating file signature & headers..."*
   - *"Parsing page boundaries & text streams..."*
   - *"Indexing extracted passages into memory store..."*
5. Observe the rendered `DocumentViewer`:
   - Document overview card with total pages, word count, character count, and file size.
   - Page selector buttons (Page 1, Page 2, Page 3...).
   - Clean extracted text stream with exact page headings.
   - "Copy Full Text" and "Copy Page" buttons.

### Step 4: Test Scanned / Image-Only PDF Detection
1. Click **Upload Another** or drop a scanned/photographed PDF with no digital text layer.
2. Click **Extract Text**.
3. Verify that the warning alert appears:
   > *"Scanned or Image-Only Document Detected: This document contains negligible extractable digital text... Optical Character Recognition (OCR) is required to extract text from such files, which is not included in the MVP."*

### Step 5: Test Invalid File Handling
1. Attempt to upload a `.png`, `.txt`, or `.exe` file renamed to `.pdf`.
2. Observe the immediate validation rejection:
   > *"Invalid PDF Signature: File does not contain a valid PDF signature (%PDF-)."*
