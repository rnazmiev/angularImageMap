import { Injectable } from '@angular/core';
import * as d3 from 'd3';

@Injectable()
export class SvgService {
  private svg: any;

  initSvgAndZoom(svgElement: SVGSVGElement) {
    this.svg = d3.select(svgElement);

    const zoom = d3.zoom().on('zoom', (event: any) => {
      this.svg.attr('transform', event.transform);
    });

    this.svg.call(zoom);
  }

  getSvg() {
    return this.svg;
  }
}
