# AI Research Analyzer — Testing Strategy & Quality Assurance

> **Status:** Active  
> **Last Test Run:** 2026-11-03 (OpenAI Responses API Migration)  
> **Active Provider:** OpenAI (`gpt-4o-mini`) via `client.responses.create()`

---

## 1. Testing Philosophy & Pyramid

Our testing strategy ensures groundedness, security, and interface stability across all phases without premature complexity:

```
         ▲
        / \     E2E / Browser Tests (Playwright)
       /   \    - Critical user journeys: New Topic -> Report, PDF Upload -> Q&A
      /-----\
     /       \   Integration Tests (Vitest)
    /         \  - Server-side OpenAI Responses API, quota/rate limiting, error mapping
   /-----------\
  /             \ Unit Tests (Vitest)
 /               \ - Zod schema validators, prompt security delimiters, parsers
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

## 3. Test Suites & Verification Results

| Test Suite | File | Tests | Result | Purpose |
|---|---|---|---|---|
| **JSON Sanitizer & Report Parser** | `tests/unit/parsers.test.ts` | 7 | **PASSED** | Verifies stripping of markdown code fences, validation against `researchReportSchema`, and rejection of malformed JSON. |
| **Prompts & Anti-Injection** | `tests/unit/prompts.test.ts` | 4 | **PASSED** | Verifies structural isolation delimiters (`<user_topic>`, `<scope_constraints>`) and defensive system instructions forbidding prompt overrides. |
| **OpenAI Provider Integration (Mocked)** | `tests/integration/openai-provider.test.ts` | 6 | **PASSED** | Verifies `client.responses.create()` calls, `AIAuthError` on missing key, 401 handling, 429 quota/rate limit error mapping, and malformed output rejection. |
| **Secret Isolation & Security Audit** | `tests/security/secret-isolation.test.ts` | 2 | **PASSED** | Verifies `OPENAI_API_KEY` never has `NEXT_PUBLIC_` prefix, client components never import server-only AI modules or access raw secrets, and no Groq leakage exists. |

**Total:** 4 test files, 19 automated tests, 100% passing.

---

## 4. Phase Verification Summary

| Check | Tool / Command | Result | Details |
|---|---|---|---|
| **Unit & Integration Tests** | `vitest run` | **19 / 19 PASSED** | All parser, prompt, provider, and security tests pass. |
| **TypeScript Strictness** | `pnpm type-check` | **PASSED (0 errors)** | Zero type errors with strict mode enabled. |
| **Next.js Linter** | `pnpm lint` | **PASSED (0 warnings)** | Clean lint run. |
| **Production Build** | `pnpm build` | **PASSED** | All static and server-rendered routes compile cleanly. |
| **Client Secret Isolation** | Automated scan | **VERIFIED** | No keys or server services accessible to browser bundles. |

---

## 5. Manual Smoke-Test Procedure (With User's Own Local API Key)

Follow these steps on your local machine to verify the live OpenAI integration without exposing your key in chats or commits:

### Step 1: Create `.env.local`
In the project root (`e:\Research Analyzer`), copy the template or create `.env.local`:
```bash
cp .env.example .env.local
```
Then open `.env.local` in your editor and enter your OpenAI key:
```env
OPENAI_API_KEY=sk-proj-yourActualKeyHere...
OPENAI_MODEL=gpt-4o-mini
```

### Step 2: Start Development Server
```bash
pnpm dev
```
Open `http://localhost:3000` in your browser.

### Step 3: Check Health Endpoint
Navigate to `http://localhost:3000/api/health`.
Verify you receive a 200 response with:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "phase": 2,
    "provider": "openai",
    "openAIConfigured": true,
    "configuredModel": "gpt-4o-mini"
  }
}
```

### Step 4: Execute a Live Research Inquiry
1. Navigate to `http://localhost:3000/new` (or click "Start Topic Research").
2. Enter an academic research topic, for example:
   - **Research Question:** `How do transformer attention mechanisms compare to state space models (Mamba) in processing long-context scientific papers?`
   - **Scope:** `Focus on computational complexity and benchmarks from 2023-2025`
3. Click **Run Analysis**.
4. Observe the live loading indicator:
   - "Connecting to OpenAI Responses API..."
   - "Structuring academic analysis & evidence bounds..."
   - "Validating structured report contract..."
5. Verify the structured research report renders with:
   - Executive Summary
   - Key Findings (with `ai_interpretation` badges)
   - Detailed Analysis sections
   - Methodology, Limitations, and Conclusion
   - "Copy Markdown" button functioning properly.

### Step 5: Test Missing Key Safeguard
1. Temporarily comment out `OPENAI_API_KEY` in `.env.local`.
2. Restart or reload, and submit a query.
3. Verify an alert appears: `"OpenAI API Key Required"` with instructions to add `OPENAI_API_KEY` to `.env.local`.
