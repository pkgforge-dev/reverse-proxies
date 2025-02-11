addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // Extract PKG_ID from URL
  const url = new URL(request.url)
  const PKG_ID = url.pathname.slice(1) // Remove leading slash

  // If no PKG_ID provided, return 400
  if (!PKG_ID) {
    return new Response('Missing package ID', { status: 400 })
  }

  const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'

  // Try endpoints in sequence
  for (let num = 1; num <= 3; num++) {
    try {
      // First try without User-Agent
      let response = await fetch(
        `https://api.appimagehub.com/ocs/v1/content/download/${PKG_ID}/${num}?format=json`
      )

      // If we get 429, 403, or 401, retry with User-Agent
      if ([429, 403, 401].includes(response.status)) {
        response = await fetch(
          `https://api.appimagehub.com/ocs/v1/content/download/${PKG_ID}/${num}?format=json`,
          {
            headers: {
              'User-Agent': userAgent
            }
          }
        )
      }

      const text = await response.text()
      try {
        const json = JSON.parse(text)
        // Verify the response has the expected structure
        if (json?.data?.[0]?.downloadlink) {
          return new Response(null, {
            status: 302,
            headers: {
              'Location': json.data[0].downloadlink
            }
          })
        }
      } catch (e) {
        // If this endpoint fails, continue to the next one
        continue
      }
      
      // If we got here, the JSON was valid but didn't have the right structure
      // Return the last response we got
      if (num === 3) {
        return new Response(text, {
          status: 400,
          headers: {
            'Content-Type': 'text/plain'
          }
        })
      }
    } catch (error) {
      // If this endpoint fails, continue to the next one
      continue
    }
  }

  // If we get here, all endpoints failed
  return new Response('No valid download link found', {
    status: 404
  })
}
