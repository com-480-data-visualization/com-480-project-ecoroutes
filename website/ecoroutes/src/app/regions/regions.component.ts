import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { BarPlotService } from '../cities-services/bar-plot.service';
import { DataService } from '../cities-services/data.service';
import { GraphService } from '../cities-services/graph.service';
import { MapService } from '../cities-services/map.service';
import { count } from 'console';
import * as d3 from 'd3';
import { CommonModule } from '@angular/common';
import e from 'express';
import L from 'leaflet';



interface CountryToRegionMap {
  [key: string]: string;
}

@Component({
  selector: 'app-regions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './regions.component.html',
  styleUrl: './regions.component.scss'
})
export class RegionsComponent {

  country_to_region = {
    "United Kingdom": "British Isles",
    "Macedonia": "Eastern Europe",
    "Greece": "Southern Europe",
    "Ireland": "British Isles",
    "Italy": "Southern Europe",
    "Germany": "Western Europe",
    "Switzerland": "Western Europe",
    "France": "Western Europe",
    "Netherlands": "Western Europe",
    "Poland": "Eastern Europe",
    "Spain": "Southern Europe",
    "Slovenia": "Eastern Europe",
    "Romania": "Eastern Europe",
    "Croatia": "Eastern Europe",
    "Sweden": "Northern Europe",
    "Belgium": "Western Europe",
    "Lithuania": "Eastern Europe",
    "Moldova": "Eastern Europe",
    "Luxembourg": "Western Europe",
    "Malta": "Southern Europe",
    "Norway": "Northern Europe",
    "Slovakia": "Eastern Europe",
    "Latvia": "Northern Europe",
    "Serbia": "Eastern Europe",
    "Austria": "Western Europe",
    "Montenegro": "Eastern Europe",
    "Ukraine": "Eastern Europe",
    "Turkey": "Eastern Europe",
    "Hungary": "Eastern Europe",
    "Iceland": "Northern Europe",
    "Czech Republic": "Eastern Europe",
    "Georgia": "Eastern Europe",
    "Finland": "Northern Europe",
    "Kosovo": "Southern Europe",
    "Denmark": "Northern Europe",
    "Cyprus": "Southern Europe",
    "Bulgaria": "Eastern Europe",
    "Bosnia and Herzegovina": "Eastern Europe",
    "Belarus": "Eastern Europe",
    "Azerbaijan": "Eastern Europe",
    "Armenia": "Eastern Europe",
    "Andorra": "Southern Europe",
    "Russia": "Eastern Europe",
    "Portugal": "Southern Europe",
    "Albania": "Southern Europe",
    "Estonia": "Northern Europe",
  }

  data: any[] = [];
  regions: string[] = ['Eastern Europe', 'Southern Europe', 'Western Europe', 'British Isles', 'Northern Europe'];
  selectedRegions: Set<string> = new Set();

  map: any;
  maxCo2: number = -1;
  minCo2: number = -1;
  midCo2: number = -1;

  constructor(
    private mapService: MapService,
    private dataService: DataService,
    private http: HttpClient
  ) { }

  ngAfterViewInit(): void {
    // this.mapService.initMap('map');
    setTimeout(() => {
      d3.csv('assets/regions_co2.csv').then(data => {

        this.data = data;

        // Update graph and map highlighting with initial selections
        // this.updateMapHighlighting();
        // this.setDefaultMapView();

        this.maxCo2 = Math.max(...this.data.map(el => el['avg_co2'] as number)); // Adjust this value based on data
        this.minCo2 = Math.min(...this.data.map(el => el['avg_co2'] as number));
        this.midCo2 = (this.maxCo2 + this.minCo2) / 2;
        this.populateMatrix();  // New method to populate the matrix

        this.addLegend();
      });
    }, 200)
  }

  populateMatrix(): void {
    this.regions.forEach(departureRegion => {
      this.regions.forEach(arrivalRegion => {
        const co2Value = this.findCO2ForRegions(departureRegion, arrivalRegion);
        const elementId = `${departureRegion};${arrivalRegion}`;
        const matrixCell = document.getElementById(elementId);
        if (matrixCell) {
          matrixCell.innerHTML = co2Value.toFixed(2);  // Format CO2 value to 2 decimal places
          matrixCell.style.borderColor = this.getEmissionColor(co2Value, 100);
          matrixCell.style.backgroundColor = this.getEmissionColor(co2Value, 30);
        }
      });
    });
  }


  resetRegions(): void {
    this.data.forEach(d => {
      let el = document.getElementById(d['Departure Region'] + ';' + d['Arrival Region']);
      if (el) {
        el.innerHTML = '';
        el.style.borderColor = 'rgb(200, 200, 200)';
        el.style.backgroundColor = 'white'
      }
    });
  }

  getCO2pairs() {
    // print the co2 between each pair of regions
    this.data.forEach(d => {
      if (this.selectedRegions.has(d['Departure Region']) && this.selectedRegions.has(d['Arrival Region'])) {
        console.log(d['Departure Region'], d['Arrival Region'], d['avg_co2'])
        let el = document.getElementById(d['Departure Region'] + ';' + d['Arrival Region']);
        let co2 = parseInt(d['avg_co2']);
        if (el) {
          el.innerHTML = co2.toFixed(2);
          el.style.borderColor = this.getEmissionColor(co2, 100);
          el.style.backgroundColor = this.getEmissionColor(co2, 30);
          el.style.color = this.getEmissionColor(co2, 100);
        }
      }
    });
  }

  private getEmissionColor(co2Value: number, a: number): string {
    // Normalize the value within the range [0, 1]
    const ratio = (co2Value - this.minCo2) / (this.maxCo2 - this.minCo2);
    console.log(ratio);

    let red, green;
    if (co2Value <= this.midCo2) {
      // Scale from green to yellow
      red = Math.floor(255 * ratio * 2); // Red increases from 0 to 255 as we approach midCo2
      green = 255; // Green stays full till midCo2
    } else {
      // Scale from yellow to red
      red = 255; // Red stays full past midCo2
      green = Math.floor(255 * (2 - 2 * ratio)); // Green decreases from 255 to 0 past midCo2
    }

    return `rgba(${red}, ${green}, 0, ${a / 100})`; // Adjust alpha value appropriately
  }

  addLegend(): void {
    const legend = new L.Control({ position: 'topleft' });

    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'info legend');
      const gradientHtml = `
            <div class="legend-gradient" style="height: 10px; width: 100%; background: linear-gradient(to right, 
            ${this.getEmissionColor(this.minCo2, 100)}, 
            ${this.getEmissionColor((this.maxCo2 + this.minCo2) / 2, 100)}, 
            ${this.getEmissionColor(this.maxCo2, 100)});">
            </div>
            <div class="legend-scale">
                <span>${this.minCo2} kg</span><span style="float: right;">${this.maxCo2} kg</span>
            </div>`;

      div.innerHTML = `<div><strong>CO2 Emissions (kg)</strong></div>${gradientHtml}`;
      return div;
    };

    legend.addTo(this.map);
  }



  highlightMap(departureRegion: string, arrivalRegion: string): void {
    const svgMap = document.getElementById('europe-map') as HTMLObjectElement;
    const svgDoc = svgMap?.contentDocument;
    if (!svgDoc) return;

    const countries = svgDoc.querySelectorAll('path');
    countries.forEach(country => {
      const countryName = country.getAttribute('name') || ''; // Ensures countryName is never null
      const region = this.country_to_region[countryName as keyof typeof this.country_to_region];

      if (region === departureRegion || region === arrivalRegion) {
        const co2 = this.findCO2ForRegions(departureRegion, arrivalRegion);
        country.style.fill = this.getEmissionColor(co2, 100);
      }
    });
  }


  resetMapHighlight(): void {
    const svgMap = document.getElementById('europe-map') as HTMLObjectElement;
    const svgDoc = svgMap?.contentDocument;
    if (!svgDoc) return;

    const countries = svgDoc.querySelectorAll('path');
    countries.forEach(country => {
      country.style.fill = 'rgb(235, 235, 235)'; // Default fill color
    });
  }

  // Helper method to find CO2 value for a given pair of regions
  findCO2ForRegions(departureRegion: string, arrivalRegion: string): number {
    const regionPair = this.data.find(d => d['Departure Region'] === departureRegion && d['Arrival Region'] === arrivalRegion);
    return regionPair ? parseFloat(regionPair['avg_co2']) : 0;
  }


}
