import { Injectable } from '@angular/core';
import L from 'leaflet';
import omnivore from 'leaflet-omnivore';
import { EcoRoute } from '../ecoroute.model';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private map!: L.Map;
  private customIcon = L.icon({
    iconUrl: 'assets/push-pin.png',
    iconSize: [50, 50],
    iconAnchor: [25, 50],
    popupAnchor: [0, -50]
  });

  constructor() { }

  initMap(elementId: string): void {
    this.map = L.map(elementId, {
      center: [54.520008, 13.404954],
      zoom: 5
    });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(this.map);
  }

  searchCity(city: string, cityCount: number, maxDistance: number, ecoRoutes: EcoRoute[]): void {
    const filteredRoutes = ecoRoutes.filter(r => r.departureCity.toLowerCase() === city && r.distance <= maxDistance);
    if (filteredRoutes.length > 0) {
      filteredRoutes.sort((a, b) => a.avgCO2 - b.avgCO2);
      const topCities = filteredRoutes.slice(0, cityCount);
      topCities.forEach(route => this.addRoute(route));

      const firstCityCoords = this.parseCoordinates(topCities[0].departureCoordinates);
      if (firstCityCoords[0] !== -1) {
        this.map.setView(firstCityCoords, 6);
        L.marker(firstCityCoords, { icon: this.customIcon }).addTo(this.map);
      }
    } else {
      alert('No destinations found within the specified distance');
    }
  }

  addRoute(route: EcoRoute): void {
    const kmlFilename = `assets/kml_files_new/${route.departureCity.replace(/ /g, '_')}_to_${route.arrivalCity.replace(/ /g, '_')}.kml`;
    let routeLayers: L.Path[] = []; // Array to store each route segment as L.Path

    omnivore.kml(kmlFilename, null, L.geoJson(null, {
      filter: (feature) => feature.geometry.type !== 'Point',
      style: () => ({
        color: this.getEmissionColor(route.avgCO2),
        weight: 8, // Increased for better mouse interaction
        opacity: 0.7
      }),
      onEachFeature: (feature, layer: L.Path) => { // Ensuring that layer is treated as L.Path
        routeLayers.push(layer); // Store reference to this segment
        layer.on('mouseover', (e) => {
          routeLayers.forEach(l => l.setStyle({
            weight: 10,
            color: '#545454'
          })); // Highlight all segments
          layer.openPopup();
        });
        layer.on('mouseout', (e) => {
          routeLayers.forEach(l => l.setStyle({
            weight: 8,
            color: this.getEmissionColor(route.avgCO2)
          })); // Reset all segments
          layer.closePopup();
        });
        layer.bindPopup(`Route from ${route.departureCity} to ${route.arrivalCity}<br>
        CO2 Emissions: ${route.avgCO2.toFixed(2)} kg<br>
        Energy Consumption: ${route.carEnergyResourceConsumption.toFixed(2)} kWh<br>
        Distance: ${route.distance.toFixed(2)} km<br>
        Train Duration: ${route.trainDuration.toFixed(2)} hours`);
      }
    })).addTo(this.map);
  }


  private getEmissionColor(co2Value: number): string {
    const maxCo2 = 150;
    const minCo2 = 0;
    const ratio = (co2Value - minCo2) / (maxCo2 - minCo2);
    const red = Math.floor(255 * ratio);
    const green = Math.floor(255 * (1 - ratio));
    const blue = 0;
    return `rgb(${red}, ${green}, ${blue})`;
  }

  parseCoordinates(coordString: string): [latitude: number, longitude: number] {
    const regex = /\[(-?\d+\.\d+),\s*(-?\d+\.\d+)\]/;
    const match = coordString.match(regex);

    if (match) {
      const latitude = parseFloat(match[1]);
      const longitude = parseFloat(match[2]);
      return [latitude, longitude];
    } else {
      return [-1, -1];
    }
  }

}
