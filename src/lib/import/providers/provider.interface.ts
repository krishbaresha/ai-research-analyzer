import { ScholarlyMetadata } from "@/types/import";

export interface MetadataProvider {
  readonly name: string;
  resolveMetadata(identifier: string): Promise<ScholarlyMetadata | null>;
}
