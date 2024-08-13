import { Component } from '@angular/core';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css']
})
export class FileUploadComponent {
  selectedFile: File | null = null;

  constructor(private http: HttpClient) {}

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  uploadFile(): void {
    if (this.selectedFile) {
      const formData = new FormData();
      formData.append('file', this.selectedFile);

      this.http.post('https://<backend_domain>/upload', formData).subscribe(
        (response) => {
          console.log(response);
          alert('File uploaded successfully');
        },
        (error) => {
          console.error(error);
          alert('File upload failed');
        }
      );
    }
  }
}