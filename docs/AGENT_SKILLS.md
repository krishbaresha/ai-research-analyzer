# AI Research Analyzer — Agent Skills & MCP Inventory

> **Status:** Active  
> **Location:** `docs/AGENT_SKILLS.md`

---

## 1. Skill Discovery & Governance Policy

1. Only verified, maintained skills from trustworthy sources are installed.
2. Skills are stored in `.agents/skills/` or Antigravity's configured skill locations without running arbitrary or risky remote scripts.
3. No empty placeholder directories.
4. Skills provide workflows and instructions for the AI assistant and are never bundled into client application code or npm production bundles.

---

## 2. Agent Skills Inventory

| Skill Name | Category | Source / Implementation | Status | Purpose & Capabilities |
|---|---|---|---|---|
| `ui-ux-pro-max` | UI / UX Design | Antigravity Builtin / Local Config | Installed & Active | Design system guidance, responsive patterns, contrast, typography, spacing tokens, and UX guidelines. |
| `context7-mcp` | Documentation | MCP Tool Integration | Installed & Active | Queries real-time official docs and API signatures for Next.js, React, Tailwind, and Groq. |
| `managing-python-dependencies` | Runtime / Tooling | Builtin Configuration | Available | Manages environment constraints if any auxiliary Python scripts are required. |
| `accidental-data-loss-prevention` | Safety & Verification | Builtin Configuration | Active | Enforces explicit user verification before destructive actions or deletions. |

---

## 3. MCP Servers Evaluation & Status

| MCP Server | Integration Purpose | Target Capability | Current Status | Permission Level |
|---|---|---|---|---|
| **Context7** | Official library docs lookup | Fetch up-to-date Next.js, Zod, and Tailwind documentation | Enabled | Read-only documentation access |
| **Playwright MCP** | Browser automation & UI testing | Automate E2E testing of dashboard and file uploads | Evaluated for Phase 1 / Phase 9 testing | Local browser sandbox only |
| **GitHub MCP** | Version control & issue tracking | Manage pull requests and commit checkpoints | Optional (requires user authorization) | None (Local git used) |
| **Supabase MCP** | Database schema inspection | Query schema, test RLS policies | Deferred to Phase 6 | Read-only upon project configuration |

---

## 4. Safety & Security Rules for Skills
- Never execute unvetted installation bash/powershell scripts from untrusted external URLs.
- Do not grant skills file-system access outside the repository root.
- Never pass secret API keys (`GROQ_API_KEY`) to external skill inspection tools.
