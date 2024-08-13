#!/bin/bash

# Check if the correct number of arguments is provided
if [ "$#" -ne 3 ]; then
    echo "Usage: $0 <file_path> <token> <worker_url>"
    exit 1
fi

# Assign input parameters to variables
FILE_PATH=$1
TOKEN=$2
WORKER_URL=$3

# Check if the file exists
if [ ! -f "$FILE_PATH" ]; then
    echo "File not found: $FILE_PATH"
    exit 1
fi

# Encode the file in Base64
BASE64_ENCODED=$(base64 "$FILE_PATH")

# Create the upload URL
# This adds the filename and the base64 encoded content as a query parameter
FILENAME=$(basename "$FILE_PATH")
UPLOAD_URL="${WORKER_URL}/${FILENAME}?token=${TOKEN}&upload=${BASE64_ENCODED}"

# Use curl to perform the GET request to upload the file
echo "Uploading $FILE_PATH to $UPLOAD_URL"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$UPLOAD_URL")

# Check the response status code
if [ "$RESPONSE" -eq 200 ]; then
    echo "File uploaded successfully."
else
    echo "Failed to upload file. HTTP status code: $RESPONSE"
fi
