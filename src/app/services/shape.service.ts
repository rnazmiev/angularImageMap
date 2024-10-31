import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class ShapeService {
  private dataUrl = 'areaMapData.json';
  private areas: Array<{ id: string; type: string; coordinates: number[][]; color: string }> = [];

  constructor(private http: HttpClient) {}

  loadData = () => {
    this.http.get<{ areas: Array<{ id: string; type: string; coordinates: number[][]; color: string }> }>(this.dataUrl).subscribe({
      next: (data) => {
        this.areas = data.areas;
        this.drawShapes(this.areas);
      },
      error: (error) => {
        console.error('Error loading shape data:', error);
      },
      complete: () => {
        console.log('Shape data loading complete');
      }
    });
  }

  drawShapes(svg: any, shapes: any[]) {
    shapes.forEach(shape => {
      if (shape.type === 'contour' || shape.type === 'component') {
        const square = this.createSquare(svg, shape);
        this.makeDraggable(square, shape);
      }
    });
  }

  private createSquare(svg: any, shape: any) {
    // Создание формы квадрата
  }

  private makeDraggable(shape: any, data: any) {
    // Настройка перетаскивания формы
  }
}
