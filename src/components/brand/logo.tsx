"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface BrandLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  variant?: "mark" | "full";
  className?: string;
  showText?: boolean;
}

/**
 * Official Brand Mark for Research Analyzer.
 * Swiss Modernism 2.0 Geometric Folio & Analytical Prism.
 * Represents scientific rigor, multi-layered document analysis, and grounded evidence.
 */
export function BrandIcon({
  size = 32,
  className,
  ...props
}: React.SVGProps<SVGSVGElement> & { size?: number | string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 select-none", className)}
      aria-label="Research Analyzer Mark"
      {...props}
    >
      <defs>
        {/* Background rounded container gradient */}
        <linearGradient id="ra-bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E3A8A" />
          <stop offset="50%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>

        {/* Primary left folio wing (Scientific Depth) */}
        <linearGradient id="ra-folio-left" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>

        {/* Primary right folio wing (Analytical Synthesis) */}
        <linearGradient id="ra-folio-right" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>

        {/* Central Refractive Diamond / Prism Core */}
        <linearGradient id="ra-prism-core" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="60%" stopColor="#93C5FD" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>

        {/* Evidence Precision Node Accent */}
        <radialGradient id="ra-node-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#34D399" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Rounded squircle backdrop */}
      <rect
        x="2"
        y="2"
        width="60"
        height="60"
        rx="14"
        fill="url(#ra-bg-grad)"
        stroke="#334155"
        strokeWidth="1.5"
      />

      {/* Subtle background tech grid accents */}
      <path
        d="M12 32 H52 M32 12 V52"
        stroke="#475569"
        strokeWidth="0.75"
        strokeDasharray="2 3"
        strokeOpacity="0.4"
      />

      {/* Left Folio Plane (Academic Paper Leaf) */}
      <path
        d="M18 44 L18 20 C18 18.5 19.5 17.5 21 18.2 L32 23.5 L32 47.5 L21 42.2 C19.2 41.3 18 42.5 18 44 Z"
        fill="url(#ra-folio-left)"
        fillOpacity="0.95"
      />

      {/* Right Folio Plane (Analytical Leaf) */}
      <path
        d="M46 44 L46 20 C46 18.5 44.5 17.5 43 18.2 L32 23.5 L32 47.5 L43 42.2 C44.8 41.3 46 42.5 46 44 Z"
        fill="url(#ra-folio-right)"
        fillOpacity="0.95"
      />

      {/* Central Prism Diamond / Knowledge Focus Lens */}
      <polygon
        points="32,15 41,29 32,43 23,29"
        fill="url(#ra-prism-core)"
        stroke="#FFFFFF"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />

      {/* Inner facet lines for refractive scientific depth */}
      <line x1="32" y1="15" x2="32" y2="43" stroke="#1D4ED8" strokeWidth="0.8" strokeOpacity="0.6" />
      <line x1="23" y1="29" x2="41" y2="29" stroke="#1D4ED8" strokeWidth="0.8" strokeOpacity="0.6" />

      {/* Grounded Evidence Center Core (Focal Point) */}
      <circle cx="32" cy="29" r="3.2" fill="#FFFFFF" />
      <circle cx="32" cy="29" r="1.6" fill="#0284C7" />

      {/* Verification Glow Spark / Anchor (Precision Citations) */}
      <circle cx="43" cy="19" r="2.2" fill="#34D399" />
      <circle cx="43" cy="19" r="5" fill="url(#ra-node-glow)" />
    </svg>
  );
}

/**
 * Standalone Icon Mark without squircle container (useful for small inline badges or headers)
 */
export function BrandSymbol({
  size = 20,
  className,
  ...props
}: React.SVGProps<SVGSVGElement> & { size?: number | string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 select-none", className)}
      {...props}
    >
      <defs>
        <linearGradient id="sym-left" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient id="sym-right" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
        <linearGradient id="sym-core" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#93C5FD" />
        </linearGradient>
      </defs>

      {/* Left Folio */}
      <path
        d="M10 34 L10 14 C10 12.8 11.2 12 12.4 12.6 L24 17.5 L24 37.5 L12.4 32.6 C11 32 10 33 10 34 Z"
        fill="url(#sym-left)"
      />
      {/* Right Folio */}
      <path
        d="M38 34 L38 14 C38 12.8 36.8 12 35.6 12.6 L24 17.5 L24 37.5 L35.6 32.6 C37 32 38 33 38 34 Z"
        fill="url(#sym-right)"
      />
      {/* Central Diamond */}
      <polygon
        points="24,10 32,22 24,34 16,22"
        fill="url(#sym-core)"
        stroke="#1E40AF"
        strokeWidth="1"
      />
      <circle cx="24" cy="22" r="2.5" fill="#0284C7" />
      <circle cx="33" cy="13" r="1.8" fill="#10B981" />
    </svg>
  );
}

/**
 * Full Brand Logo with Typography (Swiss Modernism 2.0).
 */
export function BrandLogo({
  size = 36,
  showText = true,
  className,
}: BrandLogoProps) {
  return (
    <div className={cn("flex items-center gap-3 select-none", className)}>
      <BrandIcon size={size} />
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-sm font-bold tracking-tight text-foreground">
              Research
            </span>
            <span className="text-sm font-bold tracking-tight text-primary">
              Analyzer
            </span>
          </div>
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mt-1">
            Academic Intelligence
          </span>
        </div>
      )}
    </div>
  );
}
