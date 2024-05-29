import { Component, OnInit, OnDestroy } from '@angular/core';
import { MapService } from '../cities-services/map.service';
import { DataService } from '../cities-services/data.service';
import { GraphService } from '../cities-services/graph.service';
import { BarPlotService } from '../cities-services/bar-plot.service';
import { Observable, Subscription, map } from 'rxjs';

import * as d3 from 'd3';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cities',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cities.component.html',
  styleUrls: ['./cities.component.scss']
})

export class CitiesComponent implements OnInit {
  currentView: 'city' | 'country' | 'region' = 'city';
  selectedCountries: Set<string> = new Set();
  selectedCities: Set<string> = new Set(); // New variable for city selections
  flagsData: any[] = [];  // Store flags data
  private searchResultsSub!: Subscription;
  filteredCities: any[] = [];
  cities: string[] = [];
  cityInput: string = '';

  constructor(
    private mapService: MapService,
    private dataService: DataService,
    private graphService: GraphService,
    private barPlotService: BarPlotService,
    private http: HttpClient
  ) { }

  ngOnInit(): void {

  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.mapService.initMap('map');
      this.dataService.loadCSVData().then(() => {
        this.graphService.initGraph('graph');

        // Pre-select countries
        this.selectedCountries.add('Switzerland');
        this.selectedCountries.add('Germany');

        // Update graph and map highlighting with initial selections
        this.updateGraph();
        this.updateMapHighlighting();

        this.initMapClickHandler();
        this.setDefaultMapView();
      });

      this.searchResultsSub = this.mapService.searchResults.subscribe(data => {
        this.barPlotService.drawBarPlot(data, 'co2BarPlot');
      });

      this.getCities().subscribe(cities => {
        this.cities = cities;
      });
    }, 200);
  }

  ngOnDestroy(): void {
    if (this.searchResultsSub) {
      this.searchResultsSub.unsubscribe(); // Clean up the subscription
    }
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

    const applyInteractions = (svgDoc: Document) => {
      const countries = svgDoc.querySelectorAll('path');
      countries.forEach(country => {
        const countryName = country.getAttribute('name') || ''; // Default to empty string if null

        // Initially set or reset the fill based on selection status
        country.style.fill = this.selectedCountries.has(countryName) ? '#8ed99d' : 'rgb(235 235 235)';

        // Setup click event to toggle selection
        country.addEventListener('click', () => {
          if (countryName) {
            if (this.selectedCountries.has(countryName)) {
              this.selectedCountries.delete(countryName);
              country.style.fill = 'rgb(235 235 235)'; // Reset color
            } else {
              this.selectedCountries.add(countryName);
              country.style.fill = '#8ed99d'; // Highlight color
            }
            this.updateGraph();
            this.updateMapHighlighting();
          }
        });

        // Add hover effects
        country.addEventListener('mouseover', () => {
          country.style.fill = '#8ed99d'; // Highlight color on hover
        });

        country.addEventListener('mouseout', () => {
          country.style.fill = this.selectedCountries.has(countryName) ? '#8ed99d' : 'rgb(235 235 235)'; // Default or highlight color
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


  updateMapHighlighting(): void {
    const svgMap = document.getElementById('europe-map') as HTMLObjectElement;
    const svgDoc = svgMap.contentDocument;
    if (svgDoc) {
      const countries = svgDoc.querySelectorAll('path');
      countries.forEach(country => {
        const countryName = country.getAttribute('name') || ''; // Default to empty string if null
        if (this.selectedCountries.has(countryName)) {
          country.setAttribute('fill', '#007bff'); // Highlight color
        } else {
          country.setAttribute('fill', '#CFCFCF'); // Default color
        }
      });
    }
  }

  updateBarPlot(data: any[]): void {
    this.barPlotService.drawBarPlot(data, 'co2BarPlot');
  }

  selectCity(city: string): void {
    this.cityInput = city;
    this.filteredCities = [];
  }



  search(term: any) {
    if (!term) {
      this.filteredCities = [];
    } else {
      this.filteredCities = this.cities
        .filter(city => city.toLowerCase().includes(term.toLowerCase()))
        .sort((a, b) => a.toLowerCase().indexOf(term.toLowerCase()) - b.toLowerCase().indexOf(term.toLowerCase()))
        .slice(0, 10);
    }
  }

  getCities(): Observable<string[]> {
    return this.http.get<string>('assets/cities.txt', { responseType: 'text' as 'json' }).pipe(
      map(data => data.split('\n')))
  }

  setDefaultMapView(): void {
    const defaultCity = 'venice';
    const defaultCityCount = 4; // Example value
    const defaultMaxDistance = 300; // Example value
    this.mapService.searchCity(defaultCity, defaultCityCount, defaultMaxDistance, this.dataService.getEcoRoutes());
  }

}