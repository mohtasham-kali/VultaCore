# VultaCore — DevSecOps Pipeline & Engineering Architecture

## 1. Overview & SSDLC Model

VultaCore implements a Secure Software Development Lifecycle (SSDLC) integrating automated security controls across all stages of development:

```
[ Code ] ──▶ [ Commit / PR ] ──▶ [ Automated CI & SAST ] ──▶ [ Container & Image Scan ] ──▶ [ Staging & DAST ] ──▶ [ Release Gate ] ──▶ [ Hostinger Deploy ]
  │                 │                        │                           │                           │                     │                     │
Developer      Gitleaks Hook          Semgrep (SAST)              Trivy Image Scan             OWASP ZAP Baseline    Environment Approval     SSH / Passenger
Workstation    Secret Shield          Trivy (SCA & Misconfig)     SPDX SBOM Generation         Passive Security      Protected Branch         Zero-Downtime Reload
                                      CodeQL Deep Analysis        Non-Root UID Verification    Policy Enforcement                             Rollback Protection
```

---

## 2. DevSecOps Tooling Stack

| Category | Tool | Execution Trigger | Policy / Rule File | Action on Failure |
| :--- | :--- | :--- | :--- | :--- |
| **Secrets Scanning** | Gitleaks | PR & Push to `main` | [`.gitleaks.toml`](file:///home/hacker/Documents/Projects/SaaS%202.0/tri-stack/.gitleaks.toml) | **Blocks build** (Exit Code 1) |
| **SAST** | Semgrep Community | PR & Push to `main` | [`.semgrep/rules.yml`](file:///home/hacker/Documents/Projects/SaaS%202.0/tri-stack/.semgrep/rules.yml) | **Blocks build** on Error / Critical |
| **Deep Code Analysis**| GitHub CodeQL | Weekly & Push to `main` | Default security-extended queries | Issues Security Advisory |
| **SCA & Dependencies**| Trivy FS | PR & Push to `main` | [`.trivy.yaml`](file:///home/hacker/Documents/Projects/SaaS%202.0/tri-stack/.trivy.yaml) | Reports High/Critical CVEs |
| **Container Scanning**| Trivy Image | Push to `main` | [`.github/workflows/docker.yml`](file:///home/hacker/Documents/Projects/SaaS%202.0/tri-stack/.github/workflows/docker.yml) | Generates SPDX SBOM, verifies non-root |
| **DAST** | OWASP ZAP | Weekly & On-Demand | [`.zap/rules.tsv`](file:///home/hacker/Documents/Projects/SaaS%202.0/tri-stack/.zap/rules.tsv) | Uploads HTML & JSON artifacts |

---

## 3. GitHub Actions Workflows

1. **CI Web & API (`ci-web.yml`, `ci-api.yml`)**:
   - Enforces exact dependency installation (`npm ci`).
   - Executes TypeScript typechecks across both frontend and backend.
   - Compiles production bundles to verify build integrity prior to deployment.
2. **Security Pipeline (`security.yml`)**:
   - Executes Gitleaks against full commit history.
   - Runs Semgrep SAST scanning with custom NestJS and Next.js security rules.
   - Runs Trivy filesystem scan against dependencies, configurations, and Dockerfiles.
   - Runs CodeQL for JavaScript/TypeScript and Python.
3. **Container Security (`docker.yml`)**:
   - Builds production multi-stage Docker images.
   - Validates that containers run under dedicated non-root users (UID != 0).
   - Generates formal Software Bill of Materials (SBOM) in standard SPDX JSON format.
4. **Dynamic Application Security Testing (`dast.yml`)**:
   - Launches automated OWASP ZAP baseline scan against staging URL.
   - Tests headers, cookies, injection flaws, and information leaks.
5. **Continuous Deployment (`cd-deploy.yml`)**:
   - Strictly requires passing `ci-web` and `ci-api` checks before triggering.
   - Safely isolates and backs up persistent SQLite state (`saas.sqlite`).
   - Pulls updates and restarts Phusion Passenger on Hostinger.
   - Validates live application health check via `HEALTH_URL`.
   - Automatically executes zero-downtime rollback if health checks fail.

---

## 4. Local Developer Security Commands

Developers can run local security checks before pushing:

```bash
# 1. Typecheck frontend & backend
npm run typecheck --prefix backend-api
npm run typecheck --prefix web-dashboard

# 2. Run Gitleaks locally via Docker
docker run --rm -v "$PWD:/repo" zricethezav/gitleaks:latest detect --source /repo --config /repo/.gitleaks.toml

# 3. Run Trivy filesystem scan locally
docker run --rm -v "$PWD:/src" aquasec/trivy:latest fs --config /src/.trivy.yaml /src

# 4. Run Semgrep locally
semgrep scan --config p/default --config .semgrep/rules.yml --exclude node_modules --exclude out
```

