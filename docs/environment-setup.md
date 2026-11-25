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

## Option B: Local install with Docker (stable, private)

**Needs:** Docker Desktop for Windows (with WSL 2). About 15 min.

1. Create a folder outside this repo, e.g. `C:\Users\<you>\orangehrm-local`, and save this as `docker-compose.yml`:

```yaml
services:
  db:
    image: mariadb:10.11
    environment:
      MYSQL_ROOT_PASSWORD: rootpass
      MYSQL_DATABASE: orangehrm
      MYSQL_USER: orangehrm
      MYSQL_PASSWORD: orangehrm
    volumes:
      - db_data:/var/lib/mysql

  orangehrm:
    image: orangehrm/orangehrm:latest
    ports:
      - "8080:80"
    depends_on:
      - db

volumes:
  db_data:
```

2. Start it:
   ```powershell
   docker compose up -d
   ```
3. Open http://localhost:8080 and follow the **installation wizard**:
   - Database host: `db` · Database name: `orangehrm` · User/password: `orangehrm` / `orangehrm`
   - Create your own Admin account (local only)
4. Stop with `docker compose down`. Your data stays in the `db_data` volume. To wipe and start fresh: `docker compose down -v`.

> Check the image name, tags and any required environment variables against the official `orangehrm/orangehrm` page on Docker Hub. The setup may change between releases.

**Local-only tip:** a fresh install has **no sample employees**, so you'll create all data yourself (good practice, but more setup). The test-data checklist covers what you need.

## Browser and tools
| Tool | Use |
|---|---|
| Chrome / Opera GX (record version) | Main test browser. Put it in the test case **Browsers** column |
| DevTools (F12) › Network | See API calls and error responses, useful evidence in bug reports |
| DevTools › Console | Catch JS errors to mention in defects |
| ShareX / Snipping Tool (Win+Shift+S) | Screenshots → `evidence/` |
| Xbox Game Bar (Win+G) / ShareX | Short screen recordings for tricky bugs |
| Google Sheets | Test case sheet + defect log |
