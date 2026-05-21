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
