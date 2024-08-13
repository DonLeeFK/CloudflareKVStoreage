#!/bin/bash

# Check if the correct number of arguments are provided
if [ "$#" -ne 3 ]; then
    echo "Usage: $0 <file_path> <worker_url> <token>"
    exit 1
fi

FILE_PATH=$1
WORKER_URL=$2
TOKEN=$3

# Check if the file exists
if [ ! -f "$FILE_PATH" ]; then
    echo "Error: File '$FILE_PATH' not found!"
    exit 1
fi

# Extract the filename from the file path
FILENAME=$(basename "$FILE_PATH")

# Upload the file using curl
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$WORKER_URL/$FILENAME?token=$TOKEN" -F "file=@$FILE_PATH")

# Check the response code
if [ "$response" -eq 200 ]; then
    echo "File '$FILENAME' uploaded successfully."
else
    echo "Failed to upload file. HTTP response code: $response"
fi
