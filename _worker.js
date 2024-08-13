const TOKEN = ENV.TOKEN; // Ensure this is set in your Cloudflare environment variables
const KV = ENV.KV; // Access the KV namespace from environment variables

async function handleFileRequest(request) {
    const url = new URL(request.url);
    const filename = url.pathname.split('/').pop();
    const token = url.searchParams.get('token');

    // Validate token
    if (token !== TOKEN) {
        return new Response('Unauthorized', { status: 403 });
    }

    // Fetch file from KV storage
    const fileData = await KV.get(filename, { type: 'arrayBuffer' });

    if (!fileData) {
        return new Response('File not found', { status: 404 });
    }

    // Return file as response
    return new Response(fileData, {
        headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${filename}"`,
        },
    });
}

async function handleUploadRequest(request) {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (token !== TOKEN) {
        return new Response('Unauthorized', { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
        return new Response('No file uploaded', { status: 400 });
    }

    const filename = file.name;
    const fileData = await file.arrayBuffer();

    // Store file in KV storage directly
    await KV.put(filename, fileData);

    return new Response('File uploaded successfully', { status: 200 });
}

async function handleListRequest(request) {
    const token = request.searchParams.get('token');

    // Validate token
    if (token !== TOKEN) {
        return new Response('Unauthorized', { status: 403 });
    }

    const keys = await KV.list();
    const filesHtml = keys.keys.map(file => `
        <li>
            <a href="/${file.name}?token=${token}">${file.name}</a>
            <form method="POST" action="/delete/${file.name}?token=${token}" style="display:inline;">
                <button type="submit">Delete</button>
            </form>
        </li>
    `).join('');

    return new Response(`
        <h1>Stored Files</h1>
        <ul>${filesHtml}</ul>
        <h2>Upload File</h2>
        <form method="POST" enctype="multipart/form-data" action="/upload">
            <input type="file" name="file" required />
            <button type="submit">Upload</button>
        </form>
    `, {
        headers: { 'Content-Type': 'text/html' }
    });
}

async function handleDeleteRequest(request) {
    const url = new URL(request.url);
    const filename = url.pathname.split('/').pop();
    const token = url.searchParams.get('token');

    // Validate token
    if (token !== TOKEN) {
        return new Response('Unauthorized', { status: 403 });
    }

    await KV.delete(filename);
    return new Response('File deleted successfully', { status: 200 });
}

addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    if (event.request.method === 'GET' && url.pathname.startsWith('/')) {
        if (url.searchParams.has('token')) {
            event.respondWith(handleListRequest(event.request));
        } else {
            event.respondWith(handleFileRequest(event.request));
        }
    } else if (event.request.method === 'POST' && url.pathname === '/upload') {
        event.respondWith(handleUploadRequest(event.request));
    } else if (event.request.method === 'POST' && url.pathname.startsWith('/delete/')) {
        event.respondWith(handleDeleteRequest(event.request));
    } else {
        event.respondWith(new Response('Not Found', { status: 404 }));
    }
});
