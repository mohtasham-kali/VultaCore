# VultaCore — Security Policy & Controls

## 1. Security Architecture & Threat Model

VultaCore employs defense-in-depth principles across all platform layers:

### Network & Infrastructure
* **TLS 1.3 / 1.2 Enforcement**: All traffic is encrypted in transit.
* **HTTP Security Headers**: Strict-Transport-Security, Content-Security-Policy, X-Frame-Options (`DENY`), and X-Content-Type-Options (`nosniff`).
* **Origin Whitelisting**: Strict CORS validation in NestJS allowing only authenticated production origins.

### Application Security & Authentication
* **Supabase JWT Verification**: The backend API validates bearer tokens against Supabase Auth (`/auth/v1/user`), preventing spoofed user identity.
* **Role-Based Access Control (RBAC)**: All sensitive routes (`/api/users`, `/api/settings`, `/api/users/:id/plan`) enforce `AdminGuard`.
* **Timing-Safe Cryptography**: Lemon Squeezy webhook HMAC validation uses `crypto.timingSafeEqual` to prevent side-channel timing attacks.

### Database Security & Data Integrity
* **Row Level Security (RLS)**: Enforced on all Supabase PostgreSQL tables.
* **Non-Destructive Schema Policies**: Production database runs with `synchronize: false` in TypeORM to prevent unexpected table alterations.
* **Database Isolation**: The local `saas.sqlite` file is excluded from public source tracking and preserved across deployments.

---

## 2. Vulnerability Severity & SLA Matrix

| Severity Level | Response SLA | Remediation SLA | Release Policy |
| :--- | :--- | :--- | :--- |
| **Critical** | < 4 hours | < 24 hours | **Immediate deploy freeze / Hotfix** |
| **High** | < 12 hours | < 72 hours | Blocks scheduled deployment |
| **Medium** | < 48 hours | < 14 days | Addressed in regular sprint release |
| **Low** | < 7 days | Next cycle | Tracked in maintenance backlog |

---

## 3. Reporting a Security Vulnerability

If you discover a security vulnerability in VultaCore:

1. **Do not create a public GitHub issue.**
2. Send full details and reproduction steps to:  
   📧 **`mohtisham@techprogression.com`**
3. Include:
   - Vulnerability category (e.g. Broken Access Control, Injection, RCE)
   - Affected endpoint or component
   - Proof of Concept (PoC) payload or request
   - Potential impact
4. We acknowledge receipt within 24 hours and provide regular remediation updates.
