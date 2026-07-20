import type { CloudProvider, GenericAttributeValue } from "../ir/schema";

export const SERVICE_CATEGORIES = [
  "Compute",
  "Containers",
  "Serverless",
  "Storage",
  "Database",
  "Networking",
  "Analytics",
  "Messaging & Integration",
  "Security & Identity",
  "Management & Monitoring",
  "Developer Tools",
  "AI & ML",
  "End User & Media",
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

/**
 * One palette entry backed by the generic emitter. `tfType` is the canonical
 * Terraform resource for the service (the thing you'd reach for first);
 * services that expand into many resources can be promoted to rich types
 * later. Adding a service to Infrager = one line in a catalog file.
 */
export interface CatalogService {
  id: string;
  provider: CloudProvider;
  label: string;
  category: ServiceCategory;
  tfType: string;
  /** Attributes prefilled on drop. "__NAME__" is replaced with the node name. */
  defaults?: Record<string, GenericAttributeValue>;
}
