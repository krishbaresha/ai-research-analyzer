import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Secret Isolation & Security Audit", () => {
  it("ensures OPENAI_API_KEY is never prefixed with NEXT_PUBLIC_", () => {
    const envExamplePath = path.resolve(__dirname, "../../.env.example");
    const content = fs.readFileSync(envExamplePath, "utf-8");

    expect(content).not.toContain("NEXT_PUBLIC_OPENAI");
    expect(content).toContain("OPENAI_API_KEY=");
  });

  it("ensures no client components import from server-only AI modules", () => {
    const componentsDir = path.resolve(__dirname, "../../src/components");
    const featuresDir = path.resolve(__dirname, "../../src/features");

    function scanDir(dir: string) {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      for (const file of files) {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
          scanDir(fullPath);
        } else if (file.name.endsWith(".tsx") || file.name.endsWith(".ts")) {
          const fileContent = fs.readFileSync(fullPath, "utf-8");

          // Client components should not import directly from @/lib/ai/openai.provider
          if (fileContent.includes('"use client"') || fileContent.includes("'use client'")) {
            expect(fileContent).not.toContain('from "@/lib/ai/openai.provider"');
            expect(fileContent).not.toContain('from "openai"');
            expect(fileContent).not.toContain("process.env.OPENAI_API_KEY");
          }
        }
      }
    }

    scanDir(componentsDir);
    scanDir(featuresDir);
  });
});
