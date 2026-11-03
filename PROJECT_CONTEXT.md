# AI Research Analyzer — Project Context & Engineering Specification

> **Notice:** The authoritative master context document is located at [`docs/PROJECT_CONTEXT.md`](file:///E:/Research%20Analyzer/docs/PROJECT_CONTEXT.md).  
> All future AI coding agents must read [`docs/PROJECT_CONTEXT.md`](file:///E:/Research%20Analyzer/docs/PROJECT_CONTEXT.md) for the complete, up-to-date engineering specification, architecture, git history, current limitations, 10-phase roadmap, and 20 rules.

---

## Quick Reference Summary

- **Product:** AI Research Analyzer
- **Active Stack:** Next.js 15 (App Router) + TypeScript (Strict) + Tailwind CSS + OpenAI SDK (`openai` Responses API)
- **Default Model:** `gpt-4o-mini` (Configurable via `OPENAI_MODEL`)
- **PDF Extraction Engine:** `unpdf` (`^2.1.0`) with 1-indexed page boundaries
- **Storage Strategy:** Ephemeral In-Memory Repository (`DocumentStore`, `ConversationStore`) adhering to ADR-004 until Phase 6 introduces persistent database storage.
- **Completed Phases:**
  - Phase 1: Foundation, App Shell & Design System
  - Phase 2: Server-Side OpenAI Integration & Topic Research
  - Phase 3: PDF Upload & Reliable Text Extraction
  - Phase 4: PDF Analysis & Evidence-Grounded Reports
- **Next Phase (Expanded Scope):**
  - **Phase 5: Document Chat + Scholarly Paper Import + Research Library Foundation**
    1. Grounded Document Chat (Full-Document Scope with deterministic BM25 retrieval).
    2. Multi-source Paper Import (Local PDF upload, Public PDF URL, arXiv ID/URL, DOI / Crossref / OpenAlex / Semantic Scholar).
    3. Safe Remote Document Fetching & SSRF Defense Layer (IP pinning, DNS resolution, private range blocklists).
    4. Smart Document Processing Pipeline (single unified extraction & validation pipeline).
    5. In-Memory Research Library Foundation (metadata catalog, dashboard papers tab).
    6. Event Architecture Foundation (synchronous in-memory event bus for future automations).
- **Status of Phase 5:** **NOT STARTED** (In-memory document chat prototype exists in commit `267df7c`, but expanded paper import, SSRF defense, library foundation, and event hooks are pending implementation).
- **Core Rules:**
  1. Server-side key isolation (`OPENAI_API_KEY` never sent to client).
  2. Grounded evidence & zero hallucination.
  3. Untrusted data boundary & XML prompt injection defense.
  4. Strict SSRF defense on all remote requests.
  5. No premature external databases, vector stores, or paid search APIs.

For full details, please refer to [`docs/PROJECT_CONTEXT.md`](file:///E:/Research%20Analyzer/docs/PROJECT_CONTEXT.md).
