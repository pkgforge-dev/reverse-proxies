- #### Simple DNS (A|AAAA) Lookup
> - Request [A (IPv4)](https://www.cloudflare.com/learning/dns/dns-records/dns-a-record/) | [AAAA (IPv6)](https://www.cloudflare.com/learning/dns/dns-records/dns-aaaa-record/) Records for any HOST/Domain
> - Think https://dns.google/, but usable with curl, doesn't need JQ & offers many endpoints for many use case
> - We use this to get IPv4/IPv6 for [http.pkgforge.dev](https://github.com/pkgforge-dev/reverse-proxies/tree/main/http.pkgforge.dev)

- #### [Simple/Default JSON](https://dns.pkgforge.dev/example.com)
```bash
#Returns both A/AAAA
curl -qfsSL "https://dns.pkgforge.dev/example.com"
```

- #### [Simple/Default Plain Text](https://dns.pkgforge.dev/example.com?plain=1)
```bash
#Returns both A/AAAA, also supports ?text=1, also supports true instead of 1
curl -qfsSL "https://dns.pkgforge.dev/example.com?plain=1"
```

- #### [RAW](https://dns.pkgforge.dev/example.com?raw=1)
```bash
#Returns Raw response
curl -qfsSL "https://dns.pkgforge.dev/example.com?raw=1"
```


- #### Only [A](https://dns.pkgforge.dev/example.com?ipv4=1&plain=1) | [AAAA](https://dns.pkgforge.dev/example.com?ipv6=1&plain=1)
```bash
#Returns only A in JSON (Default)
curl -qfsSL "https://dns.pkgforge.dev/example.com?ipv4=1"

#Returns only AAAA in JSON (Default)
curl -qfsSL "https://dns.pkgforge.dev/example.com?ipv6=1"

#Similarly, &plain=1 OR &text=1 can be added
curl -qfsSL "https://dns.pkgforge.dev/example.com?ipv4=1&plain=1"
curl -qfsSL "https://dns.pkgforge.dev/example.com?ipv6=1&plain=1"
```

- #### [Limit results by `N`](https://dns.pkgforge.dev/example.com?ipv4=1&plain=1&limit=1)
```bash
#Simply add &limit=N, to limit results
#For example, return only 1 IPv4 records in plain text
curl -qfsSL "https://dns.pkgforge.dev/example.com?ipv4=1&plain=1&limit=1"

#Another example, return only 2 IPv6 records in json (&plain was removed)
curl -qfsSL "https://dns.pkgforge.dev/example.com?ipv6=1&limit=2"
```

- #### Force use [Google DNS](https://developers.google.com/speed/public-dns/docs/doh) as Provider ([Default Cloudflare DOH](https://developers.cloudflare.com/1.1.1.1/encryption/dns-over-https/make-api-requests/))
```bash
#Simply add &resolver=google, to use google DNS
#Example to use Google DOH & return raw response
curl -qfsSL "https://dns.pkgforge.dev/example.com?resolver=google&raw=1"
```
