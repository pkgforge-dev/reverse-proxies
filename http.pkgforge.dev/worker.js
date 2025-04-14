addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  try {
    // Parse the URL and extract the destination from the path
    const url = new URL(request.url);
    
    // Handle the special self-dns path (using domain name directly)
    if (url.pathname === '/help') {
      // Get the hostname from the request
      const hostname = new URL(request.url).hostname;
      
      // Show Endpoints
      const template = `
This is a reverse proxy that works over HTTP (also HTTPS) to proxy to HTTPS sites.
For example, if you are on an ancient system with no SSL and only bash,
you can use this to download a static curl binary & join the modern internet.

Simply append your URL to http://${hostname}/$URL
Example, http://${hostname}/https://example.com --> Requests example.com (HTTPS) --> Returns the Response Back
If you want to use the DNS or IP Address to access this proxy, then visit the endpoints below.
Each endpoint will print a template HTTP request (with bash /dev/tcp example).

If your client has DNS, visit: ${hostname}/self-dns
If your client has IPv4, visit: ${hostname}/self-ipv4 
If your client has IPv6, visit: ${hostname}/self-ipv6

Source Code: https://github.com/pkgforge-dev/reverse-proxies/tree/main/http.pkgforge.dev
Contact: https://docs.pkgforge.dev/contact/chat
Example where we use this to download soar: https://github.com/pkgforge/soar/blob/e4fcf895d5797045224276a34bc1caa3b7a08522/install.sh#L171

`;
      
      return new Response(template, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // Handle the special self-dns path (using domain name directly)
    if (url.pathname === '/self-dns') {
      // Get the hostname from the request
      const hostname = new URL(request.url).hostname;
      
      // Return a template with the domain name and usage examples
      const template = `
GET /$URL
HTTP/1.1
Host: ${hostname}
Connection: close

This is a template HTTP request & is meant only for clients that have DNS.
Replace $URL with your desired URL.
If your client has IPv4: http://${hostname}/self-ipv4 
If your client has IPv6: http://${hostname}/self-ipv6

#For example, to use https://example.com:
exec 3<>/dev/tcp/${hostname}/80
echo -e "GET /https://example.com HTTP/1.1\\r\\nHost: ${hostname}\\r\\nConnection: close\\r\\n\\r\\n" >&3
cat <&3

`;
      
      return new Response(template, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // Handle the special self-ipv4 path
    if (url.pathname === '/self-ipv4') {
      // Get the hostname from the request
      const hostname = new URL(request.url).hostname;
      
      // Make a request to Cloudflare DNS-over-HTTPS to get the IPv4 address
      const dnsResponse = await fetch(`https://cloudflare-dns.com/dns-query?name=${hostname}&type=A`, {
        headers: {
          'Accept': 'application/dns-json'
        }
      });
      
      const dnsData = await dnsResponse.json();
      let ipv4Address = "Unable to resolve IPv4 address";
      
      // Extract the IPv4 address from the response
      if (dnsData.Answer && dnsData.Answer.length > 0) {
        ipv4Address = dnsData.Answer[0].data;
      }
      
      // Return a template with the real IPv4 address
      const template = `
GET ${ipv4Address}/$URL
HTTP/1.1
Host: http.pkgforge.dev
Connection: close

This is a template HTTP request & is meant only for clients that have no DNS.
If your client already has DNS, then visit: http://${hostname}/self-dns
Replace $URL with your desired URL.

#For example, to use https://example.com:
exec 3<>/dev/tcp/${ipv4Address}/80
echo -e "GET /https://example.com HTTP/1.1\\r\\nHost: http.pkgforge.dev\\r\\nConnection: close\\r\\n\\r\\n" >&3
cat <&3

`;
      
      return new Response(template, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    
    // Handle the special self-ipv6 path
    if (url.pathname === '/self-ipv6') {
      // Get the hostname from the request
      const hostname = new URL(request.url).hostname;
      
      // Make a request to Cloudflare DNS-over-HTTPS to get the IPv6 address
      const dnsResponse = await fetch(`https://cloudflare-dns.com/dns-query?name=${hostname}&type=AAAA`, {
        headers: {
          'Accept': 'application/dns-json'
        }
      });
      
      const dnsData = await dnsResponse.json();
      let ipv6Address = "Unable to resolve IPv6 address";
      
      // Extract the IPv6 address from the response
      if (dnsData.Answer && dnsData.Answer.length > 0) {
        ipv6Address = dnsData.Answer[0].data;
      }
      
      // Return a template with the real IPv6 address
      const template = `
GET ${ipv6Address}/$URL
HTTP/1.1
Host: http.pkgforge.dev
Connection: close

This is a template HTTP request & is meant only for clients that have no DNS.
If your client already has DNS, then visit: http://${hostname}/self-dns
Replace $URL with your desired URL.

#For example, to use https://example.com:
exec 3<>/dev/tcp/${ipv6Address}/80
echo -e "GET /https://example.com HTTP/1.1\\r\\nHost: http.pkgforge.dev\\r\\nConnection: close\\r\\n\\r\\n" >&3
cat <&3

`;
      
      return new Response(template, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    
    // Skip the leading slash to get the destination URL
    if (!url.pathname || url.pathname === '/') {
      return new Response('Please provide a destination URL in the path. Example: http://http.pkgforge.dev/https://example.com\n', {
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
      return new Response('Invalid destination URL. Example: http://http.pkgforge.dev/https://example.com\n', {
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