#!/usr/bin/env bash
# One-time setup of a fresh Ubuntu 24.04 VPS for the Capital Lane website.
# Run as root:   bash server-setup.sh "<deploy public key>"
# Safe to run again; it only fills in what is missing.
#
# What it does:
#   - updates the system, turns on automatic security updates and a firewall
#   - adds 2 GB swap (the server has 2 GB RAM)
#   - installs Node.js 22, Nginx and Certbot (free HTTPS)
#   - creates a "deploy" user that GitHub Actions logs in as
#   - installs the site service (systemd), the Nginx site and deploy.sh
#
# After this: point DNS at the server, then run
#   certbot --nginx -d capitallanes.com -d www.capitallanes.com
set -euo pipefail

DEPLOY_PUBKEY="${1:-}"
DOMAIN="capitallanes.com"
APP_DIR="/var/www/capitallanes"
ENV_DIR="/etc/capitallanes"
SERVICE="capitallanes-web"

[ "$(id -u)" -eq 0 ] || { echo "Run this as root." >&2; exit 1; }

export DEBIAN_FRONTEND=noninteractive

echo "==> System updates"
apt-get update -y
apt-get upgrade -y
apt-get install -y curl ca-certificates gnupg ufw nginx certbot python3-certbot-nginx unattended-upgrades fail2ban
dpkg-reconfigure -f noninteractive unattended-upgrades

echo "==> Swap"
if ! swapon --show | grep -q '/swapfile'; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  sysctl -w vm.swappiness=10
  echo 'vm.swappiness=10' > /etc/sysctl.d/99-swappiness.conf
fi

echo "==> Node.js 22"
if ! command -v node >/dev/null || ! node -v | grep -q '^v22\.'; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
node -v

echo "==> Firewall"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo "==> deploy user"
id deploy >/dev/null 2>&1 || adduser --disabled-password --gecos "" deploy
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
touch /home/deploy/.ssh/authorized_keys
if [ -n "$DEPLOY_PUBKEY" ] && ! grep -qF "$DEPLOY_PUBKEY" /home/deploy/.ssh/authorized_keys; then
  echo "$DEPLOY_PUBKEY" >> /home/deploy/.ssh/authorized_keys
fi
chown deploy:deploy /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys

# deploy may only restart the site, nothing else.
cat > /etc/sudoers.d/capitallanes <<EOF
deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart $SERVICE, /usr/bin/systemctl is-active $SERVICE
EOF
chmod 440 /etc/sudoers.d/capitallanes
visudo -cf /etc/sudoers.d/capitallanes

echo "==> Folders and secrets file"
install -d -m 755 -o deploy -g deploy "$APP_DIR" "$APP_DIR/releases"
install -d -m 750 -o root -g deploy "$ENV_DIR"
if [ ! -f "$ENV_DIR/web.env" ]; then
  cat > "$ENV_DIR/web.env" <<'EOF'
# Secret keys for the website. Only root and the site can read this file.
# After editing: systemctl restart capitallanes-web
GOOGLE_MAPS_API_KEY=
ANTHROPIC_API_KEY=
EOF
fi
chown root:deploy "$ENV_DIR/web.env"
chmod 640 "$ENV_DIR/web.env"

echo "==> deploy.sh"
cat > "$APP_DIR/deploy.sh" <<'EOF'
#!/usr/bin/env bash
# Called by GitHub Actions: unpacks a new version, switches to it, keeps the last 5.
set -euo pipefail
RELEASE="$1"
APP_DIR=/var/www/capitallanes
TGZ="/tmp/site-$RELEASE.tgz"
DEST="$APP_DIR/releases/$RELEASE"
mkdir -p "$DEST"
tar -xzf "$TGZ" -C "$DEST"
rm -f "$TGZ"
PREVIOUS="$(readlink -f "$APP_DIR/current" || true)"
ln -sfn "$DEST" "$APP_DIR/current.new" && mv -Tf "$APP_DIR/current.new" "$APP_DIR/current"
sudo /usr/bin/systemctl restart capitallanes-web
for i in $(seq 1 30); do
  if curl -fsS -o /dev/null http://127.0.0.1:3000/; then
    echo "Live: $RELEASE"
    ls -1dt "$APP_DIR"/releases/* | tail -n +6 | xargs -r rm -rf
    exit 0
  fi
  sleep 1
done
echo "New version did not start; rolling back." >&2
if [ -n "$PREVIOUS" ] && [ -d "$PREVIOUS" ]; then
  ln -sfn "$PREVIOUS" "$APP_DIR/current.new" && mv -Tf "$APP_DIR/current.new" "$APP_DIR/current"
  sudo /usr/bin/systemctl restart capitallanes-web
fi
exit 1
EOF
chown deploy:deploy "$APP_DIR/deploy.sh"
chmod 755 "$APP_DIR/deploy.sh"

echo "==> systemd service"
cat > "/etc/systemd/system/$SERVICE.service" <<EOF
[Unit]
Description=Capital Lane website (Next.js)
After=network.target

[Service]
Type=simple
User=deploy
Group=deploy
WorkingDirectory=$APP_DIR/current/apps/web
ExecStart=/usr/bin/node server.js
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=HOSTNAME=127.0.0.1
Environment=NEXT_TELEMETRY_DISABLED=1
EnvironmentFile=$ENV_DIR/web.env
Restart=always
RestartSec=3
MemoryMax=900M
NoNewPrivileges=true
ProtectSystem=full
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable "$SERVICE"

echo "==> Nginx"
cat > /etc/nginx/conf.d/capitallanes-limits.conf <<'EOF'
# Slow down abuse of the paid APIs (Anthropic, Google).
limit_req_zone $binary_remote_addr zone=cl_ask:10m rate=6r/m;
limit_req_zone $binary_remote_addr zone=cl_places:10m rate=60r/m;
EOF

if [ ! -f "/etc/nginx/sites-available/$DOMAIN" ]; then
cat > "/etc/nginx/sites-available/$DOMAIN" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    client_max_body_size 1m;
    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;

    location /api/ask {
        limit_req zone=cl_ask burst=5 nodelay;
        include /etc/nginx/capitallanes-proxy.conf;
    }

    location /api/places/ {
        limit_req zone=cl_places burst=30 nodelay;
        include /etc/nginx/capitallanes-proxy.conf;
    }

    location /_next/static/ {
        alias $APP_DIR/current/apps/web/.next/static/;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }

    location / {
        include /etc/nginx/capitallanes-proxy.conf;
    }
}
EOF
fi

cat > /etc/nginx/capitallanes-proxy.conf <<'EOF'
proxy_pass http://127.0.0.1:3000;
proxy_http_version 1.1;
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
proxy_read_timeout 60s;
EOF

ln -sfn "/etc/nginx/sites-available/$DOMAIN" "/etc/nginx/sites-enabled/$DOMAIN"
rm -f /etc/nginx/sites-enabled/default
sed -i 's/^\s*#\?\s*server_tokens .*/\tserver_tokens off;/' /etc/nginx/nginx.conf
nginx -t
systemctl reload nginx

echo
echo "Done. Next:"
echo "  1. Put the API keys in $ENV_DIR/web.env"
echo "  2. Push to main on GitHub (the first deploy starts the site)"
echo "  3. When DNS points here: certbot --nginx -d $DOMAIN -d www.$DOMAIN --redirect"
