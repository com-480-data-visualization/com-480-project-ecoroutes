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

        this.initMapClickHandler();
        // this.setDefaultMapView();

        this.maxCo2 = Math.max(...this.data.map(el => el['avg_co2'] as number)); // Adjust this value based on data
        this.minCo2 = Math.min(...this.data.map(el => el['avg_co2'] as number)); 
        this.midCo2 = (this.maxCo2 + this.minCo2) / 2;

        this.addLegend();
      });
    },200)
  }

  initMapClickHandler(): void {
    const svgMap = document.getElementById('europe-map') as HTMLObjectElement;
    this.map = svgMap;

    const applyInteractions = (svgDoc: Document) => {
      const countries = svgDoc.querySelectorAll('path');
      countries.forEach(country => {
        const countryName = country.getAttribute('name') || ''; // Default to empty string if null
        // Initially set or reset the fill based on selection status
        // country.style.fill = this.selectedCountries.has(countryName) ? '#007bff' : '#CFCFCF';

        // Setup click event to toggle selection
        country.addEventListener('click', () => {
          if (countryName) {
            const region = (this.country_to_region as CountryToRegionMap)[countryName];
            this.selectedRegions.has(region) ? this.selectedRegions.delete(region) : this.selectedRegions.add(region);

            if (!this.selectedRegions.has(region)) {
              countries.forEach(c => {
                if ((this.country_to_region as CountryToRegionMap)[c.getAttribute('name') || ''] === region) {
                  c.style.fill = '#CFCFCF';
                }
              });
            }

            this.resetRegions();

            this.getCO2pairs();

          }
        });

        // Add hover effects
        country.addEventListener('mouseover', () => {
          // country.style.fill = '#007bff'; // Highlight color on hover
          
          const region = (this.country_to_region as CountryToRegionMap)[countryName];

          if(this.selectedRegions.has(region)) {
            return;
          }
          // highlight all the countries of the region  
          countries.forEach(c => {
            if ((this.country_to_region as CountryToRegionMap)[c.getAttribute('name') || ''] === region) {
              c.style.fill = '#007bff';
            }
          });
        });

        country.addEventListener('mouseout', () => {
          const region = (this.country_to_region as CountryToRegionMap)[countryName];
          // highlight all the countries of the region  
          if (!this.selectedRegions.has(region)) {
            countries.forEach(c => {
              if ((this.country_to_region as CountryToRegionMap)[c.getAttribute('name') || ''] === region) {
                c.style.fill = '#CFCFCF';
              }
            });
          }
          // country.style.fill = this.selectedCountries.has(countryName) ? '#007bff' : '#CFCFCF'; // Default or highlight color
        });
      });
    };

    // Check if the SVG is already loaded
    if (svgMap.contentDocument) {
      applyInteractions(svgMap.contentDocument);
    } else {
      // Apply interactions once the SVG is loaded
      svgMap.addEventListener('load', () => {
        applyInteractions(svgMap.contentDocument!);
      });
    }
  }

  resetRegions(): void {
    this.data.forEach(d => {
      let el = document.getElementById(d['Departure Region'] + ';' + d['Arrival Region']);
      if(el){
        el.innerHTML = '';
        el.style.borderColor = 'grey';
      }
    });
  }

  getCO2pairs(){
    // print the co2 between each pair of regions
    this.data.forEach(d => {
      if (this.selectedRegions.has(d['Departure Region']) && this.selectedRegions.has(d['Arrival Region'])){
        console.log(d['Departure Region'], d['Arrival Region'], d['avg_co2'])
        let el = document.getElementById(d['Departure Region'] + ';' + d['Arrival Region']);
        let co2 = parseInt(d['avg_co2']);
        if(el){
          el.innerHTML = co2.toFixed(2);
          el.style.borderColor = this.getEmissionColor(co2,100);
          el.style.backgroundColor = this.getEmissionColor(co2,30);
          el.style.color = this.getEmissionColor(co2,100);
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
      // Scale from green to yellow (0 -> 0.5)
      // Green stays at full while red ramps up
      red = Math.floor(200 * (2 * ratio)); // 0 at minCo2, 255 at midCo2
      green = 200;
    } else {
      // Scale from yellow to red (0.5 -> 1)
      // Green ramps down while red stays at full
      red = 200;
      green = Math.floor(200 * (2 * (1 - ratio))); // 255 at midCo2, 0 at maxCo2
    }

    return `rgb(${red}, ${green}, 0, ${a}%)`; // Keep blue at 0 throughout
  }

  addLegend(): void {
    const legend = new L.Control({ position: 'topleft' });

    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'info legend');
      const gradientHtml = `
        <div class="legend-gradient" style="height: 10px; width: 100%; background: linear-gradient(to right, ${this.getEmissionColor(0,100)}, ${this.getEmissionColor(15,100)}, ${this.getEmissionColor(30,100)});">
        </div>
        <div class="legend-scale">
          <span>0 kg</span><span style="float: right;">30 kg</span>
        </div>`;

      div.innerHTML = `<div><strong>CO2 Emissions (kg)</strong></div>${gradientHtml}`;
      return div;
    };

    legend.addTo(this.map);
  }

}
