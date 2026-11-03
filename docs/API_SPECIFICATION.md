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
    "timestamp": "2026-11-03T10:00:00Z",
    "processingTimeMs": 1420
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The research topic cannot exceed 500 characters.",
    "details": [
      {
        "field": "topic",
        "issue": "String must contain at most 500 character(s)"
      }
    ]
  }
}
```

### Common Error Codes
- `BAD_REQUEST` (400) - Missing or malformed parameters.
- `VALIDATION_ERROR` (422) - Input failed Zod validation schema.
- `PAYLOAD_TOO_LARGE` (413) - PDF file exceeds maximum upload size (e.g., 10MB).
- `UNSUPPORTED_MEDIA_TYPE` (415) - Non-PDF file uploaded.
- `GROQ_AUTH_ERROR` (500) - Server missing or invalid `GROQ_API_KEY`.
- `GROQ_RATE_LIMITED` (429) - Groq API rate limit reached; client should back off.
- `AI_GENERATION_FAILED` (502) - Model failed to generate valid structured analysis.
- `NOT_FOUND` (404) - Requested project, document, or analysis not found.

---

## 2. Endpoint Specifications

### 2.1 Research Topic Analysis

#### `POST /api/research/analyze-topic`
Submits a user-provided research topic or question for structured server-side Groq analysis.

- **Authentication:** Public / Optional User Session
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
    "researchQuestion": "Impact of retrieval-augmented generation on hallucination reduction in academic literature review",
    "scope": "Focus on computer science papers published between 2023 and 2025",
    "executiveSummary": "...",
    "mainThemes": [
      {
        "title": "Contextual Grounding",
        "description": "..."
      }
    ],
    "keyConsiderations": [
      "..."
    ],
    "limitations": [
      "..."
    ],
    "suggestedQuestions": [
      "..."
    ],
    "evidenceStatus": "ai_interpretation",
    "model": "llama-3.3-70b-versatile"
  }
}
```

---

### 2.2 Document Upload & Validation

#### `POST /api/documents/upload`
Uploads a PDF file, validates MIME type and file integrity, and extracts page-partitioned text.

- **Content-Type:** `multipart/form-data`
- **Form Fields:**
  - `file`: PDF binary blob (Max 10MB default)
  - `projectId`: (Optional UUID)

**Response (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "documentId": "doc_a491f092",
    "originalFilename": "attention_is_all_you_need.pdf",
    "fileSizeBytes": 2214300,
    "pageCount": 15,
    "extractionStatus": "complete",
    "textLength": 43210,
    "previewSnippet": "Provided below is the abstract..."
  }
}
```

---

### 2.3 Document Analysis

#### `POST /api/documents/[id]/analyze`
Runs Groq analysis over the extracted document text chunks, producing an evidence-grounded research report with page citations.

- **Content-Type:** `application/json`

**Request Body:**
```json
{
  "focusPrompt": "Synthesize the core architecture, training dataset, and hardware limitations."
}
```

**Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "analysisId": "ana_738df9a1",
    "documentId": "doc_a491f092",
    "title": "Attention Is All You Need",
    "executiveSummary": "...",
    "methodology": "...",
    "keyFindings": [
      {
        "finding": "Multi-head attention allows the model to jointly attend to information from different representation subspaces.",
        "evidenceSource": "from_document",
        "pageReferences": [4, 5],
        "quote": "Multi-head attention allows the model to jointly attend to information..."
      }
    ],
    "strengths": ["..."],
    "limitations": ["..."],
    "researchGaps": ["..."],
    "coveragePercentage": 100
  }
}
```

---

### 2.4 Document-Grounded Q&A (Chat)

#### `POST /api/documents/[id]/chat`
Queries the document passages. Retrieves relevant chunks and generates an answer strictly grounded in the document evidence.

- **Content-Type:** `application/json`

**Request Body:**
```json
{
  "question": "What optimizer was used and what was the warmup steps value?",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

**Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "answer": "The Adam optimizer was used with beta1 = 0.9, beta2 = 0.98, and epsilon = 10^-9. The learning rate schedule used 4000 warmup steps.",
    "grounded": true,
    "citations": [
      {
        "pageNumber": 7,
        "snippet": "We used the Adam optimizer with beta1 = 0.9, beta2 = 0.98 and epsilon = 10^-9... warmup_steps = 4000."
      }
    ]
  }
}
```

If the document does not contain the answer:
```json
{
  "success": true,
  "data": {
    "answer": "This information is not established in the provided document material.",
    "grounded": false,
    "citations": []
  }
}
```

---

### 2.5 Health & Status

#### `GET /api/health`
Checks server health and validates Groq configuration status without exposing API key secrets.

**Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "groqConfigured": true,
    "configuredModel": "llama-3.3-70b-versatile",
    "runtime": "nodejs"
  }
}
```
