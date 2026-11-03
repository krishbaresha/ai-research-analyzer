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
  - Phase 5: Document Chat + Scholarly Paper Import + Research Library Foundation
- **Next Phase:**
  - **Phase 6: Persistence, Projects & Research History**
    - Supabase / PostgreSQL database integration.
    - Persistent research workspaces, user library, and tagging.
- **Status:** **PHASE 5 COMPLETED — READY FOR PHASE 6**
- **Core Rules:**
  1. Server-side key isolation (`OPENAI_API_KEY` never sent to client).
  2. Grounded evidence & zero hallucination.
  3. Untrusted data boundary & XML prompt injection defense.
  4. Strict SSRF defense on all remote requests.
  5. No premature external databases, vector stores, or paid search APIs.

For full details, please refer to [`docs/PROJECT_CONTEXT.md`](file:///E:/Research%20Analyzer/docs/PROJECT_CONTEXT.md).
