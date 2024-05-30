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
    const width = 500;
    const height = 500;
    const innerRadius = Math.min(width, height) * 0.5 - 30;
    const outerRadius = innerRadius + 10;

    const index = new Map<string, number>(nodes.map((name, i) => [name, i]));
    const matrix: number[][] = Array.from(index, () => new Array(nodes.length).fill(0));

    links.forEach(({ source, target, weight }) => {
      const sourceIndex = index.get(source);
      const targetIndex = index.get(target);
      if (sourceIndex !== undefined && targetIndex !== undefined) {
        matrix[sourceIndex][targetIndex] += weight;
        matrix[targetIndex][sourceIndex] += weight;
      }
      else {
        console.error(`Invalid link: ${source} -> ${target}`);
      }
    });

    const chord = d3.chord()
      .padAngle(0.05)
      .sortSubgroups(d3.descending);

    const arc = d3.arc<d3.ChordGroup>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius);

    const ribbon = d3.ribbon<d3.Chord, d3.ChordSubgroup>()
      .radius(innerRadius);

    // A simple transition - make it better if you have time
    this.svg.selectAll('*')
      .transition()
      .duration(500)
      .style('opacity', 0)
      .remove()
      .end()
      .then(() => {
        // Update the viewBox with smooth transitions after the elements are removed
        this.svg.transition()
          .duration(500)
          .attr('viewBox', `-${width / 2} -${height / 2} ${width} ${height}`);
      });
    this.svg.attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `-${width / 2} -${height / 2} ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .attr('style', 'width: 100%; height: 100%; font: 10px sans-serif;');

    const chords = chord(matrix);

    const self = this;

    const scalingFactor = currentView === 'region' ? 1.5 : currentView === 'country' ? 1.2 : 1;

    this.svg.append('g')
      .attr("class", "ribbons")
      .selectAll('path')
      .data(chords)
      .join('path')
      .attr('d', ribbon)
      .attr('stroke', '#000')
      .attr('stroke-opacity', 0.8)
      .attr('fill', '#CFCFCF')
      .attr('opacity', 0.8);

    const group = this.svg.append('g')
      .selectAll('g')
      .data(chords.groups)
      .join('g');

    group.append('path')
      .attr('d', arc)
      .attr('fill', '#555555')
      .attr('stroke', d3.rgb('#111').darker())
      .on('mouseover', function (event: MouseEvent, d: any) {
        d3.selectAll('.ribbons path')
          .transition()
          .duration(200)
          .attr('opacity', function (sd: any) {
            return (sd.source.index === d.index || sd.target.index === d.index) ? 1 : 0.2;
          })
          .attr('fill', function (sd: any) {
            const linkData = links.find(link => {
              const sourceIndex = index.get(link.source);
              const targetIndex = index.get(link.target);
              return (sourceIndex === sd.source.index && targetIndex === sd.target.index) || (sourceIndex === sd.target.index && targetIndex === sd.source.index);
            });
            if (linkData && (sd.source.index === d.index || sd.target.index === d.index)) {
              return self.getEmissionColor(linkData.weight, scalingFactor);
            } else {
              return '#CFCFCF';
            }
          });
      })
      .on('mouseout', function () {
        d3.selectAll('.ribbons path')
          .transition()
          .duration(200)
          .attr('opacity', 0.8)
          .attr('fill', '#CFCFCF');
      });

    group.append('text')
      .each((d: any) => { d.angle = (d.startAngle + d.endAngle) / 2; })
      .attr('dy', '.5em')
      .attr('transform', (d: any) => `
            rotate(${(d.angle * 180 / Math.PI - 90)})
            translate(${outerRadius + 5})
            ${d.angle > Math.PI ? 'rotate(180)' : ''}
        `)
      .attr('text-anchor', (d: any) => d.angle > Math.PI ? 'end' : null)
      .attr('font-size', '15px')
      .text((d: any) => nodes[d.index]);
  }

  private getEmissionColor(co2Value: number, scalingFactor: number = 1): string {
    const maxCo2 = 140 * scalingFactor;
    const minCo2 = 0;
    const midCo2 = (maxCo2 - minCo2) / 2;

    // Normalize the value within the range [0, 1]
    const ratio = (co2Value - minCo2) / (maxCo2 - minCo2);

    let red, green;
    if (co2Value <= midCo2) {
      red = Math.floor(255 * (2 * ratio));
      green = 255;
    } else {
      red = 255;
      green = Math.floor(255 * (2 * (1 - ratio)));
    }

    return `rgb(${red}, ${green}, 0)`;
  }





}