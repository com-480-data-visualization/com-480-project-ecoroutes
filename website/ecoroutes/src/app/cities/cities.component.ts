import { Component, OnInit } from '@angular/core';
import { MapService } from '../cities-services/map.service';
import { DataService } from '../cities-services/data.service';
import { GraphService } from '../cities-services/graph.service';
import * as d3 from 'd3';

@Component({
  selector: 'app-cities',
  templateUrl: './cities.component.html',
  styleUrls: ['./cities.component.scss']
})

export class CitiesComponent implements OnInit {
  currentView: 'city' | 'country' | 'region' = 'city';
  selectedCountries: Set<string> = new Set();
  selectedCities: Set<string> = new Set(); // New variable for city selections
  flagsData: any[] = [];  // Store flags data

  constructor(
    private mapService: MapService,
    private dataService: DataService,
    private graphService: GraphService,

  ) { }


  ngOnInit(): void {
    this.mapService.initMap('map');
    this.dataService.loadCSVData().then(() => {
      this.graphService.initGraph('graph');
      this.updateGraph();
      this.initMapClickHandler();
    });
  }

  toggleView(view: 'city' | 'country' | 'region'): void {
    this.currentView = view;
    this.updateGraph();
    this.updateMapHighlighting();
  }

  updateGraph(): void {
    let nodes, links;
    if (this.currentView === 'city') {
      // Filter links to only those where both the source and target countries are selected
      links = this.dataService.cityLinks.filter(link =>
        this.selectedCountries.has(link.sourceCountry) && this.selectedCountries.has(link.targetCountry)
      );

      // Create a set of all cities involved in the filtered links
      const linkedCities = new Set(links.flatMap(link => [link.source, link.target]));

      // Filter nodes to include only those that are part of the filtered links
      // Sort the nodes by their country so when we draw the graph, nodes from the same country are grouped together
      // nodes = this.dataService.cityNodes.filter(city => linkedCities.has(city));
      nodes = this.dataService.getSortedCityNodes().filter(city => linkedCities.has(city));

    } else if (this.currentView === 'country') {
      nodes = this.dataService.countryNodes.filter(country => this.selectedCountries.has(country));
      links = this.dataService.countryLinks.filter(link =>
        this.selectedCountries.has(link.sourceCountry) || this.selectedCountries.has(link.targetCountry)
      );
    } else {
      nodes = this.dataService.regionNodes;
      links = this.dataService.regionLinks;
    }

    this.graphService.updateGraph(nodes, links, this.currentView);
  }


  searchCity(): void {
    const cityInput = (document.getElementById('citySearch') as HTMLInputElement).value.toLowerCase();
    const cityCount = parseInt((document.getElementById('cityCount') as HTMLInputElement).value, 10);
    const maxDistance = parseFloat((document.getElementById('maxDistance') as HTMLInputElement).value);
    this.mapService.searchCity(cityInput, cityCount, maxDistance, this.dataService.getEcoRoutes());
  }

  initMapClickHandler(): void {
    const svgMap = document.getElementById('europe-map') as HTMLObjectElement;
    svgMap.addEventListener('load', () => {
      const svgDoc = svgMap.contentDocument;
      if (svgDoc) {
        const countries = svgDoc.querySelectorAll('path');
        countries.forEach(country => {
          country.addEventListener('click', () => {
            const countryName = country.getAttribute('name');
            if (countryName) {
              // Toggle selection of this country
              if (this.selectedCountries.has(countryName)) {
                this.selectedCountries.delete(countryName);
              } else {
                this.selectedCountries.add(countryName);
              }
              this.updateGraph();
              this.updateMapHighlighting();
            }
          });
          // Add hover effect
          country.addEventListener('mouseover', () => {
            country.style.fill = '#007bff'; // Highlight color
          });

          country.addEventListener('mouseout', () => {
            if (this.selectedCountries.has(country.getAttribute('name') || '')) {
              country.style.fill = '#007bff'; // Keep highlight if selected
            } else {
              country.style.fill = '#CFCFCF'; // Default color
            }
          });
        });
      }
    });
  }


  updateMapHighlighting(): void {
    const svgMap = document.getElementById('europe-map') as HTMLObjectElement;
    const svgDoc = svgMap.contentDocument;
    if (svgDoc) {
      const countries = svgDoc.querySelectorAll('path');
      countries.forEach(country => {
        const countryName = country.getAttribute('d');
        if (this.selectedCountries.has(countryName || '')) {
          country.setAttribute('fill', '#FFD700'); // Highlight color
        } else {
          country.setAttribute('fill', '#CFCFCF'); // Default color
        }
      });
    }
  }
}