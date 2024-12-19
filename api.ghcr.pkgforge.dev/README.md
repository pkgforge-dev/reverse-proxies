- #### Endpoints
> - Get All Tags
> ```bash
> #Example PACKAGE_PATH=pkgforge/bincache/curl/stunnel/curl (Just remove ghcr.io, and don't use tags)
> curl -qfsSL "https://api.ghcr.pkgforge.dev/${PACKAGE_PATH}?tags"
> ```
> 
> - Get Latest Tag
> ```bash
> curl -qfsSL "https://api.ghcr.pkgforge.dev/${PACKAGE_PATH}?tag"
> ```
> 
> - Filter Latest Tag with `query`
> ```bash
> #Example PATTERN=x86_64 (Will fetch the first tag that has x86_64 in it's name)
> curl -qfsSL "https://api.ghcr.pkgforge.dev/${PACKAGE_PATH}?tag&query=${PATTERN}"
> ```
>
> - Download Blob
> ```bash
> #By default, the last tag is used
> #FILENAME= name of file to download
> curl -qfsSL "https://api.ghcr.pkgforge.dev/${PACKAGE_PATH}?download=${FILENAME}"
> ```
>
> - Download Blob (Specific Tag)
> ```bash
> #Also supports a query="${PATTERN}" to match for the tag
> curl -qfsSL "https://api.ghcr.pkgforge.dev/${PACKAGE_PATH}?tag=${TAG}&download=${FILENAME}"
> ```
>
> - Download Blob (Specific File & Query/Tag)
> ```bash
> #Also supports a query="${PATTERN}" to match for the tag
> curl -qfsSL "https://api.ghcr.pkgforge.dev/${PACKAGE_PATH}?tag=${TAG}&download=${FILE}"
> ```
