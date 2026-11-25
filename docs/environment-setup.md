# Environment setup

You have two options. **Start with the public demo.** Switch to Docker only if the shared data gets in your way.

## Option A: Public demo (zero setup)

| | |
|---|---|
| URL | https://opensource-demo.orangehrmlive.com |
| Login | Credentials are printed on the login page (usually `Admin` / `admin123`) |
| Pros | Instant, already full of sample employees |
| Cons | Shared with everyone, resets periodically, sometimes slow, version can change |

**Before each test session**
1. Log in and check **user menu › About** to confirm the version is unchanged
2. Run the setup checklist in [test-data.md](test-data.md)
3. Note the date/time in your execution log (resets can explain "missing data")

## Option B: Local install with Docker (stable, private) ✅ in use

**Needs:** Docker Desktop for Windows (with WSL 2). About 15 min the first time.
The setup lives in this repo: [`docker/docker-compose.yml`](../docker/docker-compose.yml) runs OrangeHRM **5.9** (pinned, same as the demo) + MariaDB 10.11.

### First-time setup
1. Create your local secrets file (git-ignored):
   ```powershell
   copy docker\.env.example docker\.env
   ```
   Replace every `change-me` value with your own test passwords. Never reuse a real password.
2. Start Docker Desktop, then from the repo root:
   ```powershell
   docker compose -f docker/docker-compose.yml --env-file docker/.env -p orangehrm up -d
   ```
3. Open http://localhost:8080 and complete the **installation wizard**:

   | Step | What to enter |
   |---|---|
   | Welcome | Fresh Installation |
   | License | Accept (GPL v3) |
   | Database | **Existing Empty Database** · Host `db` · Port `3306` · Name, user, password from `docker/.env` (`DB_NAME`, `DB_USER`, `DB_PASSWORD`) |
   | Instance | Organization `QA Portfolio` · Country · Language English (US) · your timezone |
   | Admin user | Name `QA Admin` · email `qa_admin@example.com` · username/password = `ADMIN_USERNAME` / `ADMIN_PASSWORD` · **untick** "Register your system" |
   | Install | Takes 1–3 min. **Keep the browser tab visible.** In a background tab it can stall at "99%" because the browser throttles it. |

4. Log in at http://localhost:8080 with the admin account.

### Daily use
| Task | Command (from repo root) |
|---|---|
| Start | `docker compose -f docker/docker-compose.yml --env-file docker/.env -p orangehrm up -d` |
| Stop (keeps data) | `docker compose -p orangehrm stop` |
| Status | `docker compose -p orangehrm ps` |
| Logs | `docker logs --tail 50 orangehrm-orangehrm-1` |
| **Wipe everything** and reinstall | `docker compose -p orangehrm down -v`, then repeat First-time setup |

Data persists in two Docker volumes: `orangehrm_db_data` (database) and `orangehrm_app_conf` (OrangeHRM's `Conf.php`, so the installer doesn't come back after a restart).

**Local-only tip:** a fresh install has **no sample employees**, so you create all data yourself (see [test-data.md](test-data.md)).
## Browser and tools
| Tool | Use |
|---|---|
| Chrome / Opera GX (record version) | Main test browser. Put it in the test case **Browsers** column |
| DevTools (F12) › Network | See API calls and error responses, useful evidence in bug reports |
| DevTools › Console | Catch JS errors to mention in defects |
| ShareX / Snipping Tool (Win+Shift+S) | Screenshots → `evidence/` |
| Xbox Game Bar (Win+G) / ShareX | Short screen recordings for tricky bugs |
| Jira (free) | Defect tracking, see [jira-setup.md](jira-setup.md) |
| VS Code: Markdown All in One, Rainbow CSV | Editing test case and defect tables |
| Google Sheets (optional) | Scratchpad during execution; copy results back to Markdown |
