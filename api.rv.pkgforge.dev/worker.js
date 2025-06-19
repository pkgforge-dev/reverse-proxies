export default {
  async fetch(request, env, ctx) {
    // Get the original request URL
    const originalUrl = new URL(request.url);
    
    // Get everything after the domain as the target URL
    const targetUrlPath = originalUrl.pathname.substring(1);
    
    // Ensure the target URL is properly formed
    if (!targetUrlPath) {
      return new Response('Invalid target URL', { status: 400 });
    }

    // https://github.com/pkgforge/devscripts/blob/main/Misc/User-Agents/ua_safari_macos_latest.txt
    const FIXED_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15';

    // Get the original User-Agent
    const originalUA = request.headers.get('user-agent') || '';
    const shouldChangeUA = originalUA.toLowerCase().includes('curl') ||
                          originalUA.toLowerCase().includes('wget') || 
                          originalUA.length < 10;

    // Gen Random IP 
    const generateRandomIP = () => {
      return `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
    };

    // Create a new Headers object
    const headers = new Headers();
    
    // Headers to remove (lowercase for comparison) - using Set for O(1) lookup
    const headersToRemove = new Set([
      // client 
      'x-forwarded-for',
      'x-forwarded-host',
      'x-forwarded-server',
      'x-real-ip',
      // cloudflare #doesn't actually work
      'cdn-loop',
      'cf-connecting-ip',
      'cf-ipcountry',
      'cf-ew-via',
      'cf-ew-preview-server',
      'cf-ray',
      'cf-visitor',
      'cf-worker'
    ]);
    
    // Copy headers, excluding the ones to remove (case-insensitive comparison)
    for (const [key, value] of request.headers.entries()) {
      const lowerKey = key.toLowerCase();
      if (!headersToRemove.has(lowerKey)) {
        if (lowerKey === 'cf-connecting-ip') {
          headers.set(key, generateRandomIP());
        } else if (lowerKey === 'user-agent' && shouldChangeUA) {
          headers.set(key, FIXED_USER_AGENT);
        } else {
          headers.set(key, value);
        }
      }
    }

    try {
      const response = await fetch(targetUrlPath, {
        method: request.method,
        headers,
        body: request.body,
        // Enable streaming and set reasonable timeout
        cf: {
          cacheTtl: 0, // Don't cache proxied responses
        }
      });

      // Create response headers, filtering out problematic ones
      const responseHeaders = new Headers();
      const skipResponseHeaders = new Set([
        'content-encoding', // Let Cloudflare handle compression
        'content-length',   // Will be set automatically for streamed responses
        'transfer-encoding' // Handled automatically
      ]);

      for (const [key, value] of response.headers.entries()) {
        if (!skipResponseHeaders.has(key.toLowerCase())) {
          responseHeaders.set(key, value);
        }
      }

      // Stream to client
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch (error) {
      return new Response('Error fetching URL: ' + error.message, { 
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  }
}
