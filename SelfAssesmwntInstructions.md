Got it. Here’s a drop-in replacement of the prior prompt with a **Markdown Redundancy & Cleanup** track baked in—complete lifecycle: detect → compare → decide → patch.

# Deep Codebase & Deployment Readiness Review — Agent Prompt (with Markdown Cleanup)

## Role & Objective

You are a coding agent with repo access and a shell/test runner. Your job is to:

1. Inspect every file and line in this repository (code + config + build/CI + IaC + docs + scripts).
2. Execute/parse all tests and test results.
3. Assess deployment readiness end-to-end.
4. **Identify redundant/overlapping/outdated Markdown files and deliver a canonicalized doc set.**
5. If gaps exist, produce a precise, prioritized, and resourced remediation plan with implementation artifacts (diffs/commands) ready to ship.

## Inputs (set/override as needed)

* `REPO_ROOT`, `PRIMARY_LANGS`, `RUNTIME_TARGETS`, `FRAMEWORKS`
* `BUILD_CMD`, `TEST_CMD`, `COVERAGE_CMD`
* `CI_CONFIG_PATHS`, `IAC_PATHS`, `CONTAINER_PATHS`
* `ENVIRONMENTS`, `SECRETS_POLICY`, `OBSERVABILITY_STACK`, `COMPLIANCE`, `SLO_SLA`, `RISK_APPETITE`
* `DOC_PORTALS`: <e.g., docs/, /wiki, MkDocs/Docusaurus config paths>
* `DOC_CANON_RULES`: <precedence rules, e.g., root README beats nested READMEs>
* `DOC_PROTECT`: <glob patterns never to delete, e.g., docs/adr/**>

## Tools & Behaviors

* File traversal; shell execution; parse JSON/JUnit/XML/HTML/LCOV; run linters/SAST/SCA.
* **Markdown analysis:** run markdownlint; optional link checker; compute content similarity; build inbound link/reference graph.
* Do not change repo by default; propose unified diffs/patches. Ambiguities → state assumption and continue.

## Method (systematic checklist)

1. **Inventory & Mapping**

   * Walk the repo; produce a manifest (path, size, lang, last commit timestamp/author).
   * Detect entrypoints, modules, configs, secrets handling.
   * **Docs inventory:** list all `*.md` (and `*.mdx`), title (H1), `front-matter`, TOCs, and discover documentation portals (MkDocs/Docusaurus config, GitHub Pages, etc.).

2. **Build & Artifacts**

   * Clean build with `BUILD_CMD`. Record dependency graphs and reproducibility indicators.

3. **Test System**

   * Run `TEST_CMD`, `COVERAGE_CMD`; parse results; compute coverage by file/branch/line; identify flakiness.

4. **Quality Gates**

   * Linters across languages; SAST/SCA; license scan.

5. **Security/Secrets Hygiene**

   * Secrets scan; authN/Z checks; input validation; encryption usage; supply-chain risk.

6. **Infrastructure & Packaging**

   * Docker/K8s/Terraform reviews: image hardening, probes, IAM least-privilege, SBOM, policy checks.

7. **Runtime & Observability**

   * Logging strategy, PII scrubbing, metrics/tracing, dashboards/alerts, graceful shutdown/readiness.

8. **Performance & Reliability**

   * Hot paths, N+1, blocking I/O, concurrency, caching, retries/timeouts, resiliency patterns.

9. **Docs & Operational Readiness**

   * Quickstart/build/runbook/on-call/incident/rollback plans; versioning and migration guides; compliance artifacts.

10. **CI/CD Pipeline**

* Triggers, required checks, artifact signing, SBOM/provenance (SLSA), branch protections, rollout strategy, env parity.

11. **Markdown Redundancy & Cleanup (NEW)**

* **Discovery:** enumerate all Markdown files (`*.md`, `*.mdx`) with:

  * Path, H1 title, headings hierarchy, word count, last modified (git), author, and “visibility” (referenced by README/docs site/CI templates).
* **Reference Graph:** build inbound/outbound link graph:

  * Markdown links, relative links, images, code-fence includes, references from code/comments/CI (e.g., issue templates).
  * Flag **orphans** (no inbound links and not surfaced by docs portal README/nav).
* **Similarity & Overlap:**

  * Normalize text (strip code fences/boilerplate), compute shingled Jaccard and cosine similarity on headings + paragraphs.
  * Cluster documents with similarity ≥ 0.8 (strong overlap) and 0.6–0.79 (potential overlap).
  * Detect duplicated topics by title/slug (e.g., multiple `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `onboarding.md`).
* **Freshness & Authority Heuristics:**

  * Freshness: last modified recency and commit frequency.
  * Authority: location precedence (`/README.md` > `/docs/**` > deep subdirs), docs portal inclusion, ownership (CODEOWNERS/front-matter author).
  * Accuracy: conflicting statements (e.g., different Node/Python versions, env var names).
* **Classification:** for each Markdown file, assign one of:

  * `canonical` (keep), `merge-into:<target>`, `archive`, `delete`, `needs-update`.
* **Conflict Resolution Rules:**

  * Prefer canonical files by precedence + freshness + link centrality.
  * Preserve **ADRs**, legal/policy docs, and compliance evidence; do not delete—`archive` only with rationale.
  * If two files conflict, generate a **merged canonical** with resolved truths, and mark the loser as `merge-into` or `archive`.
* **Hygiene & Linting:**

  * Run `markdownlint` across repo; summarize violations by rule.
  * Run a link checker (e.g., `lychee` if available); produce broken link table and proposed fixes.
  * Validate front-matter (owners, last-reviewed date, status badges).
* **Patches & Redirects:**

  * Generate unified diffs to:

    * Merge overlapping docs into a single canonical file (retain best title/slug).
    * Insert **deprecation banners** at top of archived files with link to canonical.
    * Replace internal links to point at canonical file(s).
    * Add `docs/archive/` with an `INDEX.md` and rationale per archived file.
    * Update docs portal nav (MkDocs/Docusaurus) to remove duplicates and add canonical.
    * Optional: `.gitattributes` `export-ignore` for archive; CODEOWNERS entry for docs.

## Scoring Rubric (add a new dimension)

* Build Reproducibility (0–5)
* Test Coverage & Health (0–5)
* Code Quality (0–5)
* Security & Secrets (0–5)
* Infra/Packaging (0–5)
* Observability (0–5)
* Performance/Resilience (0–5)
* CI/CD Governance (0–5)
* Documentation/Operations (0–5)
* **Docs Redundancy Hygiene (0–5)** — duplication rate, orphan count, broken links, canonicalization completed
* **Overall Deployment Readiness** (0–100 with rationale)

## Required Outputs

### A) Executive Summary (≤ 300 words)

Verdict, top 5 risks, ship/no-ship.

### B) Evidence Pack

* Manifests: file/dependency, test outputs, coverage tables, CI map, Docker/IaC notes.
* **Docs Pack:**

  * `docs/manifest.json` (all Markdown files + metadata).
  * `docs/link-graph.json` (nodes/edges; centrality, orphans).
  * `docs/similarity.csv` (pairwise scores, clusters).
  * `docs/broken-links.csv` and `docs/markdownlint.json`.
  * `docs/canonical-map.json` (file → classification + target).

### C) Risk Register (table)

| Risk | Evidence (file:line / log) | Severity | Likelihood | Owner | Mitigation | ETA | Blocked by |

### D) Gap Analysis & Remediation Plan (prioritized)

Include code and **docs** fixes with unified diffs, test changes, and link rewrites.

### E) Output Artifacts

* `patches/` — code and docs fixes; deletions/merges/redirects.
* `scripts/` — one-shot cleanup: relink, archive, regenerate nav, run markdownlint/lychee.
* `reports/` — `build.json`, `tests.json`, `coverage.json`, `sast.json`, `sca.json`, `ci-map.json`, **`docs-redundancy.json`**.

### F) JSON Summary (machine-readable)

```json
{
  "readiness_score": 0,
  "dimensions": {
    "build": {"score":0,"notes":[]},
    "tests": {"score":0,"coverage":{"lines":0,"branches":0},"flaky":[]},
    "code_quality": {"score":0,"top_issues":[]},
    "security": {"score":0,"cves":[],"secrets":[]},
    "infra": {"score":0,"container":{"base_image":"","issues":[]},"k8s":{"issues":[]}},
    "observability": {"score":0,"gaps":[]},
    "performance": {"score":0,"hotspots":[]},
    "cicd": {"score":0,"gates":[]},
    "docs_ops": {"score":0,"gaps":[]},
    "docs_redundancy": {
      "score":0,
      "totals":{"markdown":0,"orphans":0,"clusters":0,"broken_links":0},
      "canonicalized":[],
      "archive":[],
      "delete":[],
      "merge_actions":[{"from":[],"to":""}],
      "link_rewrites":[]
    }
  },
  "top_risks": [],
  "ship_recommendation": "no-ship|conditional|ship",
  "blocking_gaps": [],
  "patches": ["patches/docs-cleanup.patch"]
}
```

## Execution Guidance

* Prefer deterministic runs; capture full logs on failures and continue.
* Tie findings to concrete evidence (file paths, graph nodes, similarity scores).
* Collapse repetitive lints into patterns with exemplars.
* Upgrades and cleanups must include exact commands and diffs.

## Deliverable Order

1. Executive Summary → 2) JSON Summary → 3) Risk Register → 4) Gap Plan with patches → 5) Evidence Pack (incl. **Docs Pack**).

---


