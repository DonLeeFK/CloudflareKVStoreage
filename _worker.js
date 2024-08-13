addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
  })
  
  async function handleRequest(request) {
    const { pathname, searchParams } = new URL(request.url)
  
    if (pathname === '/list') {
      // Send a request to your backend API to retrieve the file list
      const response = await fetch('https://kvstore.pages.dev/list')
      const fileList = await response.json()
  
      return new Response(JSON.stringify(fileList), {
        headers: { 'Content-Type': 'application/json' },
      })
    }
  
    if (pathname.startsWith('/delete/')) {
      const filename = pathname.substr('/delete/'.length)
  
      // Send a request to your backend API to delete the file
      const response = await fetch(`https://<backend_domain>/delete/${filename}`, {
        method: 'DELETE',
      })
  
      return new Response(await response.text())
    }
  
    if (pathname.startsWith('/')) {
      const filename = pathname.substr(1)
      const token = searchParams.get('token')
  
      // Send a request to your backend API to retrieve the file content
      const response = await fetch(`https://<backend_domain>/${filename}?token=${token}`)
      const fileContent = await response.text()
  
      // Decode file from base64
      const decodedFile = atob(fileContent)
  
      return new Response(decodedFile, {
        headers: { 'Content-Type': 'application/octet-stream' },
      })
    }
  
    return new Response('Not Found', { status: 404 })
  }
  