# VultaCore — Incident Response & Security Playbook

## 1. Incident Severity Definitions

* **P1 - Critical**: Active data breach, leaked credentials, remote code execution, database corruption, or complete site outage.
* **P2 - High**: Authentication bypass, privilege escalation, persistent XSS in public forums, or API denial of service.
* **P3 - Medium**: Non-critical information disclosure, rate-limiting failures, or UI functional bugs.
* **P4 - Low**: Minor configuration discrepancies or informational scanner findings.

---

## 2. Six-Phase Incident Response Lifecycle

```
[ 1. Preparation ] ──▶ [ 2. Identification ] ──▶ [ 3. Containment ] ──▶ [ 4. Eradication ] ──▶ [ 5. Recovery ] ──▶ [ 6. Post-Mortem ]
```

---

## 3. Playbook: Leaked Credentials / Secret Exposure

If an API key, Supabase service role secret, or database password is leaked:

1. **Immediate Revocation**:
   - **Supabase**: Go to Supabase Dashboard > Project Settings > API > Rotate API Keys (`service_role` and `anon`).
   - **Lemon Squeezy**: In Lemon Squeezy Dashboard > Developer > API Keys, immediately revoke the compromised key and generate a new one.
   - **Google Gemini / Groq**: Revoke API keys in Google Cloud Console and Groq Cloud Console.
2. **Update Environment**:
   - Update Hostinger environment: `hbuilds/config/.env` on the server.
   - Update GitHub Action Secrets (`Settings > Secrets and variables > Actions`).
3. **Trigger Zero-Downtime Reload**:
   - Run `touch tmp/restart.txt` on Hostinger to reload processes with new credentials.
4. **Git History Scrubbing (if committed)**:
   - Use `git-filter-repo` or BFG Repo-Cleaner to scrub the secret from git history.
   - Force push cleaned refs only after key revocation is complete.

---

## 4. Playbook: Emergency Deployment Rollback

If a bad deployment passes CI but causes runtime failures in production:

1. **Manual Rollback over SSH**:
   ```bash
   ssh -p 65002 u879979656@vultacore.techprogression.com
   cd /home/u879979656/domains/vultacore.techprogression.com/public_html
   
   # Reset to previous known good commit
   git reset --hard $(cat ~/.vultacore_prev_sha)
   
   # Re-install clean production deps
   npm ci --omit=dev
   
   # Restart Passenger
   passenger-config restart-app "$PWD" || touch tmp/restart.txt
   ```
2. **Check Diagnostic Health**:
   ```bash
   curl -I https://vultacore.techprogression.com/health
   ```

