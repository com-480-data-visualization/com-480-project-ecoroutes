import { Injectable, EventEmitter } from '@angular/core';
import L from 'leaflet';
import omnivore from 'leaflet-omnivore';
import { EcoRoute } from '../ecoroute.model';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  searchResults = new EventEmitter<any[]>();

  private map!: L.Map;
  private customSmallIcon = L.icon({
    iconUrl: 'assets/story.png',
    iconSize: [15, 15], // Size of the icon
    iconAnchor: [7, 7], // Center of the icon
    popupAnchor: [0, -7] // Popup anchor is also centered
  });


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
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(this.map);


    this.addLegend(); // Call to add the legend when initializing the map

  }

  searchCity(city: string, cityCount: number, maxDistance: number, ecoRoutes: EcoRoute[]): void {
    const filteredRoutes = ecoRoutes.filter(r => r.departureCity.toLowerCase() === city && r.distance <= maxDistance);
    if (filteredRoutes.length > 0) {
      filteredRoutes.sort((a, b) => a.trainCO2 - b.trainCO2);
      const topCities = filteredRoutes.slice(0, cityCount);

      // Emit the search results for the bar plot
      this.searchResults.emit(topCities.map(route => ({
        arrivalCity: route.arrivalCity,
        avgCO2: route.trainCO2
      })));

      topCities.reverse().forEach(route => this.addRoute(route)); // reverse to draw the shorter routes first

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
    let departureCityFormatted;
    let arrivalCityFormatted;
    // Add handles for reading the path for Madrid City because it has a Space
    if (route.departureCity === "Madrid City") {
      departureCityFormatted = "Madrid City";
    } else {
      departureCityFormatted = route.departureCity.replace(/ /g, '_');
    }

    if (route.arrivalCity === "Madrid City") {
      arrivalCityFormatted = "Madrid City";
    } else {
      arrivalCityFormatted = route.arrivalCity.replace(/ /g, '_');
    }

    const kmlFilename = `assets/kml_files_new/${departureCityFormatted}_to_${arrivalCityFormatted}.kml`;

    let routeLayers: L.Path[] = []; // Array to store each route segment as L.Path
    console.log(`Constructed KML filename: ${kmlFilename}`); // Debug statement

    omnivore.kml(kmlFilename, null, L.geoJson(null, {
      filter: (feature) => feature.geometry.type !== 'Point',
      style: () => ({
        color: this.getEmissionColor(route.trainCO2),
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
            color: this.getEmissionColor(route.trainCO2)
          })); // Reset all segments
          layer.closePopup();
        });
        layer.bindPopup(`Route from ${route.departureCity} to ${route.arrivalCity}<br>
          CO2 Emissions: ${route.trainCO2.toFixed(2)} kg<br>
          Energy Consumption: ${route.trainEnergyResourceConsumption.toFixed(2)} kWh<br>
          Distance: ${route.distance.toFixed(2)} km<br>
          Train Duration: ${route.trainDuration.toFixed(2)} hours`);
      }
    })).addTo(this.map).on('ready', () => {
      const lastCoord = (routeLayers[routeLayers.length - 1] as L.Polyline).getLatLngs().slice(-1)[0] as L.LatLng;

      L.marker(lastCoord, { icon: this.customSmallIcon }).addTo(this.map);
    });
  }



  private getEmissionColor(co2Value: number): string {
    // Define CO2 value range
    const maxCo2 = 30; // avg CO2 train value
    const minCo2 = 0;

    const ratio = (co2Value - minCo2) / (maxCo2 - minCo2);

    let red, green;

    if (ratio <= 0.5) {
      // Interpolate from green to yellow
      red = Math.floor(255 * (ratio * 2)); // 0 to 255 as ratio goes from 0 to 0.5
      green = 255; // Constant
    } else {
      // Interpolate from yellow to red
      red = 255; // Constant
      green = Math.floor(255 * ((1 - ratio) * 2)); // 255 to 0 as ratio goes from 0.5 to 1
    }

    return `rgb(${red}, ${green}, 0)`; // Keep blue at 0 throughout
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

  addLegend(): void {
    const legend = new L.Control({ position: 'bottomright' });

    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'info legend');
      const gradientHtml = `
        <div class="legend-gradient" style="height: 10px; width: 100%; background: linear-gradient(to right, ${this.getEmissionColor(0)}, ${this.getEmissionColor(15)}, ${this.getEmissionColor(30)});">
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
