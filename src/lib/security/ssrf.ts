import * as dns from "dns";
import * as net from "net";

export class SSRFViolationError extends Error {
  constructor(message: string, public readonly code: string = "SSRF_VIOLATION") {
    super(message);
    this.name = "SSRFViolationError";
  }
}

/**
 * Checks if an IPv4 address falls within private, loopback, link-local, or reserved ranges.
 */
export function isPrivateOrReservedIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true; // Treat invalid IPv4 as unsafe
  }

  const [a, b] = parts;

  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;

  // 10.0.0.0/8 (Private Class A)
  if (a === 10) return true;

  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;

  // 169.254.0.0/16 (Link-Local & Cloud Metadata 169.254.169.254)
  if (a === 169 && b === 254) return true;

  // 172.16.0.0/12 (Private Class B: 172.16.x.x - 172.31.x.x)
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.168.0.0/16 (Private Class C)
  if (a === 192 && b === 168) return true;

  // 100.64.0.0/10 (Carrier-Grade NAT: 100.64.x.x - 100.127.x.x)
  if (a === 100 && b >= 64 && b <= 127) return true;

  // 192.0.2.0/24 (TEST-NET-1), 198.51.100.0/24 (TEST-NET-2), 203.0.113.0/24 (TEST-NET-3)
  if (a === 192 && b === 0 && parts[2] === 2) return true;
  if (a === 198 && b === 51 && parts[2] === 100) return true;
  if (a === 203 && b === 0 && parts[2] === 113) return true;

  // 224.0.0.0/4 (Multicast: 224.x - 239.x)
  if (a >= 224 && a <= 239) return true;

  // 240.0.0.0/4 (Reserved / Future use: 240.x - 255.x)
  if (a >= 240) return true;

  return false;
}

/**
 * Checks if an IPv6 address falls within private, loopback, link-local, or reserved ranges.
 */
export function isPrivateOrReservedIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();

  // Loopback (::1) or Unspecified (::)
  if (normalized === "::1" || normalized === "::") return true;

  // IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1)
  if (normalized.startsWith("::ffff:")) {
    const v4Part = normalized.replace("::ffff:", "");
    if (net.isIPv4(v4Part)) {
      return isPrivateOrReservedIPv4(v4Part);
    }
  }

  // Unique local addresses (fc00::/7 -> fc.. or fd..)
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;

  // Link-local unicast (fe80::/10 -> fe8, fe9, fea, feb)
  if (/^fe[89ab]/.test(normalized)) return true;

  // Multicast (ff00::/8)
  if (normalized.startsWith("ff")) return true;

  return false;
}

/**
 * Validates whether an IP address is private, loopback, or reserved.
 */
export function isPrivateOrReservedIP(ip: string): boolean {
  if (net.isIPv4(ip)) {
    return isPrivateOrReservedIPv4(ip);
  }
  if (net.isIPv6(ip)) {
    return isPrivateOrReservedIPv6(ip);
  }
  // Unknown format, reject
  return true;
}

export interface UrlSafetyReport {
  safe: boolean;
  resolvedIps?: string[];
  reason?: string;
  sanitizedUrl?: string;
}

/**
 * Validates a target URL against SSRF threats.
 * Enforces HTTPS, resolves DNS, and verifies all resolved IP addresses are public.
 */
export async function validateUrlSafety(rawUrl: string): Promise<UrlSafetyReport> {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return {
      safe: false,
      reason: "Invalid URL syntax.",
    };
  }

  // 1. Enforce HTTPS only (reject http:, file:, ftp:, gopher:, data:, etc.)
  if (parsedUrl.protocol !== "https:") {
    return {
      safe: false,
      reason: `Insecure or unsupported protocol '${parsedUrl.protocol}'. Only HTTPS is permitted.`,
    };
  }

  // 2. Reject credentials embedded in URL (e.g. https://user:pass@example.com)
  if (parsedUrl.username || parsedUrl.password) {
    return {
      safe: false,
      reason: "Embedded credentials in URL are prohibited.",
    };
  }

  // 3. Reject forbidden hostnames
  const hostname = parsedUrl.hostname.toLowerCase().trim();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    return {
      safe: false,
      reason: `Forbidden internal hostname '${hostname}'.`,
    };
  }

  // 4. If hostname is directly an IP address, validate it immediately
  if (net.isIP(hostname)) {
    if (isPrivateOrReservedIP(hostname)) {
      return {
        safe: false,
        reason: `Target IP '${hostname}' belongs to a private, loopback, or reserved subnet.`,
      };
    }
    return {
      safe: true,
      resolvedIps: [hostname],
      sanitizedUrl: parsedUrl.toString(),
    };
  }

  // 5. Perform DNS lookup to resolve all associated IPs
  try {
    const lookupResults = await dns.promises.lookup(hostname, { all: true });

    if (!lookupResults || lookupResults.length === 0) {
      return {
        safe: false,
        reason: `DNS resolution failed: no IP addresses found for '${hostname}'.`,
      };
    }

    const resolvedIps = lookupResults.map((r) => r.address);

    for (const ip of resolvedIps) {
      if (isPrivateOrReservedIP(ip)) {
        return {
          safe: false,
          resolvedIps,
          reason: `Hostname '${hostname}' resolved to private/reserved IP address '${ip}'.`,
        };
      }
    }

    return {
      safe: true,
      resolvedIps,
      sanitizedUrl: parsedUrl.toString(),
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      safe: false,
      reason: `DNS lookup failed for '${hostname}': ${errorMsg}`,
    };
  }
}
