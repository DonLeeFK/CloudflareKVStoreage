### Environment Variables

| ENV | Description |
|------------|---------------|
| TOKEN      | your access token        |
|     KV       |       name of your KV storage space        |
### Example Usage
#### List All Files:

Visit: https://yourdomain.com?token=yourtoken
This will display a list of all files stored in your KV storage, each with a link to download it.
#### Download a Specific File:

Visit: https://yourdomain.com/yourfile.txt?token=yourtoken
This will download the specified file.

#### Upload a File:
Use a request like:
```
<HTTP>
GET https://yourdomain.com/yourfile.txt?token=yourtoken&upload=base64EncodedString
curl -X GET "https://yourdomain.com/yourfile.txt?token=yourtoken&upload=base64EncodedString"
```
Or use `upload.sh`: 
```
chmod +x upload.sh
./upload.sh /path/to/your/file.txt yourtoken https://yourworkerurl
```