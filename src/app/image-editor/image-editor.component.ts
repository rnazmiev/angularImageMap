import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import * as d3 from 'd3';

@Component({
  selector: 'app-image-editor',
  standalone: true,
  templateUrl: './image-editor.component.html',
  styleUrls: ['./image-editor.component.scss'],
  imports: [FormsModule]
})
export class ImageEditorComponent implements AfterViewInit {
  @ViewChild('svgElement', { static: false }) svgElement!: ElementRef<SVGSVGElement>;

  constructor(private http: HttpClient) {}

  private svg: any;
  private zoom: any;
  private areas: Array<{ id: string; type: string; coordinates: number[][]; color: string; name: string }> = [];
  private bindings: Array<{ loop?: string; tag?: string; component?: string }> = [];
  private imageDataUrl = 'image-data.json';
  private dataUrl = 'areaMapData.json';

  private selectedType: 'loop' | 'tag' | 'component' | null = null;
  public inputText = '';

  ngAfterViewInit() {
    if (this.svgElement) {
      this.initSvgAndZoom();
      this.loadImageFromDatabase();
      this.loadData();
      this.svg.on('contextmenu', (event: MouseEvent) => this.showContextMenu(event));
    } else {
      console.error('SVG Element is not available!');
    }
  }

  private loadImageFromDatabase() {
    this.http.get<{ imageUrl: string }>(this.imageDataUrl).subscribe({
      next: (response) => {
        this.addImageToSvg(response.imageUrl);
      },
      error: (error) => {
        console.error('Error loading image data:', error);
      }
    });
  }

  private addImageToSvg(url: string) {
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

  private loadData() {
    this.http.get<{ areas: Array<{ id: string; type: string; coordinates: number[][]; color: string; name: string }>; bindings: Array<{ loop?: string; tag?: string; component?: string }> }>(this.dataUrl).subscribe({
      next: (data) => {
        this.areas = data.areas;
        this.bindings = data.bindings;
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

  private showContextMenu(event: MouseEvent) {
    event.preventDefault();
    const contextMenu = document.getElementById('contextMenu');
    if (contextMenu) {
      contextMenu.style.display = 'block';
      contextMenu.style.left = `${event.pageX}px`;
      contextMenu.style.top = `${event.pageY}px`;
    }
  }

  openModal(type: 'loop' | 'tag' | 'component') {
    this.selectedType = type;
    this.inputText = '';
    const modal = document.getElementById('modal');
    if (modal) modal.style.display = 'block';

    const contextMenu = document.getElementById('contextMenu');
    if (contextMenu) contextMenu.style.display = 'none';
  }

  public saveBinding() {
    if (this.selectedType && this.inputText) {
      this.bindings.push({ [this.selectedType]: this.inputText });
      this.saveData();
      this.closeModal();
    }
  }

  public closeModal() {
    const modal = document.getElementById('modal');
    if (modal) modal.style.display = 'none';
  }

  private drawShapes(shapes: Array<{ id: string; type: string; coordinates: number[][]; color?: string; name: string }>) {
    const tooltip = d3.select('body')
      .append('div')
      .style('position', 'absolute')
      .style('background', 'white')
      .style('padding', '5px 10px')
      .style('border', '1px solid black')
      .style('border-radius', '5px')
      .style('pointer-events', 'none')
      .style('display', 'none');

    shapes.forEach(shape => {
      // const color = shape.coordinates.length > 2 ? '#666' : shape.color || 'black';
      const polygon = this.createPolygon({ ...shape, color: shape.color || '#666' });
      if (shape.type) {
        polygon
          .on('mouseover', (event: any) => {
            tooltip.style('display', 'block')
              .html(shape.name)
              .style('left', (event.pageX + 10) + 'px')
              .style('top', (event.pageY + 10) + 'px');
          })
          .on('mousemove', (event: any) => {
            tooltip.style('left', (event.pageX + 10) + 'px')
              .style('top', (event.pageY + 10) + 'px');
          })
          .on('mouseout', () => {
            tooltip.style('display', 'none');
          });

        this.makeEditable(polygon, { ...shape, color: shape.color || '#666' });

        const binding = this.bindings.find(b => b.loop === shape.name || b.tag === shape.name || b.component === shape.name);
        if (binding) {
          polygon.append('title').text(`Binding: ${JSON.stringify(binding)}`);
        }
      }
    });
  }

  private createPolygon(shape: { id: string; coordinates: number[][]; color: string }) {
    const polygon = this.svg.append('polygon')
      .attr('points', shape.coordinates.map(([x, y]) => `${x},${y}`).join(' '))
      .attr('fill', shape.color)
      .attr('stroke', 'black')
      .attr('stroke-width', 1)
      .attr('id', shape.id);

    return polygon;
  }


  private makeEditable(shape: any, data: { id: string; coordinates: number[][]; color: string }) {
    let startX: number, startY: number;
    let originalCoordinates: number[][] = [];
    shape.call(
      d3.drag()
        .on("start", (event: any) => {
          startX = event.x;
          startY = event.y;
          originalCoordinates = data.coordinates.map(([x, y]) => [x, y]);
          d3.select(event.sourceEvent.target).raise().classed("active", true);
        })
        .on("drag", (event: any) => {
          data.coordinates = originalCoordinates.map(([x, y]) => [x + (event.x - startX), y + (event.y - startY)]);
          shape.attr('points', data.coordinates.map(([x, y]) => `${x},${y}`).join(' '));

          this.updatePoints(data.coordinates);
        })
        .on("end", (event: any) => {
          d3.select(event.sourceEvent.target).classed("active", false);
          this.redrawPoints(shape, data);
          this.saveData();
        })
    );

    this.redrawPoints(shape, data);
  }


  private createPoints(shape: any, data: { coordinates: number[][] }) {
    data.coordinates.forEach((coord, index) => {
      const point = this.svg.append('circle')
        .attr('cx', coord[0])
        .attr('cy', coord[1])
        .attr('r', 5)
        .attr('fill', 'blue')
        .attr('stroke', 'black')
        .attr('stroke-width', 1)
        .attr('class', 'draggable-point')
        .call(
          d3.drag()
            .on("start", (event: any) => {
              d3.select(event.sourceEvent.target).raise().classed("active", true);
            })
            .on("drag", (event: any) => {
              const dx = event.dx;
              const dy = event.dy;

              data.coordinates[index][0] += dx;
              data.coordinates[index][1] += dy;
              point.attr('cx', data.coordinates[index][0]).attr('cy', data.coordinates[index][1]);
              shape.attr('points', data.coordinates.map(([x, y]) => `${x},${y}`).join(' '));
            })
            .on("end", (event: any) => {
              d3.select(event.sourceEvent.target).classed("active", false);
              this.saveData();
            })
        );

      point.on('dblclick', () => {
        data.coordinates.splice(index, 1);
        point.remove();
        shape.attr('points', data.coordinates.map(([x, y]) => `${x},${y}`).join(' '));
        this.redrawPoints(shape, data);
      });
    });
  }

  private updatePoints(coordinates: number[][]) {
    this.svg.selectAll('.draggable-point')
      .each((d: unknown, i: number, nodes: SVGCircleElement[]) => {
        const point = d3.select(nodes[i]);
        point.attr('cx', coordinates[i][0]).attr('cy', coordinates[i][1]);
      });
  }

  private redrawPoints(shape: any, data: { coordinates: number[][] }) {
    this.svg.selectAll('.draggable-point').remove();
    this.createPoints(shape, data);
  }

  private saveData() {
    const dataToSave = { areas: this.areas , bindings: this.bindings};
    console.log('Saving data:', JSON.stringify(dataToSave));
  }

  private initSvgAndZoom() {
    this.svg = d3.select(this.svgElement.nativeElement);
    this.zoom = d3.zoom().on('zoom', (event: any) => {
      this.svg.attr('transform', event.transform);
    });

    this.svg.call(this.zoom);
  }
}
