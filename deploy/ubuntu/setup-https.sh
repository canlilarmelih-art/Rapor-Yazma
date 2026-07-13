#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${1:-}"
EMAIL="${2:-}"
APP_DIR="${APP_DIR:-/home/canlilar_melih/proje/files-mentioned-by-the-user-rapor/app}"

if [[ -z "$DOMAIN" || -z "$EMAIL" ]]; then
  echo "Kullanim: $0 rapor.ornek.com admin@ornek.com" >&2
  exit 2
fi

sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx

sudo install -d -m 755 /etc/nginx/sites-available /etc/nginx/sites-enabled
sed "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" "$APP_DIR/deploy/nginx/rapor-yazma.conf.template" \
  | sudo tee /etc/nginx/sites-available/rapor-yazma.conf >/dev/null
sudo ln -sfn /etc/nginx/sites-available/rapor-yazma.conf /etc/nginx/sites-enabled/rapor-yazma.conf
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable --now nginx
sudo systemctl reload nginx

sudo certbot --nginx --non-interactive --agree-tos --redirect \
  --email "$EMAIL" --domains "$DOMAIN"

echo "HTTPS proxy hazir. DNS kaydi bu sunucunun IP adresine yonelmelidir."
