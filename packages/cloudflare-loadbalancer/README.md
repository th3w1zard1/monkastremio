# AIOStreams Cloudflare Load Balancer

A Cloudflare Worker that load balances traffic across multiple AIOStreams backends, providing high availability and redundancy.

## Features

- **Load Balancing**: Routes traffic among three backend services:
  - `aiostreams-cf.example.com`
  - `aiostreams-koyeb.example.com`
  - `aiostreams.example.duckdns.org`

- **Sticky Sessions**: Maintains session affinity using cookies, ensuring users stay on the same backend throughout their session.

- **Health Checking**: Automatically detects backend failures and routes traffic away from unhealthy instances.

- **Automatic Failover**: If a backend is unresponsive or returns 5xx errors, requests are retried with another backend.

- **Consistent Hashing**: Uses client IP for consistent backend selection when no sticky session exists.

- **WebSocket Support**: Properly handles WebSocket connections, maintaining the upgrade flow.

- **HTTP-to-HTTPS Redirection**: Automatically redirects HTTP requests to HTTPS.

- **Header Preservation**: Maintains all request headers and adds proper proxy headers for backends.

## Configuration

The worker is configured via environment variables in `wrangler.toml`:

| Variable              | Description                                                        |
| --------------------- | ------------------------------------------------------------------ |
| `PRIMARY_DOMAIN`      | Domain name this worker is handling (e.g., aiostreams.example.com) |
| `BACKEND_CF`          | Hostname for Cloudflare backend                                    |
| `BACKEND_KOYEB`       | Hostname for Koyeb backend                                         |
| `BACKEND_DUCK`        | Hostname for DuckDNS backend                                       |
| `STICKY_SESSIONS`     | Enable/disable sticky sessions (true/false)                        |
| `SESSION_COOKIE_NAME` | Cookie name for session stickiness                                 |
| `SESSION_COOKIE_TTL`  | Session cookie time-to-live in seconds (default: 86400)            |
| `BACKEND_DOWN_TIME`   | How long to mark a backend as down after a failure (ms)            |
| `MAX_RETRIES`         | Maximum number of retry attempts                                   |

## Deployment

Deploy the worker to Cloudflare:

```bash
cd packages/cloudflare-loadbalancer
npm install
npm run deploy
```

## How It Works

1. When a request arrives at the worker (configured for the domain in `PRIMARY_DOMAIN`), the worker chooses a backend based on:
   - Existing session cookie (if sticky sessions enabled)
   - Client IP hash (for consistent backend selection)
   - Backend health status

2. The worker forwards the request to the selected backend, preserving all headers, query parameters, and request body.

3. If the backend fails or returns a 5xx error, the worker retries with another backend.

4. For sticky sessions, the worker sets a cookie to ensure subsequent requests from the same client go to the same backend.

## Fault Tolerance

- The worker maintains a temporary in-memory health status for each backend.
- Failed backends are marked as "down" for a configurable period.
- If all backends are down, the worker will reset all health statuses and try again.
- A maximum retry count prevents excessive attempts when all backends are failing.
