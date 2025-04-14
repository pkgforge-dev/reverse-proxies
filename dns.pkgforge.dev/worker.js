export default {
    async fetch(request, env, ctx) {
      const url = new URL(request.url);
      const domain = url.pathname.slice(1); // e.g., /abcd.example.com
  
      const ipv4Only = ["1", "true"].includes(url.searchParams.get("ipv4"));
      const ipv6Only = ["1", "true"].includes(url.searchParams.get("ipv6"));
      const plainText = ["1", "true"].includes(url.searchParams.get("plain")) ||
                        ["1", "true"].includes(url.searchParams.get("text"));
      const raw = ["1", "true"].includes(url.searchParams.get("raw"));
      const limit = parseInt(url.searchParams.get("limit")) || 0;
      
      // Parse resolver preference
      const resolverParam = (url.searchParams.get("resolver") || "").toLowerCase();
      const forcedResolver = 
        ["google", "google.com"].includes(resolverParam) ? "google" : 
        ["cf", "cloudflare", "cloudflare.com"].includes(resolverParam) ? "cloudflare" : 
        null;
  
      if (!domain || !/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain)) {
        const error = "Invalid or missing domain";
        return new Response(plainText ? `Error: ${error}` : JSON.stringify({ error }), {
          status: 400,
          headers: { "Content-Type": plainText ? "text/plain" : "application/json" }
        });
      }
  
      // Raw mode: return raw DNS JSON response
      if (raw) {
        const types = [];
        if (!ipv6Only) types.push("A");
        if (!ipv4Only) types.push("AAAA");
        if (types.length === 0) types.push("A", "AAAA");
  
        const results = {};
        for (const type of types) {
          try {
            const dnsProvider = forcedResolver === "google" ? 
              `https://dns.google/resolve?name=${domain}&type=${type}` : 
              `https://cloudflare-dns.com/dns-query?name=${domain}&type=${type}`;
              
            const res = await fetch(dnsProvider, {
              headers: { "Accept": "application/dns-json" }
            });
            const data = await res.json();
            results[type] = data;
          } catch (e) {
            results[type] = { error: e.message };
          }
        }
  
        return new Response(JSON.stringify(results, null, 2), {
          headers: { "Content-Type": "application/json" }
        });
      }
  
      // Normal DNS resolution
      const doResolve = async (type) => {
        try {
          const records = await resolve(domain, type, forcedResolver);
          return records.length > 0 ? applyLimit(records, limit) : null;
        } catch {
          return null;
        }
      };
  
      const A = ipv6Only ? null : await doResolve("A");
      const AAAA = ipv4Only ? null : await doResolve("AAAA");
  
      // Plain text + only one type requested
      if (plainText && (ipv4Only !== ipv6Only)) {
        const data = ipv4Only ? A : AAAA;
        return new Response(data ? data.join("\n") : "", {
          headers: { "Content-Type": "text/plain" }
        });
      }
  
      // Plain text + full
      if (plainText) {
        let output = `Host: ${domain}\n`;
        output += `A: ${A ? A.join(", ") : "null"}\n`;
        output += `AAAA: ${AAAA ? AAAA.join(", ") : "null"}`;
        return new Response(output, {
          headers: { "Content-Type": "text/plain" }
        });
      }
  
      // JSON + minimal
      if (ipv4Only && !ipv6Only) {
        return new Response(JSON.stringify({ A }), {
          headers: { "Content-Type": "application/json" }
        });
      }
  
      if (ipv6Only && !ipv4Only) {
        return new Response(JSON.stringify({ AAAA }), {
          headers: { "Content-Type": "application/json" }
        });
      }
  
      // JSON + full
      return new Response(JSON.stringify({ Host: domain, A, AAAA }, null, 2), {
        headers: { "Content-Type": "application/json" }
      });
    }
  };
  
  async function resolve(name, type, forcedResolver) {
    // If a specific resolver is forced, use only that one
    if (forcedResolver === "google") {
      return await queryDNS(`https://dns.google/resolve?name=${name}&type=${type}`, type);
    } else if (forcedResolver === "cloudflare") {
      return await queryDNS(`https://cloudflare-dns.com/dns-query?name=${name}&type=${type}`, type);
    }
    
    // Otherwise try Cloudflare DNS first, then fallback to Google
    try {
      const records = await queryDNS(`https://cloudflare-dns.com/dns-query?name=${name}&type=${type}`, type);
      if (records.length > 0) {
        return records;
      }
    } catch (error) {
      console.error("Cloudflare DNS query failed:", error);
      // Continue to fallback
    }
    
    // Fallback to Google DNS
    try {
      return await queryDNS(`https://dns.google/resolve?name=${name}&type=${type}`, type);
    } catch (error) {
      console.error("Google DNS query failed:", error);
      throw new Error("All DNS queries failed");
    }
  }
  
  async function queryDNS(url, type) {
    const response = await fetch(url, {
      headers: { "Accept": "application/dns-json" }
    });
  
    if (!response.ok) throw new Error(`DNS query failed with status: ${response.status}`);
  
    const data = await response.json();
    return (data.Answer || [])
      .filter(record => record.type === (type === "A" ? 1 : 28))
      .map(record => record.data);
  }
  
  function applyLimit(records, limit) {
    if (limit > 0 && records.length > limit) {
      return records.slice(0, limit);
    }
    return records;
  }