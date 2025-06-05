import { AIOStreams, errorResponse, validateConfig } from '@aiostreams/addon';
import manifest from '@aiostreams/addon/src/manifest';
import { Config, StreamRequest } from '@aiostreams/types';
import { unminifyConfig } from '@aiostreams/utils';

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
};

const PROXY_URL = 'https://warp-proxy.bolabaden.org';

// Proxy utility function
async function fetchWithProxy(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    // Convert input to string URL
    const targetUrl = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    // First, try to use the proxy
    const proxyUrl = `${PROXY_URL}/fetch?url=${encodeURIComponent(targetUrl)}`;
    const proxyResponse = await fetch(proxyUrl, {
      ...init,
      // Add API key and other headers
      headers: {
        ...init?.headers,
        'User-Agent': 'AIOStreams-CloudflareWorker/1.0',
        'X-API-Key': 'sk_IQys9kpENSiYY8lFuCslok3PauKBRSzeGprmvPfiMWAM9neeXoSqCZW7pMlWKbqPrwtF33kh1F73vf7D4PBpVfZJ1reHEL8d6ny6J03Ho',
      },
    });

    // If proxy responds successfully, return the response
    if (proxyResponse.ok) {
      return proxyResponse;
    }

    // If proxy fails, fall back to direct request
    console.warn(`Proxy failed with status ${proxyResponse.status}, falling back to direct request`);
    return await fetch(input, init);
  } catch (error) {
    // If proxy is completely unreachable, fall back to direct request
    console.warn('Proxy unreachable, falling back to direct request:', error);
    return await fetch(input, init);
  }
}

function createJsonResponse(data: any): Response {
  return new Response(JSON.stringify(data, null, 4), {
    headers: HEADERS,
  });
}

function createResponse(message: string, status: number): Response {
  return new Response(message, {
    status,
    headers: HEADERS,
  });
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    try {
      const url = new URL(decodeURIComponent(request.url));
      const components = url.pathname.split('/').splice(1);

      // handle static asset requests
      if (components.includes('_next') || components.includes('assets')) {
        return env.ASSETS.fetch(request);
      }

      if (url.pathname === '/icon.ico') {
        return env.ASSETS.fetch(request);
      }

      // redirect to /configure if root path is requested
      if (url.pathname === '/') {
        return Response.redirect(url.origin + '/configure', 301);
      }

      // handle /encrypt-user-data POST requests
      if (components.includes('encrypt-user-data')) {
        const data = (await request.json()) as { data: string };
        if (!data) {
          return createResponse('Invalid Request', 400);
        }
        const dataToEncode = data.data;
        try {
          console.log(
            `Received /encrypt-user-data request with Data: ${dataToEncode}`
          );
          const encodedData = Buffer.from(dataToEncode).toString('base64');
          return createJsonResponse({ data: encodedData, success: true });
        } catch (error: any) {
          console.error(error);
          return createJsonResponse({ error: error.message, success: false });
        }
      }
      // handle /configure and /:config/configure requests
      if (components.includes('configure')) {
        if (components.length === 1) {
          return env.ASSETS.fetch(request);
        } else {
          // display configure page with config still in url
          return env.ASSETS.fetch(
            new Request(url.origin + '/configure', request)
          );
        }
      }

      // handle /manifest.json and /:config/manifest.json requests
      if (components.includes('manifest.json')) {
        if (components.length === 1) {
          return createJsonResponse(manifest());
        } else {
          return createJsonResponse(manifest(undefined, true));
        }
      }

      if (components.includes('stream')) {
        // when /stream is requested without config
        let config = decodeURIComponent(components[0]);
        console.log(`components: ${components}`);
        if (components.length < 4) {
          return createJsonResponse(
            errorResponse(
              'You must configure this addon first',
              url.origin,
              '/configure'
            )
          );
        }
        console.log(`Received /stream request with Config: ${config}`);
        const decodedPath = decodeURIComponent(url.pathname);

        const streamMatch = /stream\/(movie|series)\/([^/]+)\.json/.exec(
          decodedPath
        );
        if (!streamMatch) {
          let path = decodedPath.replace(`/${config}`, '');
          console.error(`Invalid request: ${path}`);
          return createResponse('Invalid request', 400);
        }

        const [type, id] = streamMatch.slice(1);
        console.log(`Received /stream request with Type: ${type}, ID: ${id}`);

        let decodedConfig: Config;

        if (config.startsWith('E-') || config.startsWith('E2-')) {
          return createResponse('Encrypted Config Not Supported', 400);
        }
        try {
          decodedConfig = unminifyConfig(
            JSON.parse(Buffer.from(config, 'base64').toString('utf-8'))
          );
        } catch (error: any) {
          console.error(error);
          return createJsonResponse(
            errorResponse(
              'Unable to parse config, please reconfigure or create an issue on GitHub',
              url.origin,
              '/configure'
            )
          );
        }
        const { valid, errorMessage, errorCode } =
          validateConfig(decodedConfig);
        if (!valid) {
          console.error(`Invalid config: ${errorMessage}`);
          return createJsonResponse(
            errorResponse(errorMessage ?? 'Unknown', url.origin, '/configure')
          );
        }

        if (type !== 'movie' && type !== 'series') {
          return createResponse('Invalid Request', 400);
        }

        let streamRequest: StreamRequest = { id, type };

        decodedConfig.requestingIp =
          request.headers.get('X-Forwarded-For') ||
          request.headers.get('X-Real-IP') ||
          request.headers.get('CF-Connecting-IP') ||
          request.headers.get('X-Client-IP') ||
          undefined;

        // Temporarily replace global fetch with proxy-enabled fetch for AIOStreams
        const originalFetch = globalThis.fetch;
        globalThis.fetch = fetchWithProxy;

        try {
          const aioStreams = new AIOStreams(decodedConfig);
          const streams = await aioStreams.getStreams(streamRequest);
          return createJsonResponse({ streams });
        } finally {
          // Restore original fetch
          globalThis.fetch = originalFetch;
        }
      }

      const notFound = await env.ASSETS.fetch(
        new Request(url.origin + '/404', request)
      );
      return new Response(notFound.body, { ...notFound, status: 404 });
    } catch (e) {
      console.error(e);
      return new Response('Internal Server Error', {
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }
  },
} satisfies ExportedHandler<Env>;
