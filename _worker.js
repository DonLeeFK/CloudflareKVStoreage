async function handleRequest(request, env) {
    const url = new URL(request.url);
    const token = url.searchParams.get('token'); // Get the token from query parameters
    const filename = url.pathname.slice(1); // Extract filename from the URL path

    // Access the environment variables
    const validToken = env.TOKEN; // Use the environment variable for token
    const kvNamespace = env.KV; // Use the environment variable for KV namespace

    // Check if the provided token is valid
    if (token !== validToken) {
        return new Response('Unauthorized', { status: 401 });
    }

    // Handle file upload (POST request)
    if (request.method === "POST") {
        const formData = await request.formData();
        const file = formData.get("file");
        const filename = file.name;

        const reader = file.stream().getReader();
        const result = await reader.read();
        const base64Data = btoa(String.fromCharCode(...new Uint8Array(result.value))); // Convert to base64

        // Store the base64 encoded file in KV storage
        await kvNamespace.put(filename, base64Data); // Store directly as base64 encoded string
        return new Response('File uploaded successfully', { status: 200 });
    }

    // List all files in storage when no filename is provided
    if (!filename) {
        const listResponse = await listFiles(kvNamespace, token);
        return new Response(listResponse, {
            headers: { 'Content-Type': 'text/html' }
        });
    }

    // Handle file retrieval (no upload parameter)
    if (!upload) {
        // Retrieve the file from KV storage
        const file = await kvNamespace.get(filename);
        if (!file) {
            return new Response('File not found', { status: 404 });
        }

        // Decode the file from base64 and return it
        const decodedFile = atob(file); // Decode base64 to binary
        const uint8Array = new Uint8Array(decodedFile.split('').map(c => c.charCodeAt(0)));
        return new Response(uint8Array, {
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Disposition': `attachment; filename="${filename}"`,
            }
        });
    }

    // Handle file deletion
    if (request.method === 'DELETE') {
        const deleteResponse = await deleteFile(kvNamespace, filename);
        return new Response(deleteResponse, { status: 200 });
    }

    // Handle bad requests
    return new Response('Bad Request', { status: 400 });
}

// Function to list all files in KV storage
async function listFiles(kvNamespace, token) {
    const keys = await kvNamespace.list(); // Get all keys from the KV namespace
    let fileListHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>KV Storage</title>
        </head>
        <body>
            <h1>KV Storage</h1>
            <form id="uploadForm" method="POST">
                <input type="file" id="fileInput" name="file" required>
                <input type="hidden" name="token" value="${token}">
                <button type="submit">Upload File</button>
            </form>
            <ul>
    `;

    for (const key of keys.keys) {
        const fileLink = `<li>
            <a href="${key.name}?token=${token}">${key.name}</a>
            <a href="#" onclick="event.preventDefault(); deleteFile('${key.name}');">Delete</a>
        </li>`;
        fileListHtml += fileLink;
    }

    fileListHtml += `
            </ul>
            <script>
                function deleteFile(filename) {
                    if (confirm('Are you sure you want to delete this file?')) {
                        fetch('${location.origin}/' + filename + '?token=${token}', { method: 'DELETE' })
                            .then(response => {
                                if (response.ok) {
                                    alert('File deleted successfully.');
                                    location.reload(); // Reload the page to see the updated list
                                } else {
                                    alert('Failed to delete file.');
                                }
                            });
                    }
                }
            </script>
        </body>
        </html>
    `;
    return fileListHtml;
}

// Function to delete a file from KV storage
async function deleteFile(kvNamespace, filename) {
    await kvNamespace.delete(filename); // Delete the file from KV storage
    return 'File deleted successfully';
}

// Add event listener for incoming fetch events
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request, event));
});
