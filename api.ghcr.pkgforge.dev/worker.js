export default {
  async fetch(request) {

    // Allow Only WhiteListed User-Agents
    //const userAgent = request.headers.get('User-Agent') || '';
    //if (!userAgent.toLowerCase().includes('curl') &&
    //  !userAgent.toLowerCase().includes('dbin') &&
    //  !userAgent.toLowerCase().includes('pkgforge') &&
    //  !userAgent.toLowerCase().includes('soar') &&
    //  !userAgent.toLowerCase().includes('wget')) {
    //  // Fail silently, return 420
    //  return new Response(null, {
    //    status: 420
    //  });
    //}

    // Get the original request URL
    const url = new URL(request.url);
    if (!url.toString().toLowerCase().includes('github') &&
       !url.toString().toLowerCase().includes('homebrew') &&
       !url.toString().toLowerCase().includes('pkgforge')) {
      // Fail silently, return 420
      return new Response(null, {
        status: 420
      });
    }
    // Headers to remove (case-insensitive)
    const headersToRemove = [
      'CF-CONNECTING-IP',
      'X-FORWARDED-FOR',
      'X-REAL-IP'
    ];

    // Extract parameters from the URL
    const searchParams = new URLSearchParams(url.search.slice(1));
    const download = searchParams.get("download");
    const manifest = searchParams.get("manifest");
    const query = searchParams.get("query");
    const tag = searchParams.get("tag");
    const tags = searchParams.get("tags");

    // Extract ghcr path from the pathname, removing any leading/trailing slashes
    const pathParts = url.pathname.split('/').filter(Boolean);
    const ghcr = pathParts.join('/');

    // Check for download request (modified to be more flexible)
    if (download !== null) {
      let effectiveTag = tag;

      // If tag is missing and query is present, derive tag using query
      if (!effectiveTag && query) {
        const tagsUrl = `https://ghcr.io/v2/${ghcr}/tags/list`;
        const tagsHeaders = new Headers();
        for (const [key, value] of request.headers.entries()) {
          const isHeaderToRemove = headersToRemove.some(
            removeHeader => key.toLowerCase() === removeHeader.toLowerCase()
          );
          if (!isHeaderToRemove) {
            tagsHeaders.set(key, value);
          }
        }
        tagsHeaders.set("Authorization", "Bearer QQ==");

        try {
          const tagsResponse = await fetch(tagsUrl, {
            headers: tagsHeaders,
          });
          if (!tagsResponse.ok) {
            return new Response(`Error fetching tags: ${tagsResponse.statusText}\n`, {
              status: tagsResponse.status,
            });
          }

          const tagsData = await tagsResponse.json();
          const tagsList = tagsData.tags || [];
          const queryLower = query.toLowerCase();
          const matchingTag = tagsList.find(tag =>
            tag.toLowerCase().includes(queryLower)
          );

          if (matchingTag) {
            effectiveTag = matchingTag;
          } else {
            return new Response("No matching tag found for the specified query.\n", {
              status: 404,
            });
          }
        } catch (error) {
          return new Response(`Error fetching tags: ${error.message}\n`, {
            status: 500,
          });
        }
      }

      // Fallback to the first available tag if neither tag nor query is provided
      if (!effectiveTag) {
        const tagsUrl = `https://ghcr.io/v2/${ghcr}/tags/list`;
        const tagsHeaders = new Headers();
        for (const [key, value] of request.headers.entries()) {
          const isHeaderToRemove = headersToRemove.some(
            removeHeader => key.toLowerCase() === removeHeader.toLowerCase()
          );
          if (!isHeaderToRemove) {
            tagsHeaders.set(key, value);
          }
        }
        tagsHeaders.set("Authorization", "Bearer QQ==");

        try {
          const tagsResponse = await fetch(tagsUrl, {
            headers: tagsHeaders,
          });
          if (!tagsResponse.ok) {
            return new Response(`Error fetching tags: ${tagsResponse.statusText}\n`, {
              status: tagsResponse.status,
            });
          }

          const tagsData = await tagsResponse.json();
          const tagsList = tagsData.tags || [];

          if (tagsList.length > 0) {
            effectiveTag = tagsList[tagsList.length - 1]; // Use the last available tag
          } else {
            return new Response("No tags available to use as a fallback.\n", {
              status: 404,
            });
          }
        } catch (error) {
          return new Response(`Error fetching tags: ${error.message}\n`, {
            status: 500,
          });
        }
      }

      // If no tag is still found (shouldn't happen), return an error
      if (!effectiveTag) {
        return new Response("Missing required parameter: tag\n", {
          status: 400,
        });
      }

      // Use the effectiveTag (either directly provided, derived from query, or the first tag)
      const manifestUrl = `https://ghcr.io/v2/${ghcr}/manifests/${effectiveTag}`;
      const manifestHeaders = new Headers();
      for (const [key, value] of request.headers.entries()) {
        const isHeaderToRemove = headersToRemove.some(
          removeHeader => key.toLowerCase() === removeHeader.toLowerCase()
        );
        if (!isHeaderToRemove) {
          manifestHeaders.set(key, value);
        }
      }
      manifestHeaders.set("Authorization", "Bearer QQ==");
      manifestHeaders.set(
        "Accept",
        "application/vnd.docker.distribution.manifest.v2+json, application/vnd.docker.distribution.manifest.list.v2+json, application/vnd.oci.image.manifest.v1+json, application/vnd.oci.image.index.v1+json, application/vnd.oci.artifact.manifest.v1+json"
      );

      try {
        const manifestResponse = await fetch(manifestUrl, {
          headers: manifestHeaders,
        });
        if (!manifestResponse.ok) {
          return new Response(`Error fetching manifest: ${manifestResponse.statusText}\n`, {
            status: manifestResponse.status,
          });
        }

        const manifestData = await manifestResponse.json();
        const fileLayer = manifestData.layers.find(layer =>
          layer.annotations && layer.annotations["org.opencontainers.image.title"] === download
        );

        if (!fileLayer) {
          return new Response(`File ${download} not found in manifest\n`, {
            status: 404,
          });
        }

        const blobUrl = `https://ghcr.io/v2/${ghcr}/blobs/${fileLayer.digest}`;
        const blobHeaders = new Headers();
        for (const [key, value] of request.headers.entries()) {
          const isHeaderToRemove = headersToRemove.some(
            removeHeader => key.toLowerCase() === removeHeader.toLowerCase()
          );
          if (!isHeaderToRemove) {
            blobHeaders.set(key, value);
          }
        }
        blobHeaders.set("Authorization", "Bearer QQ==");

        const blobResponse = await fetch(blobUrl, {
          headers: blobHeaders,
        });
        if (!blobResponse.ok) {
          return new Response(`Error fetching blob: ${blobResponse.statusText}\n`, {
            status: blobResponse.status,
          });
        }

        if (download) {
          const lowerDownload = download.toLowerCase();
          const contentType = lowerDownload.endsWith('.json')
            ? 'application/json; charset=utf-8'
            : lowerDownload.endsWith('.log')
            ? 'text/plain; charset=utf-8'
            : lowerDownload.endsWith('.png')
            ? 'image/png'
            : lowerDownload.endsWith('.svg')
            ? 'image/svg+xml'
            : lowerDownload.endsWith('.xml')
            ? 'application/xml; charset=utf-8'
            : null;
        
          return new Response(await blobResponse.blob(), {
            headers: {
              'Content-Type': contentType || 'application/octet-stream'
            }
          });
        }

        return blobResponse;
      } catch (error) {
        return new Response(`Error: ${error.message}\n`, {
          status: 500,
        });
      }
    }

    // Check if manifest is requested via route or query param
    if (url.pathname.includes('/manifest') || manifest === "true" || manifest === '') {
      // Require tag query parameter
      if (!tag) {
        return new Response("Missing required parameter: tag\n", {
          status: 400,
        });
      }
      // Construct the URL for the manifest request
      const targetUrl = `https://ghcr.io/v2/${ghcr}/manifests/${tag}`;
      // Set the required headers
      const headers = new Headers();
      for (const [key, value] of request.headers.entries()) {
        const isHeaderToRemove = headersToRemove.some(
          removeHeader => key.toLowerCase() === removeHeader.toLowerCase()
        );
        if (!isHeaderToRemove) {
          headers.set(key, value);
        }
      }
      headers.set("Authorization", "Bearer QQ==");
      headers.set(
        "Accept",
        "application/vnd.docker.distribution.manifest.v2+json, application/vnd.docker.distribution.manifest.list.v2+json, application/vnd.oci.image.manifest.v1+json, application/vnd.oci.image.index.v1+json, application/vnd.oci.artifact.manifest.v1+json"
      );
      try {
        // Make the fetch request
        const response = await fetch(targetUrl, {
          headers
        });
        if (!response.ok) {
          return new Response(`Error fetching manifest: ${response.statusText}`, {
            status: response.status,
          });
        }
        // Return the manifest response
        const manifestData = await response.text();
        return new Response(manifestData + '\n', {
          headers: {
            "Content-Type": "application/json"
          },
        });
      } catch (error) {
        return new Response(`Error: ${error.message}\n`, {
          status: 500
        });
      }
    }

    // Check if tags or a specific tag is requested
    if (url.pathname.includes('/tags') || tags !== null || tag !== null) {
      const targetUrl = `https://ghcr.io/v2/${ghcr}/tags/list`;
      const headers = new Headers();
      for (const [key, value] of request.headers.entries()) {
        const isHeaderToRemove = headersToRemove.some(
          removeHeader => key.toLowerCase() === removeHeader.toLowerCase()
        );
        if (!isHeaderToRemove) {
          headers.set(key, value);
        }
      }
      headers.set("Authorization", "Bearer QQ==");

      try {
        // Fetch tags list
        const response = await fetch(targetUrl, {
          headers
        });
        if (!response.ok) {
          return new Response(`Error fetching tags: ${response.statusText}\n`, {
            status: response.status,
          });
        }

        const jsonResponse = await response.json();
        const tagsList = jsonResponse.tags || [];

        // Handle specific conditions for tags
        if (tags === null && !query) {
          // Return the first tag if ?tag is provided without a value
          if (tagsList.length > 0) {
            return new Response(tagsList[tagsList.length - 1] + '\n', {
              headers: {
                "Content-Type": "text/plain"
              },
            });
          } else {
            return new Response("No tags found.\n", {
              status: 404
            });
          }
        }

        if (query) {
          // Perform a fuzzy search for the query value in the tags list
          const queryLower = query.toLowerCase();
          const matchingTag = tagsList.find(tag =>
            tag.toLowerCase().includes(queryLower)
          );
          if (matchingTag) {
            return new Response(matchingTag + '\n', {
              headers: {
                "Content-Type": "text/plain"
              },
            });
          } else {
            return new Response("No matching tag found for the specified Query.\n", {
              status: 404,
            });
          }
        }

        if (tags === "all" || tags === "true" || tags === '') {
          // Return all tags as a newline-separated string
          const tagsString = tagsList.join("\n");
          return new Response(tagsString + '\n', {
            headers: {
              "Content-Type": "text/plain"
            },
          });
        }

        // Fallback for invalid tags query
        return new Response("Invalid tags parameter value.\n", {
          status: 400,
        });

      } catch (error) {
        return new Response(`Error: ${error.message}\n`, {
          status: 500
        });
      }
    }

    // Default behavior for other requests
    //return new Response("Not a valid request!\n", {
    return new Response(null, {
      status: 420
    });
  },
};
