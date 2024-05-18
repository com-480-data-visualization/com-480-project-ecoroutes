import { Injectable } from '@angular/core';
import * as d3 from 'd3';

interface NodeData extends d3.SimulationNodeDatum {
  name: string;
}

interface LinkData {
  source: string;
  target: string;
  weight: number;
  sourceCountry: string;
  targetCountry: string;
}
@Injectable({
  providedIn: 'root'
})
export class GraphService {
  private svg: any;
  private graphWidth = 700;
  private graphHeight = 700;

  constructor() { }

  initGraph(elementId: string): void {
    this.svg = d3.select(`#${elementId}`).append('svg')
      .attr('width', this.graphWidth)
      .attr('height', this.graphHeight)
      .append('g')
      .attr('transform', `translate(${this.graphWidth / 2}, ${this.graphHeight / 2})`);
  }

  updateGraph(nodes: string[], links: LinkData[], currentView: 'city' | 'country' | 'region'): void {
    const width = 650;
    const height = 650;
    const innerRadius = Math.min(width, height) * 0.5 - 50;
    const outerRadius = innerRadius + 10;

    const index = new Map(nodes.map((name, i) => [name, i]));
    const matrix = Array.from(index, () => new Array(nodes.length).fill(0));

    links.forEach(({ source, target, weight }) => {
      const sourceIndex = index.get(source);
      const targetIndex = index.get(target);
      if (sourceIndex !== undefined && targetIndex !== undefined) {
        matrix[sourceIndex][targetIndex] += weight;
      }
    });

    const chord = d3.chord()
      .padAngle(0.05)
      .sortSubgroups(d3.descending);

    const arc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius);

    const ribbon = d3.ribbon()
      .radius(innerRadius);

    this.svg.selectAll('*').remove(); // Clear existing graph

    this.svg.attr('width', width)
      .attr('height', height)
      .attr('viewBox', [-width / 2, -height / 2, width, height])
      .attr('style', 'width: 100%; height: 100%; font: 10px sans-serif;');

    const chords = chord(matrix);

    const ribbonPaths = this.svg.append('g')
      .attr("class", "ribbons")
      .selectAll('path')
      .data(chords)
      .join('path')
      .attr('d', ribbon)
      .attr('stroke', '#000')
      .attr('stroke-opacity', 0.8)
      .attr('fill', '#555555') // Dark gray color
      .attr('opacity', 0.8);

    const group = this.svg.append('g')
      .selectAll('g')
      .data(chords.groups)
      .join('g');

    group.append('path')
      .attr('d', arc)
      .attr('fill', '#555555') // Dark gray color
      .attr('stroke', d3.rgb('#000').darker())
      .on('mouseover', function (this: SVGPathElement, event: MouseEvent, d: any) {
        console.log('Arc Mouseover:', d);
        // Highlight all related paths when hovering over a country/region
        d3.selectAll('.ribbons path')
          .filter((s: any) => s.source.index === d.index || s.target.index === d.index)
          .attr('opacity', 1)
          .attr('fill', '#FFD700'); // Highlight color (bright yellow)
      })
      .on('mouseout', function (this: SVGPathElement, event: MouseEvent, d: any) {
        console.log('Arc Mouseout:', d);
        d3.selectAll('.ribbons path')
          .attr('opacity', 0.8)
          .attr('fill', '#555555'); // Reset to dark gray color
      });

    group.append('text')
      .each((d: any) => { d.angle = (d.startAngle + d.endAngle) / 2; })
      .attr('dy', '.35em')
      .attr('transform', (d: any) => `
        rotate(${(d.angle * 180 / Math.PI - 90)})
        translate(${outerRadius + 5})
        ${d.angle > Math.PI ? 'rotate(180)' : ''}
      `)
      .attr('text-anchor', (d: any) => d.angle > Math.PI ? 'end' : null)
      .text((d: any) => nodes[d.index]);
  }



}
