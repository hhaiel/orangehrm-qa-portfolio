#!/usr/bin/env bash
# Starts OrangeHRM in Docker and installs it WITHOUT the web wizard (for CI, or a clean local copy).
#
# Usage (from the repo root):
#   COMPOSE_PROJECT=orangehrm-ci bash docker/ci-install.sh
# Reads DB_* , ADMIN_USERNAME, ADMIN_PASSWORD and APP_PORT from docker/.env (or the environment).
#
# Uses OrangeHRM's bundled `installer/cli_install.php`, which reads every answer from a YAML file.
# It is marked deprecated in favour of the interactive `installer/console`, but it is still shipped
# in 5.9 and is the only fully unattended option (the console asks a hidden password prompt).
set -euo pipefail

cd "$(dirname "$0")/.."
ENV_FILE="${ENV_FILE:-docker/.env}"
PROJECT="${COMPOSE_PROJECT:-orangehrm-ci}"
# Strip a UTF-8 byte-order mark (Windows editors/PowerShell add one) before sourcing.
if [ -f "$ENV_FILE" ]; then set -a; source <(sed '1s/^\xEF\xBB\xBF//' "$ENV_FILE"); set +a; fi
: "${DB_NAME:?}" "${DB_USER:?}" "${DB_PASSWORD:?}" "${ADMIN_USERNAME:?}" "${ADMIN_PASSWORD:?}"
APP_PORT="${APP_PORT:-8080}"

compose() { docker compose -f docker/docker-compose.yml --env-file "$ENV_FILE" -p "$PROJECT" "$@"; }
in_app() { MSYS_NO_PATHCONV=1 compose exec -T orangehrm "$@"; }

echo "▶ Starting containers (project: $PROJECT, port: $APP_PORT)"
compose up -d --wait

echo "▶ Waiting for the web server"
for i in $(seq 1 60); do
  if curl -fs -o /dev/null "http://localhost:${APP_PORT}/"; then break; fi
  sleep 2
done

if in_app test -f /var/www/html/lib/confs/Conf.php; then
  echo "✔ Already installed, nothing to do"
  exit 0
fi

echo "▶ Writing installer answers"
in_app sh -c "cat > /var/www/html/installer/cli_install_config.yaml" <<YAML
database:
  hostName: db
  hostPort: 3306
  databaseName: ${DB_NAME}
  privilegedDatabaseUser: ${DB_USER}
  privilegedDatabasePassword: '${DB_PASSWORD}'
  useSameDbUserForOrangeHRM: y
  orangehrmDatabaseUser: ~
  orangehrmDatabasePassword: ~
  isExistingDatabase: y
  enableDataEncryption: n
organization:
  name: QA Portfolio
  country: US
admin:
  adminUserName: ${ADMIN_USERNAME}
  adminPassword: '${ADMIN_PASSWORD}'
  adminEmployeeFirstName: QA
  adminEmployeeLastName: Admin
  workEmail: qa_admin@example.com
  contactNumber: ~
  registrationConsent: false
license:
  agree: y
YAML

echo "▶ Installing OrangeHRM (takes 1–3 minutes)"
in_app sh -c "cd /var/www/html && php installer/cli_install.php"

# The answers file contains passwords; don't leave it in the container.
in_app rm -f /var/www/html/installer/cli_install_config.yaml

in_app test -f /var/www/html/lib/confs/Conf.php
echo "✔ OrangeHRM installed at http://localhost:${APP_PORT}"
