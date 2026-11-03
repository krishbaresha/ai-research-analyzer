import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isPrivateOrReservedIPv4,
  isPrivateOrReservedIPv6,
  isPrivateOrReservedIP,
  validateUrlSafety,
  SSRFViolationError,
} from "@/lib/security/ssrf";
import { fetchRemotePdf, RemoteFetchError } from "@/lib/import/fetcher";

describe("SSRF Defense Suite (Security & Reliability)", () => {
  describe("IP Address Range Checks", () => {
    it("identifies private and loopback IPv4 ranges", () => {
      // Loopback
      expect(isPrivateOrReservedIPv4("127.0.0.1")).toBe(true);
      expect(isPrivateOrReservedIPv4("127.255.255.255")).toBe(true);

      // Cloud Metadata & Link-Local
      expect(isPrivateOrReservedIPv4("169.254.169.254")).toBe(true);
      expect(isPrivateOrReservedIPv4("169.254.1.1")).toBe(true);

      // Private RFC 1918
      expect(isPrivateOrReservedIPv4("10.0.0.1")).toBe(true);
      expect(isPrivateOrReservedIPv4("10.255.255.255")).toBe(true);
      expect(isPrivateOrReservedIPv4("172.16.0.1")).toBe(true);
      expect(isPrivateOrReservedIPv4("172.31.255.255")).toBe(true);
      expect(isPrivateOrReservedIPv4("192.168.1.1")).toBe(true);

      // Carrier-Grade NAT (100.64.0.0/10)
      expect(isPrivateOrReservedIPv4("100.64.0.1")).toBe(true);
      expect(isPrivateOrReservedIPv4("100.127.255.255")).toBe(true);

      // Current network & multicast
      expect(isPrivateOrReservedIPv4("0.0.0.0")).toBe(true);
      expect(isPrivateOrReservedIPv4("224.0.0.1")).toBe(true);
      expect(isPrivateOrReservedIPv4("240.0.0.1")).toBe(true);

      // Valid Public IPs
      expect(isPrivateOrReservedIPv4("8.8.8.8")).toBe(false);
      expect(isPrivateOrReservedIPv4("1.1.1.1")).toBe(false);
      expect(isPrivateOrReservedIPv4("140.82.112.4")).toBe(false); // GitHub
      expect(isPrivateOrReservedIPv4("151.101.1.140")).toBe(false);
    });

    it("identifies private and loopback IPv6 ranges", () => {
      expect(isPrivateOrReservedIPv6("::1")).toBe(true);
      expect(isPrivateOrReservedIPv6("::")).toBe(true);
      expect(isPrivateOrReservedIPv6("fc00::1")).toBe(true);
      expect(isPrivateOrReservedIPv6("fd12:3456:789a::1")).toBe(true);
      expect(isPrivateOrReservedIPv6("fe80::1")).toBe(true);
      expect(isPrivateOrReservedIPv6("::ffff:127.0.0.1")).toBe(true);
      expect(isPrivateOrReservedIPv6("::ffff:169.254.169.254")).toBe(true);
      expect(isPrivateOrReservedIPv6("ff02::1")).toBe(true); // Multicast

      // Valid Public IPv6 (e.g. Google DNS)
      expect(isPrivateOrReservedIPv6("2001:4860:4860::8888")).toBe(false);
    });
  });

  describe("validateUrlSafety", () => {
    it("rejects non-HTTPS protocols (http, file, ftp, gopher)", async () => {
      const http = await validateUrlSafety("http://example.com/paper.pdf");
      expect(http.safe).toBe(false);
      expect(http.reason).toContain("Only HTTPS is permitted");

      const file = await validateUrlSafety("file:///etc/passwd");
      expect(file.safe).toBe(false);

      const ftp = await validateUrlSafety("ftp://example.com/paper.pdf");
      expect(ftp.safe).toBe(false);

      const gopher = await validateUrlSafety("gopher://example.com/1");
      expect(gopher.safe).toBe(false);
    });

    it("rejects URLs with embedded credentials", async () => {
      const res = await validateUrlSafety("https://admin:secret@example.com/paper.pdf");
      expect(res.safe).toBe(false);
      expect(res.reason).toContain("Embedded credentials");
    });

    it("rejects localhost and internal hostname variants", async () => {
      const res1 = await validateUrlSafety("https://localhost/paper.pdf");
      expect(res1.safe).toBe(false);
      expect(res1.reason).toContain("Forbidden internal hostname");

      const res2 = await validateUrlSafety("https://api.internal/paper.pdf");
      expect(res2.safe).toBe(false);
    });

    it("rejects direct private and cloud metadata IP addresses", async () => {
      const res1 = await validateUrlSafety("https://127.0.0.1/secret.pdf");
      expect(res1.safe).toBe(false);

      const res2 = await validateUrlSafety("https://169.254.169.254/latest/meta-data");
      expect(res2.safe).toBe(false);

      const res3 = await validateUrlSafety("https://10.0.0.5/doc.pdf");
      expect(res3.safe).toBe(false);

      const res4 = await validateUrlSafety("https://192.168.1.1/router");
      expect(res4.safe).toBe(false);
    });

    it("allows valid public HTTPS domains", async () => {
      // Mocking dns or using a known public domain
      const res = await validateUrlSafety("https://arxiv.org/pdf/1706.03762.pdf");
      // As long as network/DNS resolves to public IP, it is safe
      expect(res.safe).toBe(true);
    });
  });

  describe("fetchRemotePdf", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("blocks request if initial URL violates SSRF", async () => {
      await expect(
        fetchRemotePdf("https://127.0.0.1/paper.pdf")
      ).rejects.toThrow(SSRFViolationError);
    });

    it("blocks redirect if target redirects to private cloud metadata IP", async () => {
      // Mock fetch returning a 302 redirect to 169.254.169.254
      const mockFetch = vi.fn().mockResolvedValueOnce({
        status: 302,
        headers: new Headers({
          Location: "https://169.254.169.254/latest/meta-data",
        }),
      });
      global.fetch = mockFetch;

      await expect(
        fetchRemotePdf("https://arxiv.org/redirect-test")
      ).rejects.toThrow(SSRFViolationError);
    });

    it("rejects HTML response masquerading as a PDF", async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({
          "content-type": "text/html; charset=utf-8",
        }),
      });
      global.fetch = mockFetch;

      await expect(
        fetchRemotePdf("https://arxiv.org/abs/2301.12345")
      ).rejects.toThrow(RemoteFetchError);
    });

    it("rejects non-PDF stream missing %PDF- magic bytes signature", async () => {
      const fakeContent = Buffer.from("THIS IS NOT A VALID PDF FILE HEADER");
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({
          "content-type": "application/pdf",
        }),
        arrayBuffer: async () => fakeContent.buffer,
      });
      global.fetch = mockFetch;

      await expect(
        fetchRemotePdf("https://arxiv.org/fake.pdf")
      ).rejects.toThrow(RemoteFetchError);
    });

    it("successfully downloads valid PDF with %PDF- header", async () => {
      const validPdfBuffer = Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF");
      const pureArrayBuffer = validPdfBuffer.buffer.slice(
        validPdfBuffer.byteOffset,
        validPdfBuffer.byteOffset + validPdfBuffer.byteLength
      );

      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({
          "content-type": "application/pdf",
          "content-length": String(validPdfBuffer.length),
        }),
        arrayBuffer: async () => pureArrayBuffer,
      });
      global.fetch = mockFetch;

      const result = await fetchRemotePdf("https://arxiv.org/pdf/1706.03762.pdf");
      expect(result.buffer).toBeDefined();
      expect(result.fileSizeBytes).toBe(validPdfBuffer.length);
      expect(result.contentType).toContain("application/pdf");
    });
  });
});
