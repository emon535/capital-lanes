# Deploying capitallanes.co.uk

```
git push (main) ──► GitHub Actions: wording check, tests, type check, build
                    └─► copies the built site to the VPS over SSH
                         └─► deploy.sh unpacks it, restarts the service,
                             checks it answers, rolls back if not
VPS (Ubuntu 24.04): Nginx (HTTPS, Let's Encrypt) ──► Node 22 on 127.0.0.1:3000 (systemd)
```

Nothing is built on the server. Each release lives in `/var/www/capitallanes/releases/<time>-<commit>`,
`current` points at the live one, and the last 5 are kept.

## Where the secrets live

| Secret | Where | Never in |
|---|---|---|
| Google Maps key, Anthropic key | `/etc/capitallanes/web.env` on the server (root + site only) | git, GitHub |
| Deploy SSH private key | GitHub repo secret `DEPLOY_SSH_KEY` | git |
| Server IP | GitHub repo secret `DEPLOY_HOST` | |

Local development keeps using `apps/web/.env.local`, which is gitignored.

## First-time server setup

1. As root on the server: `bash infra/server-setup.sh "<deploy public key>"`
2. Put the keys in `/etc/capitallanes/web.env`.
3. Add `DEPLOY_HOST` and `DEPLOY_SSH_KEY` to the GitHub repo secrets, then push to `main`
   (or run the workflow from the Actions tab).
4. DNS at Namecheap: A records `@` and `www` → server IP.
5. Once DNS works: `certbot --nginx -d capitallanes.co.uk -d www.capitallanes.co.uk --redirect`
   (renews by itself).

## Everyday

- Deploy: push to `main`. Watch it under the repo's **Actions** tab.
- Logs: `journalctl -u capitallanes-web -f`
- Restart: `systemctl restart capitallanes-web`
- Change a key: edit `/etc/capitallanes/web.env`, then restart.
- Roll back by hand: `ln -sfn /var/www/capitallanes/releases/<older> /var/www/capitallanes/current && systemctl restart capitallanes-web`
