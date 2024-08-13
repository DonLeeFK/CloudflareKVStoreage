addEventListener('fetch', (event) => {
    event.respondWith(handleRequest(event.request));
  });
  
  async function handleRequest(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const token = ENV.TOKEN;
    const kvNamespace = ENV.KV;
  
    // Check the authorization token
    const authToken = request.headers.get('Authorization');
    if (authToken !== `Bearer ${token}`) {
      return new Response('Unauthorized', { status: 401 });
    }
  
    if (request.method === 'GET' && path === '/list') {
      return await listFiles(kvNamespace);
    } else if (request.method === 'POST' && path === '/upload') {
      return await handleUpload(request, kvNamespace);
    } else if (request.method === 'DELETE' && path.startsWith('/delete/')) {
      const filename = path.split('/')[2];
      return await deleteFile(filename, kvNamespace);
    } else {
      return new Response('Not Found', { status: 404 });
    }
  }
  
  async function listFiles(kvNamespace) {
    const keys = await KV.get(kvNamespace, { list: true });
    const fileNames = keys.keys.map((key) => key.name);
    return new Response(JSON.stringify(fileNames), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  async function handleUpload(request, kvNamespace) {
    const { filename, content } = await request.json();
    const decodedContent = atob(content);
    await KV.put(kvNamespace, filename, decodedContent);
    return new Response('File uploaded successfully', { status: 200 });
  }
  
  async function deleteFile(filename, kvNamespace) {
    await KV.delete(kvNamespace, filename);
    return new Response('File deleted successfully', { status: 200 });
  }
  