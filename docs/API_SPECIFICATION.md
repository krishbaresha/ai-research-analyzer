# AI Research Analyzer — API Specification

> **Status:** Active / Authoritative  
> **Protocol:** HTTP/1.1 REST + JSON (Next.js Route Handlers)  
> **Base URL:** `/api`

---

## 1. Global Standards & Envelope

All API routes return responses conforming to the standard JSON envelope:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "metadata": {
    "timestamp": "2026-11-03T11:00:00Z",
    "processingTimeMs": 1420,
    "model": "llama-3.3-70b-versatile"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Research topic cannot exceed 1000 characters.",
    "details": [
      {
        "field": "topic",
        "issue": "String must contain at most 1000 character(s)"
      }
    ]
  }
}
```

### Standard Error Codes
- `BAD_REQUEST` (400) - Missing or malformed JSON payload.
- `VALIDATION_ERROR` (422) - Input failed Zod validation schema.
- `AI_AUTH_ERROR` (401/500) - Server missing or invalid `GROQ_API_KEY`.
- `AI_RATE_LIMIT` (429) - Groq rate limit reached; retry after backoff.
- `AI_TIMEOUT` (504) - Inference request exceeded timeout window.
- `AI_MALFORMED_OUTPUT` (502) - Model generated invalid JSON failing schema validation.
- `PAYLOAD_TOO_LARGE` (413) - Upload exceeds maximum upload size (10MB).
- `UNSUPPORTED_MEDIA_TYPE` (415) - Non-PDF file uploaded.
- `NOT_FOUND` (404) - Requested project, document, or analysis not found.

---

## 2. Endpoint Specifications

### 2.1 Research Topic Analysis

#### `POST /api/research/analyze-topic`
Submits a user-provided research topic or question for structured server-side analysis via Groq LPU inference (`groq.chat.completions.create`).

- **Authentication:** Public / Optional User Session (Key managed strictly on server)
- **Content-Type:** `application/json`

**Request Body:**
```json
{
  "topic": "Impact of retrieval-augmented generation on hallucination reduction in academic literature review",
  "scope": "Focus on computer science papers published between 2023 and 2025"
}
```

**Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "id": "res_8f93e2b1",
    "title": "Retrieval-Augmented Generation for Hallucination Mitigation in Academic Review",
    "researchQuestion": "Impact of retrieval-augmented generation on hallucination reduction in academic literature review",
    "scope": "Focus on computer science papers published between 2023 and 2025",
    "executiveSummary": "This analysis investigates the role of RAG architectures in dampening factual drift...",
    "backgroundContext": "Standard parametric LLMs suffer from ungrounded hallucinations...",
    "methodologyOverview": "Empirical studies benchmark factual consistency using ROUGE, BERTScore, and human evaluation...",
    "keyFindings": [
      {
        "id": "f1",
        "finding": "RAG reduces ungrounded hallucinations by up to 68% when paired with dense retrieval chunking.",
        "evidenceSource": "ai_interpretation"
      }
    ],
    "criticalAnalysis": "While RAG significantly improves factual recall, chunk fragmentation introduces boundary loss...",
    "strengths": [
      "Dynamic knowledge integration",
      "Traceable citation capability"
    ],
    "limitations": [
      "Retrieval latency overhead",
      "Sensitivity to noisy retrieval results"
    ],
    "researchGaps": [
      "Standardized multi-hop reasoning benchmarks across multi-modal academic figures"
    ],
    "conclusion": "RAG represents the prevailing standard for evidence grounding in research tasks.",
    "suggestedFollowUps": [
      "How do graph-based RAG architectures compare to dense vector retrieval in hierarchical document synthesis?"
    ],
    "evidenceStatus": "ai_interpretation",
    "modelId": "llama-3.3-70b-versatile",
    "createdAt": "2026-11-03T11:00:00.000Z"
  },
  "metadata": {
    "timestamp": "2026-11-03T11:00:00.000Z",
    "processingTimeMs": 1340,
    "model": "llama-3.3-70b-versatile"
  }
}
```

---

### 2.2 Health & Status

#### `GET /api/health`
Checks server health and validates Groq configuration status without exposing API key secrets.

**Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "phase": 2,
    "provider": "groq",
    "groqConfigured": true,
    "configuredModel": "llama-3.3-70b-versatile",
    "maxUploadBytes": 10485760,
    "runtime": "nodejs",
    "timestamp": "2026-11-03T11:00:00.000Z"
  }
}
```
