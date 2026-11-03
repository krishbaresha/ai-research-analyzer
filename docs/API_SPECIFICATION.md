# AI Research Analyzer — API Specification

> **Status:** Active / Authoritative  
> **Protocol:** HTTP/1.1 REST + JSON (Next.js Route Handlers)  
> **Base URL:** `/api`  
> **Active Features:** Topic-Based AI Analysis (Phase 2), PDF Upload & Page Extraction (Phase 3), Grounded PDF Analysis & Citations (Phase 4), Grounded Document Chat & Q&A (Phase 5)

---

## 1. Global Standards & Envelope

All API routes return responses conforming to the standard JSON envelope:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "metadata": {
    "timestamp": "2026-11-03T13:30:00Z",
    "processingTimeMs": 142
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "PAYLOAD_TOO_LARGE",
    "message": "File size (11.5 MB) exceeds maximum allowed limit of 10.0 MB."
  }
}
```

### Standard Error Codes
- `BAD_REQUEST` (400) - Missing parameters, invalid form-data, or empty payload.
- `VALIDATION_ERROR` (422) - Input failed Zod validation schema.
- `PAYLOAD_TOO_LARGE` (413) - Upload exceeds maximum upload size (10 MB).
- `UNSUPPORTED_MEDIA_TYPE` (415) - Non-PDF MIME type.
- `INVALID_FILE_SIGNATURE` (415) - Missing `%PDF-` magic bytes header.
- `CORRUPTED_PDF` (422) - File has damaged structure, bad xref table, or truncated streams.
- `ENCRYPTED_PDF` (422) - File is password-protected or encrypted.
- `EMPTY_DOCUMENT` (422) - Document contains 0 pages or no extractable structure.
- `NOT_FOUND` (404) - Requested document or resource does not exist.
- `AI_AUTH_ERROR` (401) - Server missing or invalid `OPENAI_API_KEY`.
- `AI_RATE_LIMIT` (429) - OpenAI rate limit reached; retry after backoff.
- `AI_QUOTA_EXCEEDED` (402) - Account credit limit or quota exceeded.
- `AI_TIMEOUT` (504) - Inference request exceeded timeout window.
- `AI_MALFORMED_OUTPUT` (502) - Model generated invalid JSON failing schema validation.

---

## 2. Endpoint Specifications

### 2.1 PDF Document Upload & Extraction (Phase 3 Active)

#### `POST /api/documents/upload`
Uploads an academic paper in PDF format, validates its file signature and size limits, extracts digital text page by page, and stores the document in ephemeral memory.
*(Note: Per Phase 3 specifications, this endpoint makes zero external LLM calls).*

- **Authentication:** Public
- **Content-Type:** `multipart/form-data`

**Request Body:**
Form-data containing a single file:
- `file` *(Blob/File, required)*: The PDF document to process. Max 10 MB.

**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "metadata": {
      "id": "doc_1730623200000_a1b2c3d4e5f6",
      "originalFilename": "attention-mechanism.pdf",
      "sanitizedFilename": "attention-mechanism.pdf",
      "mimeType": "application/pdf",
      "fileSizeBytes": 154200,
      "pageCount": 12,
      "totalWordCount": 5420,
      "totalCharCount": 36100,
      "isScanned": false,
      "ocrRequired": false,
      "isEncrypted": false,
      "uploadedAt": "2026-11-03T13:30:00.000Z"
    },
    "pages": [
      {
        "pageNumber": 1,
        "text": "Attention Is All You Need\nAshish Vaswani, Noam Shazeer...",
        "charCount": 3120,
        "wordCount": 485
      }
    ],
    "fullText": "--- Page 1 ---\nAttention Is All You Need..."
  },
  "metadata": {
    "timestamp": "2026-11-03T13:30:00.000Z",
    "processingTimeMs": 145
  }
}
```

---

### 2.2 Retrieve Extracted Document (Phase 3 Active)

#### `GET /api/documents/:id`
Retrieves a previously parsed and stored document with its page-by-page text streams.

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "metadata": {
      "id": "doc_1730623200000_a1b2c3d4e5f6",
      "originalFilename": "attention-mechanism.pdf",
      "sanitizedFilename": "attention-mechanism.pdf",
      "pageCount": 12,
      "totalWordCount": 5420,
      "isScanned": false,
      "uploadedAt": "2026-11-03T13:30:00.000Z"
    },
    "pages": [ ... ],
    "fullText": "..."
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Document with ID 'doc_invalid' was not found."
  }
}
```

---

### 2.3 Research Topic Analysis (Phase 2 Active)

#### `POST /api/research/analyze-topic`
Synthesizes a topic into a structured, academic research report using the OpenAI Responses API.

- **Content-Type:** `application/json`

**Request Body:**
```json
{
  "topic": "How do transformer attention mechanisms compare to state space models (Mamba) in processing long scientific papers?",
  "scope": "Focus on computational complexity and benchmark datasets from 2023-2025"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "title": "Comparative Analysis: Transformer Attention vs. State Space Models",
    "executiveSummary": "A systematic review of computational efficiency and long-context processing...",
    "keyFindings": [ ... ],
    "detailedAnalysis": [ ... ],
    "methodology": "...",
    "limitations": [ ... ],
    "furtherResearch": [ ... ],
    "conclusion": "..."
  },
  "metadata": {
    "timestamp": "2026-11-03T13:30:00Z",
    "processingTimeMs": 1150,
    "model": "gpt-4o-mini"
  }
}
```

---

### 2.4 Grounded PDF Document Analysis (Phase 4 Active)

#### `POST /api/documents/[id]/analyze`
Analyzes an uploaded, extracted PDF document using the OpenAI Responses API, producing a structured, 12-section evidence-grounded academic research report with exact 1-indexed page citations.

- **Authentication:** Public
- **Content-Type:** `application/json`

**URL Parameters:**
- `id` *(string, required)*: The internal document identifier (`doc_*`).

**Request Body (Optional):**
```json
{
  "focusArea": "Methodological validity and empirical benchmark results"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "title": "Document Analysis: FlashAttention Fast Attention Mechanisms",
    "documentOverview": {
      "fileName": "flash-attention.pdf",
      "totalPages": 12,
      "analyzedPagesCount": 12,
      "analyzedPages": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      "coveragePercentage": 100,
      "isPartialCoverage": false
    },
    "executiveSummary": "FlashAttention introduces an IO-aware exact attention algorithm...",
    "researchObjectives": [
      {
        "objective": "Address memory IO bottlenecks in standard multi-head attention",
        "status": "addressed",
        "pageReferences": [1, 2]
      }
    ],
    "keyFindings": [
      {
        "claim": "Tiling computation reduces memory reads/writes from O(N^2) to O(N)",
        "evidenceStatus": "from_document",
        "pageReferences": [2, 4],
        "analysis": "By splitting inputs into blocks and loading them into SRAM, FlashAttention avoids high-bandwidth HBM roundtrips."
      }
    ],
    "detailedAnalysis": [
      {
        "heading": "Algorithm & Kernel Implementation",
        "content": "The kernel fuses softmax reduction and matrix multiplication...",
        "pageReferences": [3, 4]
      }
    ],
    "methodologyAssessment": {
      "design": "Empirical benchmarking across BERT-large, GPT-2, and Long-Range Arena",
      "dataSources": "Synthetic benchmarks and standard NLP corpora",
      "strengths": [
        "Exact mathematics without approximation errors",
        "End-to-end wall-clock speedups"
      ],
      "limitations": [
        "SRAM tile size is hardware-specific"
      ],
      "pageReferences": [5, 6]
    },
    "importantConcepts": [
      {
        "term": "IO-Aware Complexity",
        "definition": "Measuring algorithmic efficiency by memory hierarchy accesses rather than pure FLOP count.",
        "pageReferences": [2]
      }
    ],
    "strengthsAndWeaknesses": {
      "strengths": [
        "Exact equivalence to standard self-attention",
        "Up to 3x training speedup"
      ],
      "weaknesses": [
        "Requires hand-tuned CUDA kernel implementation"
      ]
    },
    "limitations": [
      "Evaluation is restricted to NVIDIA Ampere and Turing architectures"
    ],
    "researchGaps": [
      "Extension to non-transformer state space architectures"
    ],
    "conclusion": "FlashAttention provides an IO-aware paradigm shift in deep learning attention layers...",
    "suggestedFurtherResearch": [
      "Hardware-adaptive block tiling for non-NVIDIA accelerators",
      "Integration with quantized KV caches"
    ]
  },
  "metadata": {
    "timestamp": "2026-11-03T13:45:00.000Z",
    "processingTimeMs": 2450,
    "model": "gpt-4o-mini"
  }
}
```

**Error Responses:**
- `404 NOT_FOUND`: Document does not exist or has expired.
- `422 UNPROCESSABLE_ENTITY`: Document is scanned/image-only (`ocrRequired: true`) or contains no extractable text.
- `401 AI_AUTH_ERROR`: OpenAI API key missing or invalid.
- `429 AI_RATE_LIMIT`: OpenAI API rate limit exceeded.

---

### 2.5 Grounded Document Chat & Q&A (Phase 5 Active)

#### `POST /api/documents/[id]/chat`
Interrogates an uploaded PDF document using deterministic page-aware BM25 passage retrieval across all pages, answering questions with exact page references, verified claim breakdown, and honest abstention.

- **Authentication:** Public
- **Content-Type:** `application/json`

**URL Parameters:**
- `id` *(string, required)*: The internal document identifier (`doc_*`).

**Request Body:**
```json
{
  "message": "What speedup is reported on NVIDIA A100 GPUs?",
  "conversationId": "conv_1730640000000_abc123" // null or omitted for new conversation
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "conversationId": "conv_1730640000000_abc123",
    "message": {
      "id": "msg_ast_1730640001000",
      "role": "assistant",
      "answer": "The paper reports that FlashAttention yields a 3.2x wall-clock speedup for GPT-2 medium training and up to 4.1x for sequence lengths of 4096 tokens on NVIDIA A100 GPUs.",
      "evidenceStatus": "supported",
      "claims": [
        {
          "statement": "On NVIDIA A100 GPUs, FlashAttention yields a 3.2x speedup for GPT-2 medium training.",
          "pageReferences": [2],
          "evidenceStatus": "from_document"
        },
        {
          "statement": "Yields up to a 4.1x speedup for sequence lengths of 4096 tokens.",
          "pageReferences": [2],
          "evidenceStatus": "from_document"
        }
      ],
      "sources": [
        {
          "pageNumber": 2,
          "relevanceReason": "Reports empirical speedup benchmarks on NVIDIA A100 GPUs.",
          "excerpt": "FlashAttention yields a 3.2x speedup for GPT-2 medium training..."
        }
      ],
      "createdAt": "2026-11-03T14:00:01.000Z"
    },
    "retrieval": {
      "pagesSearched": 12,
      "pagesUsed": [2],
      "partialCoverage": false,
      "totalChunksSearched": 28
    }
  },
  "metadata": {
    "timestamp": "2026-11-03T14:00:01.000Z",
    "processingTimeMs": 1320,
    "model": "gpt-4o-mini"
  }
}
```

**Abstaining Response (when evidence is not found in document):**
```json
{
  "success": true,
  "data": {
    "conversationId": "conv_1730640000000_abc123",
    "message": {
      "id": "msg_ast_1730640002000",
      "role": "assistant",
      "answer": "The uploaded document does not contain information regarding CRISPR gene editing.",
      "evidenceStatus": "not_found",
      "claims": [],
      "sources": [],
      "createdAt": "2026-11-03T14:00:02.000Z"
    },
    "retrieval": {
      "pagesSearched": 12,
      "pagesUsed": [],
      "partialCoverage": false,
      "totalChunksSearched": 28
    }
  }
}
```

#### `DELETE /api/documents/[id]/chat?conversationId=conv_...`
Clears messages from an active in-memory conversation session.

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "conversationId": "conv_1730640000000_abc123",
    "cleared": true
  },
  "metadata": {
    "timestamp": "2026-11-03T14:00:03.000Z"
  }
}
```

---

## 3. Planned Phase 5 Endpoints (Scholarly Paper Import & Research Library)

The following endpoints represent the planned contracts for the expanded Phase 5 scope:

### 3.1 `POST /api/documents/import-url`
Fetches an academic paper from a public HTTPS URL with SSRF defense validation, verifies `%PDF-` signature, extracts page boundaries, and registers the paper in the Research Library.

**Request Body:**
```json
{
  "url": "https://example-university.edu/papers/quantum-computing.pdf"
}
```

**Planned Error Codes:**
- `SSRF_VIOLATION` (400) — Blocked private/loopback IP or non-HTTPS protocol.
- `DOWNLOAD_TIMEOUT` (504) — Remote server took > 15s.
- `PAYLOAD_TOO_LARGE` (413) — Remote file exceeds 15 MB limit.

### 3.2 `POST /api/documents/import-arxiv`
Fetches paper metadata via the arXiv API and downloads the corresponding PDF directly from arXiv.

**Request Body:**
```json
{
  "arxivId": "2301.12345"
}
```

### 3.3 `POST /api/documents/import-doi`
Resolves metadata for a digital object identifier via Crossref / OpenAlex / Semantic Scholar, attempts to resolve open-access PDF links via Unpaywall, and extracts the paper into the workspace.

**Request Body:**
```json
{
  "doi": "10.1145/3318464.3389700"
}
```

### 3.4 `GET /api/documents`
Lists all ingested papers registered in the in-memory Research Library catalog with full scholarly metadata.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "papers": [
      {
        "id": "doc_1730623200000_a1b2c3d4e5f6",
        "title": "Attention Is All You Need",
        "authors": ["Ashish Vaswani", "Noam Shazeer"],
        "year": 2017,
        "sourceType": "upload",
        "pageCount": 11,
        "wordCount": 5420,
        "uploadedAt": "2026-11-03T13:30:00.000Z"
      }
    ]
  }
}
```


#### `GET /api/health`
Checks server runtime status and configuration without exposing credentials.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "phase": 5,
    "provider": "openai",
    "openAIConfigured": true,
    "configuredModel": "gpt-4o-mini",
    "maxUploadBytes": 10485760,
    "runtime": "nodejs",
    "timestamp": "2026-11-03T14:00:00Z"
  }
}
```
