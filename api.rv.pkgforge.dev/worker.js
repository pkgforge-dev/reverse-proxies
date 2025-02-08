export default {
     async fetch(request, env, ctx) {
       //Get the original request URL
       const originalUrl = new URL(request.url);
       
       //Get everything after the domain as the target URL
       const targetUrlPath = originalUrl.pathname.substring(1);
       
       //Ensure the target URL is properly formed
       if (!targetUrlPath) {
         return new Response('Invalid target URL', { status: 400 });
       }
   
      //https://github.com/Azathothas/Wordlists/blob/main/Misc/User-Agents/ua_safari_macos_latest.txt
       const FIXED_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Safari/605.1.15';
   
      //Get the original User-Agent
       const originalUA = request.headers.get('user-agent') || '';
       const shouldChangeUA = originalUA.toLowerCase().includes('curl') ||
                             originalUA.toLowerCase().includes('wget') || 
                             originalUA.length < 10;
   
   
       //Gen Random IP
       const generateRandomIP = () => {
         const generateNumber = () => Math.floor(Math.random() * 256);
         return `${generateNumber()}.${generateNumber()}.${generateNumber()}.${generateNumber()}`;
       };
   
       //Create a new Headers object
       const headers = new Headers();
       
       //Headers to remove (lowercase for comparison)
       const headersToRemove = new Set([
        //client 
         'x-forwarded-for',
         'x-forwarded-host',
         'x-forwarded-server',
         'x-real-ip',
        //cloudflare #doesn't actually work
         'cdn-loop',
         'cf-connecting-ip',
         'cf-ipcountry',
         'cf-ew-via',
         'cf-ew-preview-server',
         'cf-ray',
         'cf-visitor',
         'cf-worker'
       ]);
       
       //Copy headers, excluding the ones to remove (case-insensitive comparison)
       for (const [key, value] of request.headers.entries()) {
         if (!headersToRemove.has(key.toLowerCase())) {
           if (key.toLowerCase() === 'cf-connecting-ip') {
             headers.set(key, generateRandomIP());
           } else if (key.toLowerCase() === 'user-agent' && shouldChangeUA) {
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
         });
   
         return new Response(response.body, {
           status: response.status,
           statusText: response.statusText,
           headers: response.headers,
         });
       } catch (error) {
         return new Response('Error fetching URL: ' + error.message, { status: 500 });
       }
     }
   }
