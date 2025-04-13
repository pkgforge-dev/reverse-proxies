// SCOPE: public_repo
// Please Use CloudFlare's ENV Vars, instead of hardcoding your tokens
// Below, is for demo only
// Recommended to have at least 5 tokens

export default {
  async fetch(request, env, ctx) {
    // Retrieve tokens from environment variables
    const GITHUB_TOKENS = JSON.parse(env.GITHUB_TOKENS || '[]');

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
    const originalUrl = new URL(request.url);
    
    // Check if the path contains 'https://github.com/'
    const githubPrefix = 'https://github.com/';
    const pathAfterEndpoint = originalUrl.pathname.split('/').slice(2).join('/');
    
    let sanitizedPath;
    if (pathAfterEndpoint.startsWith(githubPrefix)) {
      // Strip the github.com prefix from the path
      sanitizedPath = pathAfterEndpoint.substring(githubPrefix.length);
      // Reconstruct the URL with the sanitized path
      const newPath = `${originalUrl.pathname.split('/')[1]}/${sanitizedPath}`;
      originalUrl.pathname = newPath;
    }

    // Normalize multiple slashes to single slash
    // First, handle the pathname
    originalUrl.pathname = originalUrl.pathname
      .replace(/\/+/g, '/') // Replace multiple slashes with single slash
      .replace(/\/{2,}/g, '/'); // Additional safety check for any remaining double slashes

    // Get the Final request URL
    const url = originalUrl;
    // List of allowed endpoints (as patterns)
    const allowedEndpoints = [
      /^\/$/,                 // Root
      /^\/search.*/,          // /search and sub-paths
      /^\/gists.*/,           // /gists and sub-paths
      /^\/orgs.*/,            // /gists and sub-paths
      /^\/rate_limit.*/,      // /rate_limit and sub-paths
      /^\/repos.*/,           // /repos and sub-paths
      /^\/users.*/,           // /users*
    ];

    const isAllowed = allowedEndpoints.some(pattern => pattern.test(url.pathname));
    if (!isAllowed) {
      // Fail silently, return 420
      return new Response(null, { status: 420 });
    }

    url.hostname = 'api.github.com';
    
    return await makeGitHubRequest(request, url, GITHUB_TOKENS);
  }
}

// Function to handle GitHub API requests with redirect handling
async function makeGitHubRequest(request, url, tokens, followedRedirects = 0, usedTokens = []) {
  // Clone the tokens array to track used tokens
  const availableTokens = tokens.filter(token => !usedTokens.includes(token));
  
  // Prevent infinite redirect loops
  const MAX_REDIRECTS = 5;
  if (followedRedirects >= MAX_REDIRECTS) {
    return new Response('Error: Too many redirects', { status: 508 });
  }
  
  // Headers to remove (case-insensitive)
  const headersToRemove = [
    'CF-CONNECTING-IP',
    'X-FORWARDED-FOR',
    'X-REAL-IP'
  ];
  
  let lastResponse = null;
  
  while (availableTokens.length > 0) {
    // Randomly select a token
    const randomIndex = Math.floor(Math.random() * availableTokens.length);
    const selectedToken = availableTokens[randomIndex];
    
    // Create a new Headers object and copy only the desired headers
    const headers = new Headers();
    
    // Copy original headers, excluding the specified ones
    for (const [key, value] of request.headers.entries()) {
      const isHeaderToRemove = headersToRemove.some(
        removeHeader => key.toLowerCase() === removeHeader.toLowerCase()
      );
      
      if (!isHeaderToRemove) {
        headers.set(key, value);
      }
    }
    
    // Set the Authorization header with the selected token
    headers.set('Authorization', `Bearer ${selectedToken}`);
    
    const fetchOptions = {
      method: request.method,
      headers,
      redirect: 'manual', // Important: handle redirects manually
      referrer: request.referrer,
      referrerPolicy: request.referrerPolicy,
    };
    
    // Only add body for methods that support it
    if (!['GET', 'HEAD'].includes(request.method)) {
      fetchOptions.body = request.body;
    }
    
    lastResponse = await fetch(url.toString(), fetchOptions);
    
    // Handle redirects (301, 302, 307, 308)
    if ([301, 302, 307, 308].includes(lastResponse.status)) {
      const locationHeader = lastResponse.headers.get('location');
      
      if (locationHeader && locationHeader.includes('api.github.com')) {
        // Follow the redirect ourselves
        const redirectUrl = new URL(locationHeader);
        
        // Update the tracking of used tokens
        const updatedUsedTokens = [...usedTokens, selectedToken];
        
        // Make a recursive call to follow the redirect
        return makeGitHubRequest(
          request, 
          redirectUrl, 
          tokens, 
          followedRedirects + 1,
          updatedUsedTokens
        );
      }
    }
    
    // If the response is not 401/403/429, return it, else keep trying
    if (![401, 403, 429].includes(lastResponse.status)) {
      const responseHeaders = new Headers(lastResponse.headers);
      return new Response(lastResponse.body, {
        status: lastResponse.status,
        statusText: lastResponse.statusText,
        headers: responseHeaders,
      });
    }
    
    // Mark this token as used for this request
    usedTokens.push(selectedToken);
    availableTokens.splice(randomIndex, 1);
  }
  
  // If all tokens are exhausted and still fail, return the last response
  return lastResponse || new Response('Error: All tokens exhausted', { status: 500 });
}