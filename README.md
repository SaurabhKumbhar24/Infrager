# Infrager

**Draw your architecture. Ship secure Terraform.**

Live at [infrager.getfluiq.com](https://infrager.getfluiq.com) · Source at
[github.com/SaurabhKumbhar24/Infrager](https://github.com/SaurabhKumbhar24/Infrager)

Infrager is an open-source, **free** tool that turns drag-and-drop cloud architecture
diagrams into production-ready Terraform, with a security linter that flags problems **while
you draw**, not after you deploy. AWS and Google Cloud are on the palette today; the
architecture is built to add every provider.

## Why

Infrastructure mistakes are usually visible in the diagram long before they are visible in a
`terraform plan`: the security group open to the world, the public S3 bucket, the database
without encryption, the IAM role with `Action: "*"`. Infrager treats the diagram as the source
of truth and runs security rules against it on every change, so the feedback loop is seconds,
not a failed compliance review.

Security posture is opinionated by default:

- **Secure defaults.** New resources start encrypted, private, and closed. Lint fires when you
  opt *into* risk, not because the palette handed you a footgun.
- **Live linting.** Rules for open security groups (sensitive ports to 0.0.0.0/0), public
  buckets, unencrypted RDS/S3, wildcard IAM, publicly accessible databases, and missing
  VPC/subnet attachments — shown on the canvas node and in the Issues panel.
- **Honest codegen.** Missing connections become explicit `# INFRAGER TODO` markers in the
  HCL. Secrets never enter the diagram; RDS passwords and ACM certificate ARNs are emitted as
  Terraform variables.

## What's in v1

- Figma-style workspace: accounts, project dashboard, autosaving editor
- Two tiers of resources on the canvas:
  - **Core (rich)**: VPC, Subnet, Security Group, EC2, ALB, RDS, S3, IAM Role/Policy — typed
    properties, bespoke codegen, and security lint rules
  - **Catalog (generic)**: 150+ AWS and GCP services (Lambda, EKS, DynamoDB, CloudFront, KMS,
    GKE, Cloud Run, BigQuery, Pub/Sub, Vertex AI, …) — searchable palette, freeform
    attributes, real Terraform output, `depends_on` wiring
- Typed relationships (EC2→Subnet, EC2→Security Group, ALB→EC2, …) validated as you connect;
  anything else becomes an explicit `depends_on`
- One-way generation: diagram → dependency-ordered HCL with per-provider blocks (copy or
  download `main.tf`)
- Codegen and linting run **entirely client-side** over a shared intermediate representation

## Architecture

```
apps/web        Next.js (App Router) — the editor, dashboard, and all codegen/linting
  lib/ir/       Intermediate representation: typed nodes + typed relationship edges.
                Canvas-agnostic and Terraform-agnostic. THE contract of the system.
  lib/catalog/  Provider service catalogs (aws.ts, gcp.ts). One line per service.
  lib/codegen/  IR -> HCL. One emitter per rich resource type + a generic emitter
                for catalog services + topological ordering.
  lib/lint/     Rule engine over the IR. Each rule: predicate -> findings.
  lib/editor/   React Flow <-> IR serialization (the only place canvas types appear)
  lib/api.ts    Client for the backend: Bearer-token auth, no cookies
apps/api        Express + TypeScript backend: JWT auth (Authorization: Bearer) and
                project persistence in PostgreSQL (users + projects w/ JSONB document)
```

The IR is the load-bearing decision: the canvas serializes into it, and codegen and lint both
consume it (entirely client-side — the API stores diagrams, it never interprets them). Adding
a resource type = extend the IR union, add one emitter file, and (optionally) add lint rules.

## Running locally

Requires Node 20+ and a PostgreSQL database. Quickest start:

```bash
docker run -d --name infrager-pg \
  -e POSTGRES_USER=infrager -e POSTGRES_PASSWORD=infrager -e POSTGRES_DB=infrager \
  -p 5433:5432 postgres:16

npm install
npm run dev        # api -> :4000, web -> http://localhost:3000
```

The API creates its tables on boot. Create an account, create a project, and drag resources
onto the canvas.

Configuration:

- `apps/api/.env` (see `.env.example`): `DATABASE_URL` (any Postgres — local, Docker, or RDS),
  `AUTH_SECRET` (**always set in production**), `CORS_ORIGINS`, `PGSSL=require` for RDS, `PORT`.
- `apps/web/.env` (see `.env.example`): `NEXT_PUBLIC_API_URL` — where the API lives.

Smoke tests for the codegen and lint engines:

```bash
cd apps/web
npx tsx scripts/codegen-smoke.ts   # prints generated HCL for a sample diagram
npx tsx scripts/lint-smoke.ts      # prints findings for secure + insecure variants
```

## Roadmap

- More clouds (Azure next) — a provider = one catalog file + a provider header block
- Promote high-traffic catalog services (Lambda, GKE, Cloud SQL, DynamoDB…) to rich types
  with typed properties and lint rules
- `terraform validate` in CI against generated fixtures
- Finding suppressions ("this bucket is intentionally public") stored per project
- Import existing Terraform state → diagram (reverse direction)

## License

MIT · Developed by the [FluiqAI](https://www.getfluiq.com) team.
