/**
 * This is a simple test script that can be run locally using wrangler dev.
 * It simulates the behavior of the load balancer by mocking backend responses.
 */

import { Env } from './index';

// Mock fetch responses for each backend
const mockResponses = new Map<string, Response>();

// Helper to register a mock response for a backend
function mockBackendResponse(backend: string, status: number, body: string): void {
    mockResponses.set(backend, new Response(body, { status }));
}

// Overrides the global fetch for testing
// @ts-ignore
globalThis.fetch = async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    const hostname = url.hostname;

    if (mockResponses.has(hostname)) {
        return mockResponses.get(hostname)!;
    }

    return new Response(`Unmocked backend: ${hostname}`, { status: 404 });
};

// Mock the location object for development detection
// @ts-ignore
globalThis.location = {
    hostname: 'localhost:8787',
    protocol: 'http:'
};

// Test scenarios
async function runTests() {
    // Set up mock environment
    const env: Env = {
        PRIMARY_DOMAIN: 'aiostreams.example.com',
        BACKEND_CF: 'aiostreams-cf.example.com',
        BACKEND_KOYEB: 'aiostreams-koyeb.example.com',
        BACKEND_DUCK: 'aiostreams.example.duckdns.org',
        STICKY_SESSIONS: true,
        SESSION_COOKIE_NAME: 'aiostreams_backend',
        SESSION_COOKIE_TTL: '86400',
        BACKEND_DOWN_TIME: '30000',
        MAX_RETRIES: '3'
    };

    console.log('=== AIOStreams Load Balancer Tests ===');

    // Test 1: All backends healthy
    console.log('\nTest 1: All backends healthy');
    mockBackendResponse(env.BACKEND_CF, 200, 'Response from CF');
    mockBackendResponse(env.BACKEND_KOYEB, 200, 'Response from Koyeb');
    mockBackendResponse(env.BACKEND_DUCK, 200, 'Response from DuckDNS');

    // Simulate a request
    const request1 = new Request(`https://${env.PRIMARY_DOMAIN}/test`);
    // @ts-ignore - Import the actual handler from index.ts
    const response1 = await require('./index').default.fetch(request1, env, {});

    console.log(`Status: ${response1.status}`);
    console.log(`Body: ${await response1.text()}`);
    console.log(`Cookie: ${response1.headers.get('Set-Cookie')}`);

    // Test 2: One backend down
    console.log('\nTest 2: One backend down (Cloudflare)');
    mockBackendResponse(env.BACKEND_CF, 503, 'Service Unavailable');

    const request2 = new Request(`https://${env.PRIMARY_DOMAIN}/test`);
    // @ts-ignore - Import the actual handler from index.ts
    const response2 = await require('./index').default.fetch(request2, env, {});

    console.log(`Status: ${response2.status}`);
    console.log(`Body: ${await response2.text()}`);

    // Test 3: Sticky session
    console.log('\nTest 3: Sticky session (should use Koyeb)');
    const request3 = new Request(`https://${env.PRIMARY_DOMAIN}/test`, {
        headers: {
            'Cookie': `${env.SESSION_COOKIE_NAME}=${env.BACKEND_KOYEB}`
        }
    });

    // @ts-ignore - Import the actual handler from index.ts
    const response3 = await require('./index').default.fetch(request3, env, {});

    console.log(`Status: ${response3.status}`);
    console.log(`Body: ${await response3.text()}`);

    // Test 4: All backends down
    console.log('\nTest 4: All backends down');
    mockBackendResponse(env.BACKEND_CF, 503, 'Service Unavailable');
    mockBackendResponse(env.BACKEND_KOYEB, 502, 'Bad Gateway');
    mockBackendResponse(env.BACKEND_DUCK, 500, 'Internal Server Error');

    const request4 = new Request(`https://${env.PRIMARY_DOMAIN}/test`);
    // @ts-ignore - Import the actual handler from index.ts
    const response4 = await require('./index').default.fetch(request4, env, {});

    console.log(`Status: ${response4.status}`);
    console.log(`Body: ${await response4.text()}`);

    // Test 5: HTTP to HTTPS redirect
    console.log('\nTest 5: HTTP to HTTPS redirect');
    const request5 = new Request(`http://${env.PRIMARY_DOMAIN}/test`);
    // @ts-ignore - Import the actual handler from index.ts
    const response5 = await require('./index').default.fetch(request5, env, {});

    console.log(`Status: ${response5.status}`);
    console.log(`Location: ${response5.headers.get('Location')}`);

    // Test 6: WebSocket handling
    console.log('\nTest 6: WebSocket handling');
    mockBackendResponse(env.BACKEND_CF, 101, ''); // WebSocket upgrade response

    const webSocketHeaders = new Headers();
    webSocketHeaders.set('Upgrade', 'websocket');
    webSocketHeaders.set('Connection', 'Upgrade');

    const request6 = new Request(`https://${env.PRIMARY_DOMAIN}/ws`, {
        headers: webSocketHeaders
    });

    // @ts-ignore - Import the actual handler from index.ts
    const response6 = await require('./index').default.fetch(request6, env, {});

    console.log(`Status: ${response6.status}`);
    console.log(`Upgrade header: ${response6.headers.get('Upgrade')}`);
    console.log(`Connection header: ${response6.headers.get('Connection')}`);

    // Test 7: Wrong hostname (should be ignored in dev environment)
    console.log('\nTest 7: Wrong hostname (should be handled in dev)');
    const request7 = new Request('https://wrong-hostname.example.com/test');
    // @ts-ignore - Import the actual handler from index.ts
    const response7 = await require('./index').default.fetch(request7, env, {});

    console.log(`Status: ${response7.status}`);
    console.log(`Body: ${await response7.text().then((body: string) => body.substring(0, 50) + '...')}`);

    console.log('\n=== Tests Complete ===');
}

// Run the tests
runTests().catch(error => {
    console.error('Test error:', error);
}); 