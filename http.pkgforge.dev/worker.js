addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  try {
    // Parse the URL and extract the destination from the path
    const url = new URL(request.url);
   
    // Skip the leading slash to get the destination URL
    if (!url.pathname || url.pathname === '/') {
      return new Response('Please provide a destination URL in the path. Example: http://http.pkgforge.dev/https://example.com', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
   
    // Extract the destination URL (everything after the first '/')
    const destUrl = url.pathname.substring(1);
   
    // Validate the destination URL
    try {
      new URL(destUrl);
    } catch (e) {
      return new Response('Invalid destination URL. Example: /https://example.com', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
   
    // Preserve the query parameters from the original request
    const fullDestUrl = destUrl + (url.search || '');
   
    // Create a new request object for the destination
    const requestInit = {
      method: request.method,
      redirect: 'follow', // Important: follow all redirects
      headers: new Headers(request.headers),
    };
   
    // Add body for POST, PUT, etc. requests
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      requestInit.body = await request.arrayBuffer();
    }
   
    // Remove some headers that might cause issues
    requestInit.headers.delete('host');
    requestInit.headers.delete('connection');
   
    // Make the request to the destination
    const response = await fetch(fullDestUrl, requestInit);
   
    // Return the response as-is without any modifications
    return response;
   
  } catch (err) {
    // For errors, return nothing
    return new Response('', {
      status: 404,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}
