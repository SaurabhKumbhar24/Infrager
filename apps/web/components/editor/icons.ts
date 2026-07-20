import {
  ArrowDataTransferHorizontalIcon,
  BucketIcon,
  CloudServerIcon,
  ComputerProgrammingIcon,
  ComputerTerminalIcon,
  DatabaseIcon,
  Exchange01Icon,
  EyeIcon,
  GlobalIcon,
  GridViewIcon,
  HardDriveIcon,
  HierarchyIcon,
  Layers01Icon,
  PackageIcon,
  SecurityLockIcon,
  Shield01Icon,
  SqlIcon,
  UserShield01Icon,
} from "@hugeicons/core-free-icons";
import type { IRNode, ResourceType } from "@/lib/ir/schema";
import type { ServiceCategory } from "@/lib/catalog";

export type IconSvgObject = typeof GlobalIcon;

export const RESOURCE_ICONS: Record<ResourceType, IconSvgObject> = {
  vpc: GlobalIcon,
  subnet: GridViewIcon,
  security_group: Shield01Icon,
  ec2_instance: CloudServerIcon,
  alb: ArrowDataTransferHorizontalIcon,
  rds_instance: DatabaseIcon,
  s3_bucket: BucketIcon,
  iam_role: UserShield01Icon,
};

/** Catalog (generic) nodes are iconed by category. */
export const CATEGORY_ICONS: Record<ServiceCategory, IconSvgObject> = {
  Compute: CloudServerIcon,
  Containers: PackageIcon,
  Serverless: ComputerProgrammingIcon,
  Storage: HardDriveIcon,
  Database: DatabaseIcon,
  Networking: GlobalIcon,
  Analytics: SqlIcon,
  "Messaging & Integration": Exchange01Icon,
  "Security & Identity": SecurityLockIcon,
  "Management & Monitoring": EyeIcon,
  "Developer Tools": ComputerTerminalIcon,
  "AI & ML": HierarchyIcon,
  "End User & Media": Layers01Icon,
};

export function iconForNode(ir: IRNode): IconSvgObject {
  if (ir.type === "generic") {
    return CATEGORY_ICONS[ir.properties.category as ServiceCategory] ?? Layers01Icon;
  }
  return RESOURCE_ICONS[ir.type];
}

/** Short type tag shown under the node name, mono. */
export const RESOURCE_TAGS: Record<ResourceType, string> = {
  vpc: "aws_vpc",
  subnet: "aws_subnet",
  security_group: "aws_security_group",
  ec2_instance: "aws_instance",
  alb: "aws_lb",
  rds_instance: "aws_db_instance",
  s3_bucket: "aws_s3_bucket",
  iam_role: "aws_iam_role",
};

export function tagForNode(ir: IRNode): string {
  return ir.type === "generic" ? ir.properties.tfType : RESOURCE_TAGS[ir.type];
}
