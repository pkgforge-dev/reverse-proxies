// SCOPE: read_api
// Please Use CloudFlare's ENV Vars, instead of hardcoding your tokens
// Below, is for demo only
// Recommended to have at least 5 tokens

const GITLAB_TOKENS = ['glpat-abcdefghijklmnopq', 'glpat-abc123456789xyz'];

export default {
  async fetch(request) {
     // Allow Only WhiteListed User-Agents, This is to prevent bots from hammering the api for no reason
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

    // List of allowed endpoints (as patterns)
    const allowedEndpoints = [
      /^\/$/,                  // Root
      /^\/.*api.*project.*/,   // Project Api
      /^\/.*project.*/,        // Project URL
      /^\/.*registry.*/,       // Registry Api/URL
    ];

    const isAllowed = allowedEndpoints.some(pattern => pattern.test(url.pathname));
    if (!isAllowed) {
      // Fail silently, return 420
      return new Response(null, { status: 420 });
    }

    url.hostname = 'gitlab.com';

    let lastResponse = null;
    // Clone the tokens array to track used tokens
    const tokens = [...GITLAB_TOKENS]; 

    while (tokens.length > 0) {
      // Randomly select and remove a token
      const selectedToken = tokens.splice(Math.floor(Math.random() * tokens.length), 1)[0]; 

      const headers = new Headers(request.headers);
      headers.set('PRIVATE-TOKEN', `${selectedToken}`);

      lastResponse = await fetch(url.toString(), {
        method: request.method,
        headers,
        body: request.body,
        redirect: request.redirect,
        referrer: request.referrer,
        referrerPolicy: request.referrerPolicy,
      });

      // If the response is not 401/403/429, return it, else keep trying
      if (![401, 403, 429].includes(lastResponse.status)) {
        const responseHeaders = new Headers(lastResponse.headers);
        return new Response(lastResponse.body, {
          status: lastResponse.status,
          statusText: lastResponse.statusText,
          headers: responseHeaders,
        });
      }
    }

    // If all tokens are exhausted and still fail, return the last response
    return lastResponse || new Response('Error: All tokens exhausted', { status: 500 });
  },
};
