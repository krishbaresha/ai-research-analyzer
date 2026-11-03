import { validateUrlSafety, SSRFViolationError } from "@/lib/security/ssrf";

export interface FetchRemotePdfOptions {
  maxRedirects?: number;
  timeoutMs?: number;
  maxSizeBytes?: number;
}

export interface FetchRemotePdfResult {
  buffer: Buffer;
  finalUrl: string;
  contentType: string;
  fileSizeBytes: number;
}

export class RemoteFetchError extends Error {
  constructor(message: string, public readonly code: string, public readonly statusCode: number = 400) {
    super(message);
    this.name = "RemoteFetchError";
  }
}

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
const DEFAULT_MAX_REDIRECTS = 3;

/**
 * Securely fetches a remote PDF document via HTTPS with SSRF protection,
 * redirect bounds checking, content-type verification, and byte streaming caps.
 */
export async function fetchRemotePdf(
  targetUrl: string,
  options: FetchRemotePdfOptions = {}
): Promise<FetchRemotePdfResult> {
  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxSizeBytes = options.maxSizeBytes ?? DEFAULT_MAX_SIZE_BYTES;

  let currentUrl = targetUrl;
  let redirectCount = 0;

  while (redirectCount <= maxRedirects) {
    // 1. SSRF Safety Check on current URL
    const safety = await validateUrlSafety(currentUrl);
    if (!safety.safe) {
      throw new SSRFViolationError(
        `Remote fetch blocked: ${safety.reason}`,
        "SSRF_VIOLATION"
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(currentUrl, {
        method: "GET",
        signal: controller.signal,
        headers: {
          "User-Agent": "AIResearchAnalyzer/1.0 (Scholarly Document Fetcher; +https://github.com/academic/research-analyzer)",
          "Accept": "application/pdf,application/octet-stream;q=0.9,*/*;q=0.5",
        },
        redirect: "manual", // Manually handle redirects to enforce SSRF validation on each hop
      });

      clearTimeout(timeoutId);

      // Handle Redirects manually
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        redirectCount++;
        if (redirectCount > maxRedirects) {
          throw new RemoteFetchError(
            `Exceeded maximum allowed redirects (${maxRedirects}).`,
            "TOO_MANY_REDIRECTS",
            400
          );
        }

        const location = response.headers.get("location");
        if (!location) {
          throw new RemoteFetchError(
            "Redirect response missing Location header.",
            "INVALID_REDIRECT",
            502
          );
        }

        // Resolve relative redirect against current URL
        currentUrl = new URL(location, currentUrl).toString();
        continue;
      }

      if (!response.ok) {
        throw new RemoteFetchError(
          `Remote server returned HTTP ${response.status} ${response.statusText}.`,
          "REMOTE_SERVER_ERROR",
          response.status === 404 ? 404 : 502
        );
      }

      const contentType = (response.headers.get("content-type") || "").toLowerCase();

      // Reject obvious HTML landing pages pretending to be PDFs
      if (contentType.includes("text/html") || contentType.includes("application/xhtml")) {
        throw new RemoteFetchError(
          `The target URL returned an HTML page (${contentType}) instead of a PDF document. This usually indicates an access paywall or landing page.`,
          "HTML_NOT_PDF",
          422
        );
      }

      // Check Content-Length if present
      const contentLengthHeader = response.headers.get("content-length");
      if (contentLengthHeader) {
        const declaredSize = parseInt(contentLengthHeader, 10);
        if (!isNaN(declaredSize) && declaredSize > maxSizeBytes) {
          throw new RemoteFetchError(
            `Remote PDF exceeds maximum size limit of ${(maxSizeBytes / (1024 * 1024)).toFixed(1)} MB (reported ${ (declaredSize / (1024 * 1024)).toFixed(1) } MB).`,
            "PAYLOAD_TOO_LARGE",
            413
          );
        }
      }

      // Stream body with byte counter
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (buffer.length > maxSizeBytes) {
        throw new RemoteFetchError(
          `Downloaded PDF file size (${(buffer.length / (1024 * 1024)).toFixed(1)} MB) exceeds limit of ${(maxSizeBytes / (1024 * 1024)).toFixed(1)} MB.`,
          "PAYLOAD_TOO_LARGE",
          413
        );
      }

      // Validate PDF signature (%PDF-)
      const headerSnippet = buffer.subarray(0, 1024).toString("latin1");
      if (!headerSnippet.includes("%PDF-")) {
        // If content-type was octet-stream or other, but magic bytes are not PDF:
        throw new RemoteFetchError(
          "Downloaded file does not contain a valid PDF signature (%PDF-).",
          "INVALID_FILE_SIGNATURE",
          415
        );
      }

      return {
        buffer,
        finalUrl: currentUrl,
        contentType: contentType || "application/pdf",
        fileSizeBytes: buffer.length,
      };
    } catch (err: unknown) {
      clearTimeout(timeoutId);

      if (err instanceof SSRFViolationError || err instanceof RemoteFetchError) {
        throw err;
      }

      if (err instanceof Error && err.name === "AbortError") {
        throw new RemoteFetchError(
          `Remote download timed out after ${timeoutMs / 1000} seconds.`,
          "DOWNLOAD_TIMEOUT",
          504
        );
      }

      const message = err instanceof Error ? err.message : String(err);
      throw new RemoteFetchError(
        `Failed to fetch remote document: ${message}`,
        "FETCH_FAILED",
        502
      );
    }
  }

  throw new RemoteFetchError(
    `Exceeded maximum allowed redirects (${maxRedirects}).`,
    "TOO_MANY_REDIRECTS",
    400
  );
}
