const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

// Handle GET requests to /fetch?url=... (for Cloudflare Worker)
app.get('/fetch', async (req, res) => {
    try {
        const { url, method = 'GET' } = req.query;

        if (!url) {
            return res.status(400).json({ error: 'URL parameter is required' });
        }

        console.log(`GET /fetch - Proxying request to: ${url}`);

        const response = await fetch(url, {
            method: method.toUpperCase(),
            headers: {
                'User-Agent': 'AIOStreams-Proxy/1.0',
                'Accept': '*/*',
            },
        });

        const data = await response.text();

        // Forward the status code and content
        res.status(response.status);

        // Forward important headers
        const contentType = response.headers.get('content-type');
        if (contentType) {
            res.set('Content-Type', contentType);
        }

        res.send(data);
    } catch (error) {
        console.error('GET Proxy error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Handle POST requests to / (existing functionality)
app.post('/', async (req, res) => {
    try {
        const { url, method = 'GET', headers = {}, body } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required in request body' });
        }

        console.log(`POST / - Proxying request to: ${url}`);

        const response = await fetch(url, {
            method,
            headers: {
                'User-Agent': 'AIOStreams-Proxy/1.0',
                ...headers,
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        const data = await response.text();

        res.status(response.status).send(data);
    } catch (error) {
        console.error('POST Proxy error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint with usage info
app.get('/', (req, res) => {
    res.json({
        message: 'AIOStreams Fetch Proxy',
        endpoints: {
            'GET /fetch?url=<url>': 'Proxy a GET request to the specified URL',
            'POST /': 'Proxy a request with full control (url, method, headers, body in JSON)',
            'GET /health': 'Health check'
        },
        examples: {
            get: '/fetch?url=https://example.com',
            post: 'POST / with {"url": "https://example.com", "method": "GET"}'
        }
    });
});

const PORT = process.env.PORT || 3128;
app.listen(PORT, () => {
    console.log(`Fetch proxy running on port ${PORT}`);
    console.log(`Endpoints:`);
    console.log(`  GET /fetch?url=<url> - Simple proxy for GET requests`);
    console.log(`  POST / - Full proxy with method/headers/body control`);
    console.log(`  GET /health - Health check`);
}); 