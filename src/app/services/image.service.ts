import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class ImageService {
  private imageDataUrl = 'image-data.json';

  constructor(private http: HttpClient) {}
  private svg: any;


  loadImageFromDatabase() {
    this.http.get<{ imageUrl: string }>(this.imageDataUrl).subscribe({
      next: (response) => {
        this.addImageToSvg(response.imageUrl);
      },
      error: (error) => {
        console.error('Error loading image data:', error);
      }
    });
  }

  addImageToSvg(url: string) {
    const img = new Image();
    img.src = url;

    img.onload = () => {
      this.svg.insert('image', ":first-child")
        .attr('xlink:href', img.src)
        .attr('width', 800)
        .attr('height', 600)
        .attr('x', 0)
        .attr('y', 0)
        .attr('preserveAspectRatio', 'xMidYMid meet');
    };
  }
}
