import type { CloudProvider } from "../ir/schema";
import { AWS_CATALOG } from "./aws";
import { GCP_CATALOG } from "./gcp";
import type { CatalogService } from "./types";

export type { CatalogService, ServiceCategory } from "./types";
export { SERVICE_CATEGORIES } from "./types";

export const CATALOG: CatalogService[] = [...AWS_CATALOG, ...GCP_CATALOG];

const byId = new Map(CATALOG.map((s) => [s.id, s]));

export function getService(id: string): CatalogService | undefined {
  return byId.get(id);
}

export function servicesFor(provider: CloudProvider): CatalogService[] {
  return CATALOG.filter((s) => s.provider === provider);
}
