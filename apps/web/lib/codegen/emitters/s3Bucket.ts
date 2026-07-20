import type { NodeOfType } from "../../ir/schema";
import type { CodegenContext } from "../context";
import { q } from "../hcl";

/**
 * One S3 node expands into the modern split resources: bucket + versioning +
 * SSE configuration + public access block. bucket_prefix (not bucket) avoids
 * global-name collisions.
 */
export function emitS3Bucket(node: NodeOfType<"s3_bucket">, ctx: CodegenContext): string[] {
  const p = node.properties;
  const label = ctx.labelOf(node.id);
  const blocks: string[] = [];

  blocks.push(
    `resource "aws_s3_bucket" "${label}" {
  bucket_prefix = ${q(`${label.replace(/_/g, "-")}-`.slice(0, 37))}

  tags = {
    Name = ${q(node.name)}
  }
}`
  );

  blocks.push(
    `resource "aws_s3_bucket_versioning" "${label}" {
  bucket = aws_s3_bucket.${label}.id

  versioning_configuration {
    status = ${q(p.versioningEnabled ? "Enabled" : "Suspended")}
  }
}`
  );

  if (p.encryption !== "none") {
    blocks.push(
      `resource "aws_s3_bucket_server_side_encryption_configuration" "${label}" {
  bucket = aws_s3_bucket.${label}.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = ${q(p.encryption)}
    }
  }
}`
    );
  }

  if (p.blockPublicAccess) {
    blocks.push(
      `resource "aws_s3_bucket_public_access_block" "${label}" {
  bucket = aws_s3_bucket.${label}.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}`
    );
  }

  return blocks;
}
