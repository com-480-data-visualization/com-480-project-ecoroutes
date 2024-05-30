import { Injectable, EventEmitter } from '@angular/core';
import L from 'leaflet';
import omnivore from 'leaflet-omnivore';
import { EcoRoute } from '../ecoroute.model';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  searchResults = new EventEmitter<any[]>();
  routes: any[][] = [];

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
      zoom: 5,
      scrollWheelZoom: false
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

      this.removeRoutes()

      this.searchResults.emit(topCities.map(route => ({
        arrivalCity: route.arrivalCity,
        avgCO2: route.trainCO2,
      })));

      topCities.reverse().forEach(route => this.addRoute(route)); // reverse to draw the shorter routes first

      const firstCityCoords = this.parseCoordinates(topCities[0].departureCoordinates);
      if (firstCityCoords[0] !== -1) {
        this.map.setView(firstCityCoords, 7);
        let marker = L.marker(firstCityCoords, { icon: this.customIcon })
        marker.addTo(this.map);
        this.routes.push([marker]);
      }

    } else {
      alert('No destinations found within the specified distance');
    }
  }

  removeRoutes(): void {
    this.routes.forEach(route => {
      route.forEach(layer => {
        this.map.removeLayer(layer);
      });
    });
    this.routes = [];
  }

  addRoute(route: EcoRoute): void {
    let departureCityFormatted;
    let arrivalCityFormatted;
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

    let routeLayers: any[] = [];

    omnivore.kml(kmlFilename, null, L.geoJson(null, {
      filter: (feature) => feature.geometry.type !== 'Point',
      style: () => ({
        color: this.getEmissionColor(route.trainCO2),
        weight: 8,
        opacity: 0.7
      }),
      onEachFeature: (feature, layer: L.Path) => {
        routeLayers.push(layer);
        layer.on('mouseover', (e) => {
          routeLayers.forEach(l => {
            if (l.feature) {
              l.setStyle({
                weight: 10,
                color: '#545454'
              })
            }
          });
          layer.openPopup();
        });
        layer.on('mouseout', (e) => {
          routeLayers.forEach(l => {
            if (l.feature) {
              l.setStyle({
                weight: 8,
                color: this.getEmissionColor(route.trainCO2)
              })
            }
          }); // Reset all segments
          layer.closePopup();
        });
        layer.bindPopup(`Route from ${route.departureCity} to ${route.arrivalCity}<br>
          CO2 Emissions: ${route.trainCO2.toFixed(2)} kg<br>
          Energy Consumption: ${route.trainEnergyResourceConsumption.toFixed(2)} kWh<br>
          Distance: ${route.distance.toFixed(2)} km<br>
          Train Duration: ${this.formatDuration(route.trainDuration)}`);
      }
    })).addTo(this.map).on('ready', () => {
      const lastCoord = (routeLayers[routeLayers.length - 1] as L.Polyline).getLatLngs().slice(-1)[0] as L.LatLng;

      let marker = L.marker(lastCoord, { icon: this.customSmallIcon })
      routeLayers.push(marker); // Add the marker to the route layers
      marker.addTo(this.map);
    });

    this.routes.push(routeLayers);
  }

  formatDuration(duration: number): string {
    const hours = Math.floor(duration);
    const minutes = Math.round((duration - hours) * 60);
    return `${hours}h ${minutes}m`;
  }

  private getEmissionColor(co2Value: number): string {
    const maxCo2 = 30;
    const minCo2 = 0;

    const ratio = (co2Value - minCo2) / (maxCo2 - minCo2);

    let red, green;

    if (ratio <= 0.5) {
      red = Math.floor(255 * (ratio * 2));
      green = 255;
    } else {
      red = 255;
      green = Math.floor(255 * ((1 - ratio) * 2));
    }

    return `rgb(${red}, ${green}, 0)`;
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
    const legend = new L.Control({ position: 'bottomleft' });

    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'info legend');
      const gradientHtml = `
        <div class="legend-gradient" style="height: 10px; width: 100%; background: linear-gradient(to right, ${this.getEmissionColor(0)}, ${this.getEmissionColor(15)}, ${this.getEmissionColor(30)});">
        </div>
        <div class="legend-scale">
          <span>0 kg</span><span style="float: right;">30 kg</span>
        </div>`;

      div.style.backgroundColor = 'white';
      div.style.padding = '10px';
      div.style.boxShadow = '0 0 15px rgba(0,0,0,0.2)';
      div.style.borderRadius = '5px';

      div.innerHTML = `<div><strong>CO2 Emissions (kg)</strong></div>${gradientHtml}`;
      return div;
    };

    legend.addTo(this.map);
  }

}
