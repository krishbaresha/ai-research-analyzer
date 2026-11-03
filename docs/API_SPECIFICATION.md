# AI Research Analyzer — API Specification

> **Status:** Active / Authoritative  
> **Protocol:** HTTP/1.1 REST + JSON (Next.js Route Handlers)  
> **Base URL:** `/api`  
> **Active AI Engine:** OpenAI Responses API (`gpt-4o-mini`)

---

## 1. Global Standards & Envelope

All API routes return responses conforming to the standard JSON envelope:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "metadata": {
    "timestamp": "2026-11-03T11:40:00Z",
    "processingTimeMs": 1150,
    "model": "gpt-4o-mini"
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
- `AI_AUTH_ERROR` (401) - Server missing or invalid `OPENAI_API_KEY`.
- `AI_RATE_LIMIT` (429) - OpenAI rate limit reached; retry after backoff.
- `AI_QUOTA_EXCEEDED` (402) - Account credit limit or quota exceeded.
- `AI_TIMEOUT` (504) - Inference request exceeded timeout window.
- `AI_MALFORMED_OUTPUT` (502) - Model generated invalid JSON failing schema validation.
- `PAYLOAD_TOO_LARGE` (413) - Upload exceeds maximum upload size (10MB).
- `UNSUPPORTED_MEDIA_TYPE` (415) - Non-PDF file uploaded.
- `NOT_FOUND` (404) - Requested project, document, or analysis not found.

---

## 2. Endpoint Specifications

### 2.1 Research Topic Analysis

#### `POST /api/research/analyze-topic`
Synthesizes a topic into a structured, academic research report using the OpenAI Responses API.

- **Authentication:** Public route; uses server-side `OPENAI_API_KEY`.
- **Content-Type:** `application/json`

**Request Body:**
```json
{
  "topic": "How do transformer attention mechanisms compare to state space models (Mamba) in processing long scientific papers?",
  "scope": "Focus on computational complexity and benchmark datasets from 2023-2025"
}
```

**Field Rules:**
- `topic` *(string, required)*: Length between 5 and 1000 characters.
- `scope` *(string, optional)*: Length up to 500 characters.

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "title": "Comparative Analysis: Transformer Attention vs. State Space Models",
    "executiveSummary": "A systematic review of computational efficiency and long-context processing...",
    "researchQuestion": "How do transformer attention mechanisms compare to state space models (Mamba)...",
    "scope": "Focus on computational complexity and benchmark datasets from 2023-2025",
    "keyFindings": [
      {
        "finding": "State Space Models exhibit O(N) linear time and memory scaling with context length...",
        "confidence": 0.88,
        "evidenceCategory": "ai_interpretation"
      }
    ],
    "detailedAnalysis": [
      {
        "heading": "Computational Complexity Scaling",
        "paragraphs": [
          "Transformers utilize quadratic self-attention O(N^2), creating significant memory overhead..."
        ]
      }
    ],
    "methodology": "Systematic synthesis of published architectural benchmarks and empirical complexity analyses.",
    "limitations": [
      "Topic analysis is model-synthesized background analysis and does not query live real-time academic databases."
    ],
    "furtherResearch": [
      "Empirical benchmark of hybrid Mamba-Transformer models on whole-book scientific QA tasks."
    ],
    "conclusion": "While Transformers remain dominant for general tasks, SSMs provide superior throughput on extreme context lengths.",
    "generatedAt": "2026-11-03T11:40:00Z",
    "modelUsed": "gpt-4o-mini"
  },
  "metadata": {
    "timestamp": "2026-11-03T11:40:00Z",
    "processingTimeMs": 1150,
    "model": "gpt-4o-mini"
  }
}
```

---

### 2.2 System Health Check

#### `GET /api/health`
Checks server runtime status and AI configuration without exposing credentials.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "phase": 2,
    "provider": "openai",
    "openAIConfigured": true,
    "configuredModel": "gpt-4o-mini",
    "maxUploadBytes": 10485760,
    "runtime": "nodejs",
    "timestamp": "2026-11-03T11:40:00Z"
  }
}
```
