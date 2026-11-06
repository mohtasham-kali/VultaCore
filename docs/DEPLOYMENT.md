# VultaCore — Deployment & Hostinger Architecture

## 1. Hosting Architecture: Hostinger Managed Cloud

VultaCore runs in production on **Hostinger Managed Cloud** using CloudLinux with CageFS and Phusion Passenger / LiteSpeed.

```
                           Hostinger Ingress (HTTPS)
                                      │
                                      ▼
                        LiteSpeed / Phusion Passenger
                                      │
                                      ▼
                          server.js (Master Proxy)
                         (Port: process.env.PORT)
                        ┌─────────────┼─────────────┐
                        │             │             │
                    Unix Socket   Unix Socket   Unix Socket
                    /tmp/*.sock   /tmp/*.sock   /tmp/*.sock
                        │             │             │
                        ▼             ▼             ▼
                  web-dashboard  backend-api   ai-services
```

### Why Unix Domain Sockets?
CloudLinux CageFS isolates users and blocks internal TCP loopback connections on random ports through strict iptables / CSF firewall rules.
`server.js` generates user-scoped Unix domain sockets in `/tmp`:
- `vultacore-back-${uid}.sock` (NestJS backend API)
- `vultacore-dash-${uid}.sock` (Next.js standalone web dashboard)
- `vultacore-ai-${uid}.sock` (FastAPI Python AI engine)

This enables zero-latency IPC communication without TCP firewall collisions.

---

## 2. CI/CD Release Pipeline (`cd-deploy.yml`)

Every merge into `main` executes the following automated pipeline:

1. **Pre-Deploy Verification**:
   - `ci-web`: Typechecks and compiles `web-dashboard`.
   - `ci-api`: Typechecks and builds `backend-api`.
2. **SSH Connection & Safe State**:
   - Connects to Hostinger using pinned SSH host key fingerprint (`DEPLOY_HOST_FINGERPRINT`).
   - Verifies `DEPLOY_PATH` git checkout.
   - Saves current commit SHA to `~/.vultacore_prev_sha` for rollback readiness.
   - Backs up `saas.sqlite` to `~/backups/` and `/tmp/saas.keep`.
3. **Atomic Code Pull & Reset**:
   - Runs `git fetch origin main`.
   - Runs `git reset --hard origin/main`.
   - Restores persistent `saas.sqlite`.
4. **Dependency Resolution**:
   - Executes `npm ci --omit=dev`.
   - Configures Python virtual environment in `ai-services/venv` and updates `requirements.txt`.
5. **Process Restart**:
   - Runs `passenger-config restart-app "$DEPLOY_PATH"` (or touches `tmp/restart.txt`).
6. **Live Health Verification**:
   - Queries `HEALTH_URL` up to 6 times (10s intervals).
   - Validates that `.status == "up"`, `.ready.backend == true`, `.ready.dashboard == true`, and `.uptime < 600`.
7. **Automated Rollback**:
   - If the health check fails, the workflow immediately triggers `Roll back on failure`:
     - Resets git to `~/.vultacore_prev_sha`.
     - Re-installs previous clean dependencies.
     - Restarts Passenger and restores operational status.

---

## 3. Required GitHub Secrets & Variables

Configure these under **GitHub Repository Settings > Secrets and variables > Actions**:

### Secrets
| Name | Description |
| :--- | :--- |
| `SSH_PRIVATE_KEY` | Ed25519 or RSA deployment SSH private key |
| `DEPLOY_HOST` | Hostinger server hostname or public IP |
| `DEPLOY_PORT` | SSH port (typically 65002 on Hostinger) |
| `DEPLOY_USER` | SSH username (e.g. `u879979656`) |
| `DEPLOY_HOST_FINGERPRINT` | Pinned OpenSSH public key fingerprint of the server |

### Variables
| Name | Description |
| :--- | :--- |
| `DEPLOY_PATH` | Absolute path to application directory on Hostinger |
| `HEALTH_URL` | Public health check URL (e.g. `https://vultacore.techprogression.com/health`) |
| `STAGING_URL` | Staging URL for OWASP ZAP dynamic scans |
| `NEXT_PUBLIC_API_URL` | Full API URL (e.g. `https://vultacore.techprogression.com/api`) |

