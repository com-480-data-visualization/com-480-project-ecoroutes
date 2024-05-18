import { Component, OnInit } from '@angular/core';
import L from 'leaflet'  // // for TypeScript
import { EcoRoute } from '../ecoroute.model';
import * as d3 from 'd3';
import omnivore from 'leaflet-omnivore';


@Component({
  selector: 'app-cities',
  templateUrl: './cities.component.html',
  styleUrls: ['./cities.component.scss'],
})

export class CitiesComponent implements OnInit {
  private map!: L.Map;
  ecoRoutes: EcoRoute[] = [];  // Array to hold all routes for search operations
  data: { [key: string]: EcoRoute } = {};  // Dictionary to access routes by ID
  private customIcon = L.icon({
    iconUrl: 'assets/push-pin.png', // TOOD: Change this
    iconSize: [50, 50],
    iconAnchor: [25, 50],
    popupAnchor: [0, -50]
  });
  constructor() { }

  ngOnInit(): void {
    this.initMap();
    this.loadCSVData();
  }

  loadCSVData(): void {
    d3.csv('assets/final_dataset_new.csv').then(data => {
      data.forEach(d => {
        let route = new EcoRoute(d);
        this.data[route.id] = route;
        this.ecoRoutes.push(route);  // Add route to the array for easy search access
      });
    }).catch(error => console.error('Error loading CSV data:', error));
  }

  initMap(): void {
    this.map = L.map('map', {
      center: [54.520008, 13.404954], // Center of the map, adjust as needed
      zoom: 5
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(this.map);
  }

  parseCoordinates(coordString: string): [latitude: number, longitude: number] {
    // Regular expression to extract numbers from the coordinate string
    const regex = /\[(-?\d+\.\d+),\s*(-?\d+\.\d+)\]/;
    const match = coordString.match(regex);

    if (match) {
      // Convert string matches to numbers
      const latitude = parseFloat(match[1]);
      const longitude = parseFloat(match[2]);

      return [latitude, longitude];
    } else {
      // Return null if the string format is incorrect
      return [-1, -1];
    }
  }

  getEmissionColor(co2Value: number): string {
    const maxCo2 = 150;
    const minCo2 = 0;
    const ratio = (co2Value - minCo2) / (maxCo2 - minCo2);

    const red = Math.floor(255 * ratio);
    const green = Math.floor(255 * (1 - ratio));
    const blue = 0;

    return `rgb(${red}, ${green}, ${blue})`;
  }

  searchCity(): void {
    const city = (document.getElementById('citySearch') as HTMLInputElement).value.toLowerCase();
    const cityCount = parseInt((document.getElementById('cityCount') as HTMLInputElement).value, 10);
    const maxDistance = parseFloat((document.getElementById('maxDistance') as HTMLInputElement).value);
    const relevantRoutes = this.ecoRoutes.filter(r => r.departureCity.toLowerCase() === city && r.distance <= maxDistance);

    if (relevantRoutes.length > 0) {
      relevantRoutes.sort((a, b) => a.avgCO2 - b.avgCO2);
      const topCities = relevantRoutes.slice(0, cityCount);

      topCities.forEach(route => {
        const kmlFilename = `assets/kml_files_new/${route.departureCity.replace(/ /g, '_')}_to_${route.arrivalCity.replace(/ /g, '_')}.kml`;

        const kmlLayer = omnivore.kml(kmlFilename, null, L.geoJson(null, {
          filter: (feature) => {
            // Only add non-Point geometries to the map
            return feature.geometry.type !== 'Point';
          },
          style: () => ({
            color: this.getEmissionColor(route.avgCO2),  // Set path color based on CO2 emissions
            weight: 4,
            opacity: 0.7
          }),
          onEachFeature: (feature, layer) => {
            if (feature.geometry.type !== 'Point') {
              layer.bindPopup(`Route from ${route.departureCity} to ${route.arrivalCity}<br>
              CO2 Emissions: ${route.avgCO2.toFixed(2)} kg<br>
              Energy Consumption: ${route.carEnergyResourceConsumption.toFixed(2)} kWh<br>
              Distance: ${route.distance.toFixed(2)} km<br>
              Train Duration: ${route.trainDuration.toFixed(2)} hours`);
            }
          }
        })).addTo(this.map);
      });

      const firstCityCoords = this.parseCoordinates(topCities[0].departureCoordinates);
      if (firstCityCoords[0] !== -1) {
        this.map.setView(firstCityCoords, 6);
        L.marker(firstCityCoords, { icon: this.customIcon }).addTo(this.map);
      }
    } else {
      alert('No destinations found within the specified distance');
    }
  }

}