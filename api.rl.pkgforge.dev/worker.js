// API: https://repology.org/api/v1
// RateLimits: https://github.com/repology/repology-updater/issues
// PLEASE if possible, SETUP YOUR OWN INSTANCE if you have to make lots of request
// Read: https://dumps.repology.org/README.txt

export default {
  async fetch(request) {
     // Allow Only WhiteListed User-Agents
     const userAgent = request.headers.get('User-Agent') || '';
     if (!userAgent.toLowerCase().includes('curl') && 
        !userAgent.toLowerCase().includes('pkgforge') && 
        !userAgent.toLowerCase().includes('soar') && 
        !userAgent.toLowerCase().includes('wget')) {
       // Fail silently, return 420
       return new Response(null, { status: 420 });
     }

    // Get the original request URL
    const url = new URL(request.url);

    url.hostname = 'repology.org';

    // Clone the request headers to ensure they are passed along
    const headers = new Headers(request.headers);
    // Change User-Agent
    // https://github.com/Azathothas/Wordlists/tree/main/Misc/User-Agents
    headers.set('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15');
  

    // Forward the request as-is
    const lastResponse = await fetch(url.toString(), {
      method: request.method,
      headers,
      body: request.body,
      redirect: request.redirect,
      referrer: request.referrer,
      referrerPolicy: request.referrerPolicy,
    });

    // Return the response directly
    const responseHeaders = new Headers(lastResponse.headers);
    return new Response(lastResponse.body, {
      status: lastResponse.status,
      statusText: lastResponse.statusText,
      headers: responseHeaders,
    });
  },
};
