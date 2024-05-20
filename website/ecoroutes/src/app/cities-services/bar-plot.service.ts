import { Injectable } from '@angular/core';
import * as d3 from 'd3';

@Injectable({
  providedIn: 'root'
})
export class BarPlotService {

  constructor() { }

  drawBarPlot(data: any[], elementId: string): void {
    const svg = d3.select(`#${elementId}`);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 60, left: 100 };
    const width = +svg.attr('width') - margin.left - margin.right;
    const height = +svg.attr('height') - margin.top - margin.bottom;

    const x = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.avgCO2)])
      .range([0, width]);

    const y = d3.scaleBand()
      .range([0, height])
      .domain(data.map(d => d.arrivalCity))
      .padding(0.1);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    g.append('g')
      .call(d3.axisLeft(y));

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .append('text')
      .attr('text-anchor', 'end')
      .attr('x', width)
      .attr('y', margin.bottom - 10)
      .text('CO2 Emissions (kg)');

    g.selectAll('.bar')
      .data(data)
      .join(
        enter => enter.append('rect')
          .attr('class', 'bar')
          .attr('y', d => y(d.arrivalCity) ?? 0)
          .attr('height', y.bandwidth())
          .attr('x', 0)
          .attr('width', 0) // start with 0 width for animation
          .attr('fill', d => this.getEmissionColor(d.avgCO2))
          .call(enter => enter.transition().duration(500)
            .attr('width', d => x(d.avgCO2)))
          .on('mouseover', (event, d) => showTooltip(event, d))
          .on('mouseout', () => hideTooltip()),
        update => update
          .call(update => update.transition().duration(500)
            .attr('y', d => y(d.arrivalCity) ?? 0)
            .attr('width', d => x(d.avgCO2))
            .attr('fill', d => this.getEmissionColor(d.avgCO2)))
          .on('mouseover', (event, d) => showTooltip(event, d))
          .on('mouseout', () => hideTooltip()),
        exit => exit
          .call(exit => exit.transition().duration(500)
            .attr('width', 0)
            .remove())
      );

    function showTooltip(event: { pageX: number; pageY: number; }, d: { arrivalCity: any; avgCO2: number; }) {
      const html = `<strong>City:</strong> ${d.arrivalCity}<br/>
                    <strong>CO2 Emissions:</strong> ${d.avgCO2.toFixed(2)} kg<br/>
                    <strong>Details:</strong> Add more details here...`;
      d3.select('#tooltip')
        .style('left', `${event.pageX + 10}px`)
        .style('top', `${event.pageY + 10}px`)
        .style('display', 'inline-block')
        .html(html);
    }

    function hideTooltip() {
      d3.select('#tooltip').style('display', 'none');
    }


    // Append a tooltip
    d3.select('body').append('div')
      .attr('id', 'tooltip')
      .style('position', 'absolute')
      .style('padding', '10px')
      .style('background', 'rgba(0,0,0,0.6)')
      .style('color', '#fff')
      .style('border-radius', '5px')
      .style('display', 'none');
  }

  private getEmissionColor(co2Value: number): string {
    const maxCo2 = 150; // Adjust this value based on your data
    const minCo2 = 0;
    const midCo2 = (maxCo2 - minCo2) / 2;
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