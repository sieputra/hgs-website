# Deployment

## Production Stack

```text
Cloudflare
    |
NGINX Reverse Proxy
    |
    |-- Frontend Container
    |
    `-- Backend Container
           |
       PostgreSQL
           |
       Redis
```

## Required Admin Secrets

Production admin deployment must set:

- `ADMIN_AUTH_SECRET_KEY`: long random secret used to sign admin bearer tokens.
- `ADMIN_CLI_SECRET`: separate secret required by the admin bootstrap CLI.
- `ADMIN_ACCESS_TOKEN_MINUTES`: admin access-token lifetime, default `60`.

Do not deploy with the local default `ADMIN_AUTH_SECRET_KEY` value.
