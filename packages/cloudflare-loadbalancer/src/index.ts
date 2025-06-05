export interface Env {
    // Environment variables
    BACKEND_CF: string;
    BACKEND_KOYEB: string;
    BACKEND_DUCK: string;
    STICKY_SESSIONS: boolean;
    SESSION_COOKIE_NAME: string;
    BACKEND_DOWN_TIME: string;
    MAX_RETRIES: string;
    // Optional duration for sticky session cookie in seconds (default: 1 day)
    SESSION_COOKIE_TTL?: string;
    // Primary domain that the worker is handling
    PRIMARY_DOMAIN: string;
}

// Store for tracking backend health status
interface HealthStatus {
    isDown: boolean;
    lastFailure: number;
}

// Health status for each backend
const backendHealth = new Map<string, HealthStatus>();

// Helper function to choose a backend
function chooseBackend(request: Request, env: Env): string {
    const backendOptions = [
        env.BACKEND_CF,
        env.BACKEND_KOYEB,
        env.BACKEND_DUCK
    ];

    // Filter out any backends that are marked as down
    const availableBackends = backendOptions.filter(backend => {
        const health = backendHealth.get(backend);
        if (!health) return true;

        if (health.isDown) {
            // Check if the backend has been down long enough to retry
            const downTime = parseInt(env.BACKEND_DOWN_TIME) || 30000;
            if (Date.now() - health.lastFailure > downTime) {
                // Reset the backend status
                backendHealth.set(backend, { isDown: false, lastFailure: 0 });
                return true;
            }
            return false;
        }

        return true;
    });

    // If no backends are available, reset all backends and try again
    if (availableBackends.length === 0) {
        backendOptions.forEach(backend => {
            backendHealth.set(backend, { isDown: false, lastFailure: 0 });
        });
        return backendOptions[0];
    }

    // Check for sticky session cookie if enabled
    if (env.STICKY_SESSIONS) {
        const cookies = request.headers.get('Cookie') || '';
        const cookieRegex = new RegExp(`${env.SESSION_COOKIE_NAME}=([^;]+)`);
        const match = cookies.match(cookieRegex);

        if (match && match[1]) {
            const preferredBackend = match[1];
            // Check if the preferred backend is available
            if (availableBackends.includes(preferredBackend)) {
                return preferredBackend;
            }
        }
    }

    // Use client IP for consistent hashing if no cookie or preferred backend is down
    const clientIP = request.headers.get('CF-Connecting-IP') ||
        request.headers.get('X-Real-IP') ||
        request.headers.get('X-Forwarded-For')?.split(',')[0].trim() ||
        'unknown';

    // Simple hash function for the client IP
    const hashCode = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    };

    const index = hashCode(clientIP) % availableBackends.length;
    return availableBackends[index];
}

// Mark a backend as down
function markBackendDown(backend: string, env: Env): void {
    backendHealth.set(backend, {
        isDown: true,
        lastFailure: Date.now()
    });

    console.error(`Backend ${backend} marked as down at ${new Date().toISOString()}`);
}

// Clone request with new URL
function createBackendRequest(request: Request, backend: string): Request {
    const url = new URL(request.url);
    const backendUrl = new URL(`https://${backend}`);

    // Preserve path and query parameters
    backendUrl.pathname = url.pathname;
    backendUrl.search = url.search;

    // Get original headers and create a new headers object
    const headers = new Headers(request.headers);

    // Set the host header to the backend hostname
    headers.set('Host', backend);

    // Add proxy headers
    headers.set('X-Forwarded-Host', url.hostname);
    headers.set('X-Forwarded-Proto', url.protocol.replace(':', ''));

    // Check if we need to handle WebSockets
    const upgradeHeader = request.headers.get('Upgrade');
    const isWebSocket = upgradeHeader !== null && upgradeHeader.toLowerCase() === 'websocket';

    // Clone the request with the new URL
    const newRequest = new Request(backendUrl.toString(), {
        method: request.method,
        headers: headers,
        body: request.body,
        redirect: 'manual', // Don't follow redirects automatically
        // If this is a WebSocket request, we need to preserve the upgrade header
        duplex: isWebSocket ? 'half' : undefined
    });

    return newRequest;
}

// Determine if we're in a development environment
function isDevelopment(): boolean {
    try {
        // Check if we're in a browser-like environment with location object
        // @ts-ignore - Cloudflare Workers have location in dev/preview but not in TypeScript defs
        return typeof globalThis.location === 'object' &&
            // @ts-ignore
            (globalThis.location.hostname === 'localhost' ||
                // @ts-ignore
                globalThis.location.hostname.includes('workers.dev') ||
                // @ts-ignore
                globalThis.location.hostname.includes('preview'));
    } catch (e) {
        return false;
    }
}

export default {
    async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
        const url = new URL(request.url);
        const isDevEnvironment = isDevelopment();

        // In production, only handle requests for the PRIMARY_DOMAIN
        // In development, handle all requests (to make testing easier)
        if (!isDevEnvironment && url.hostname !== env.PRIMARY_DOMAIN) {
            console.log(`Request for ${url.hostname} rejected (expected ${env.PRIMARY_DOMAIN})`);
            return new Response(`This worker is configured to handle requests for ${env.PRIMARY_DOMAIN} only`, {
                status: 404,
                headers: { 'Content-Type': 'text/plain' }
            });
        }

        // Redirect HTTP to HTTPS in production
        if (!isDevEnvironment && url.protocol === 'http:') {
            url.protocol = 'https:';
            return Response.redirect(url.toString(), 301);
        }

        // Check for WebSocket upgrade
        const upgradeHeader = request.headers.get('Upgrade');
        const isWebSocket = upgradeHeader !== null && upgradeHeader.toLowerCase() === 'websocket';

        // Try each backend until success or we run out of retries
        let backend = chooseBackend(request, env);
        let attempts = 0;
        const maxRetries = parseInt(env.MAX_RETRIES) || 3;

        // For WebSockets, we only try once per backend to avoid connection issues
        const effectiveMaxRetries = isWebSocket ? Math.min(maxRetries, 1) : maxRetries;

        console.log(`Routing request to ${backend} (attempt 1/${effectiveMaxRetries})`);

        while (attempts < effectiveMaxRetries) {
            attempts++;

            try {
                // Create a new request for the backend
                const backendRequest = createBackendRequest(request, backend);

                // Forward the request to the backend
                const response = await fetch(backendRequest);

                // If the response is a server error (5xx), mark the backend as down and try another
                if (response.status >= 500 && response.status < 600) {
                    console.error(`Backend ${backend} returned ${response.status}`);
                    markBackendDown(backend, env);

                    // Choose a different backend for the next attempt
                    if (attempts < effectiveMaxRetries) {
                        backend = chooseBackend(request, env);
                        console.log(`Retrying with ${backend} (attempt ${attempts + 1}/${effectiveMaxRetries})`);
                        continue;
                    }
                }

                // Clone the response so we can modify headers
                const clonedResponse = new Response(response.body, response);

                // If sticky sessions are enabled, set a cookie with the backend
                if (env.STICKY_SESSIONS) {
                    // Calculate cookie expiration
                    const ttl = parseInt(env.SESSION_COOKIE_TTL || '86400'); // Default to 1 day
                    const expires = new Date();
                    expires.setSeconds(expires.getSeconds() + ttl);

                    clonedResponse.headers.append('Set-Cookie',
                        `${env.SESSION_COOKIE_NAME}=${backend}; Path=/; HttpOnly; SameSite=Lax; Expires=${expires.toUTCString()}`);
                }

                // For WebSocket upgrade responses, make sure we preserve the Connection and Upgrade headers
                if (isWebSocket && response.status === 101) {
                    clonedResponse.headers.set('Connection', 'Upgrade');
                    clonedResponse.headers.set('Upgrade', 'websocket');
                }

                console.log(`Successfully routed to ${backend}, status: ${response.status}`);
                return clonedResponse;
            } catch (error) {
                console.error(`Error forwarding to ${backend}:`, error);
                markBackendDown(backend, env);

                // Choose a different backend for the next attempt
                if (attempts < effectiveMaxRetries) {
                    backend = chooseBackend(request, env);
                    console.log(`Retrying with ${backend} (attempt ${attempts + 1}/${effectiveMaxRetries})`);
                }
            }
        }

        // If we've exhausted all retries, return a 502 Bad Gateway
        return new Response('All backends are currently unavailable', {
            status: 502,
            headers: {
                'Content-Type': 'text/plain',
                'Retry-After': '30'
            }
        });
    }
}; 