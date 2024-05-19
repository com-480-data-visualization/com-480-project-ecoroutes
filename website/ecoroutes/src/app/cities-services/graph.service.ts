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
    const width = 500; // Adjusted width to make the graph smaller
    const height = 500; // Adjusted height to make the graph smaller
    const innerRadius = Math.min(width, height) * 0.5 - 30; // Adjusted innerRadius to fit within new size
    const outerRadius = innerRadius + 10;  // Increase thickness here

    const index = new Map<string, number>(nodes.map((name, i) => [name, i]));
    const matrix: number[][] = Array.from(index, () => new Array(nodes.length).fill(0));

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

    const arc = d3.arc<d3.ChordGroup>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius);

    const ribbon = d3.ribbon<d3.Chord, d3.ChordSubgroup>()
      .radius(innerRadius);

    this.svg.selectAll('*').remove(); // Clear existing graph

    this.svg.attr('width', '100%') // Make SVG responsive
      .attr('height', '100%') // Make SVG responsive
      .attr('viewBox', `-${width / 2} -${height / 2} ${width} ${height}`) // Ensure the viewBox fits the new size
      .attr('preserveAspectRatio', 'xMidYMid meet') // Preserve aspect ratio and center the graph
      .attr('style', 'width: 100%; height: 100%; font: 10px sans-serif;');

    const chords = chord(matrix);

    const self = this; // Reference to maintain class context

    // Determine the scaling factor based on the current view
    const scalingFactor = currentView === 'region' ? 1.5 : 1;

    this.svg.append('g')
      .attr("class", "ribbons")
      .selectAll('path')
      .data(chords)
      .join('path')
      .attr('d', ribbon)
      .attr('stroke', '#000')
      .attr('stroke-opacity', 0.8)
      .attr('fill', '#CFCFCF') // Default dark gray color
      .attr('opacity', 0.8);

    // Groups for the arcs
    const group = this.svg.append('g')
      .selectAll('g')
      .data(chords.groups)
      .join('g');

    // Arcs with interaction
    group.append('path')
      .attr('d', arc)
      .attr('fill', '#55555')
      .attr('stroke', d3.rgb('#000').darker())
      .on('mouseover', function (event: MouseEvent, d: any) {
        d3.selectAll('.ribbons path')
          .filter((s: any) => s.source.index === d.index || s.target.index === d.index)
          .raise() // This brings the selected elements to the top
          .attr('opacity', 10)
          .each(function (sd: any) {
            const linkData = links.find(link => {
              const sourceIndex = index.get(link.source);
              const targetIndex = index.get(link.target);
              return (sourceIndex === sd.source.index && targetIndex === sd.target.index) || (sourceIndex === sd.target.index && targetIndex === sd.source.index);
            });
            if (linkData) {
              d3.select(this).attr('fill', self.getEmissionColor(linkData.weight, scalingFactor)); // Apply scaling factor
            }
          });
      })
      .on('mouseout', function () {
        d3.selectAll('.ribbons path')
          .attr('opacity', 0.8)
          .attr('fill', '#CFCFCF'); // Reset all links to default color
      });


    // Text labels for arcs
    group.append('text')
      .each((d: any) => { d.angle = (d.startAngle + d.endAngle) / 2; })
      .attr('dy', '.5em')
      .attr('transform', (d: any) => `
            rotate(${(d.angle * 180 / Math.PI - 90)})
            translate(${outerRadius + 5})
            ${d.angle > Math.PI ? 'rotate(180)' : ''}
        `)
      .attr('text-anchor', (d: any) => d.angle > Math.PI ? 'end' : null)
      .attr('font-size', '15px') // Increase font size here
      .text((d: any) => nodes[d.index]);
  }

  private getEmissionColor(co2Value: number, scalingFactor: number = 1): string {
    const maxCo2 = 150 * scalingFactor; // Adjust this value based on your data and scaling factor
    const minCo2 = 0;
    const midCo2 = (maxCo2 - minCo2) / 2;

    // Normalize the value within the range [0, 1]
    const ratio = (co2Value - minCo2) / (maxCo2 - minCo2);

    let red, green;
    if (co2Value <= midCo2) {
      // Scale from green to yellow (0 -> 0.5)
      // Green stays at full while red ramps up
      red = Math.floor(255 * (2 * ratio)); // 0 at minCo2, 255 at midCo2
      green = 255;
    } else {
      // Scale from yellow to red (0.5 -> 1)
      // Green ramps down while red stays at full
      red = 255;
      green = Math.floor(255 * (2 * (1 - ratio))); // 255 at midCo2, 0 at maxCo2
    }

    return `rgb(${red}, ${green}, 0)`; // Keep blue at 0 throughout
  }





}