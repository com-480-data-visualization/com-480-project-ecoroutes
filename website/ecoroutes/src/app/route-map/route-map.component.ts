import { Component, Input } from '@angular/core';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import * as Leaflet from 'leaflet'; 
import * as d3 from 'd3';
import * as GeographicLib from 'geographiclib-geodesic';
import omnivore from 'leaflet-omnivore';
import 'leaflet-textpath';
import { MapRoutesService } from '../map-routes.service';
import { EcoRoute } from '../ecoroute.model';

@Component({
  selector: 'app-route-map',
  standalone: true,
  imports: [LeafletModule],
  templateUrl: './route-map.component.html',
  styleUrl: './route-map.component.scss'
})
export class RouteMapComponent {

  // @Input() routes: any[] = [];
  routes: { [key: string]: any[] } = {};

  private customSmallIcon = Leaflet.icon({
    iconUrl: 'assets/story.png',
    iconSize: [15, 15], // Size of the icon
    iconAnchor: [7, 7], // Center of the icon
    popupAnchor: [0, -7] // Popup anchor is also centered
  });

  constructor(private mapRoutesService: MapRoutesService) {}

  ngAfterViewInit() {
    this.mapRoutesService.getRoutesObservable().subscribe(route => {
      let res; 
      
      if (route.chosenCO2 == 'train'){
        res = this.plotTrain(route);
      } else if (route.chosenCO2 == 'flight'){
        res = this.plotGreatCircle(route);
      } else{
        res = this.plotAvgLine(route);
      }

      this.routes[route.id+route.chosenCO2] = res;
      
    })

    this.mapRoutesService.getDeleteRouteObservable().subscribe(route => {
      let res = this.routes[route.id+route.chosenCO2];
      res.filter(r => r!=null).forEach(r =>  this.map.removeLayer(r));
      delete this.routes[route.id+route.chosenCO2];
    })
  
  }

  map!: Leaflet.Map;
  markers: Leaflet.Marker[] = [];
  options = {
    layers: [
      // Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      //   attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      // })
      Leaflet.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      })
    ],
    zoom: 4,
    center: { lat: 54.520008, lng: 13.404954 }
  }

  onMapReady($event: Leaflet.Map) {
    this.map = $event;
  }

  mapClicked($event: any) {
    console.log($event.latlng.lat, $event.latlng.lng);
  }

  // plot

  plotAvgLine(d:EcoRoute){
    let color = this.getEmissionColor(d.avgCO2W);
    let depCoord = this.parseCoordinates(d.departureCoordinates)
    let arrCoord = this.parseCoordinates(d.arrivalCoordinates)
    let routeLayers: any[] = [];


    var latlngs = [
      depCoord,
      arrCoord
    ];

    // var depCirc = Leaflet.circle(depCoord, {
    //   color: color,
    //   fillColor: color,
    //   fillOpacity: 0.5,
    //   radius: 50000
    // }).addTo(this.map);

    // var arrCirc = Leaflet.circle(arrCoord, {
    //   color: color,
    //   fillColor: color,
    //   fillOpacity: 0.5,
    //   radius: 50000
    // }).addTo(this.map);

    var polyline = Leaflet.polyline(latlngs, {color: color, weight: 5}).addTo(this.map);
    routeLayers.push(polyline);

    polyline.bindPopup(`Route from ${d.departureCity} to ${d.arrivalCity}<br>
    Average CO2 Emissions: ${d.avgCO2.toFixed(2)} kg<br>
    Average Energy Consumption: ${d.avgERC.toFixed(2)} kWh<br>`);

    polyline.on('mouseover', (e) => {
      polyline.setStyle({
        weight: 8,
        color: '#545454'
      }) // Highlight all segments
      polyline.openPopup();
    });
    polyline.on('mouseout', (e) => {
      polyline.setStyle({
        weight: 5,
        color: this.getEmissionColor(d.flightCO2)
      }) // Reset all segments
      polyline.closePopup();
    });

    this.map.fitBounds(polyline.getBounds().pad(0.2));

    let arrPin =  Leaflet.marker(arrCoord, {icon: this.customSmallIcon});
    routeLayers.push(arrPin);
    arrPin.addTo(this.map);
    let depPin = Leaflet.marker(depCoord, {icon: this.customSmallIcon});
    routeLayers.push(depPin);
    depPin.addTo(this.map);

    // polyline.bindTooltip(d.id+" ("+d.chosenCO2+"): "+d.avgCO2W, {permanent: false, direction: 'auto', sticky: true, className: 'my-label'});

    return routeLayers;
  }

  plotGreatCircle(d:EcoRoute) {
    let color = this.getEmissionColor(d.flightCO2);
    let routeLayers: any[] = [];

    let depCoord = this.parseCoordinates(d.departureCoordinates)
    let arrCoord = this.parseCoordinates(d.arrivalCoordinates)

    var latlngs = [
      depCoord,
      arrCoord
    ];

    var geodesic = GeographicLib.Geodesic.WGS84;
    var numPoints = 100;  // Number of points in the polyline
    var l = geodesic.InverseLine(depCoord[0], depCoord[1], arrCoord[0], arrCoord[1]);
    var step = l.s13 / numPoints;
    var points = [];

    for (var i = 0; i <= numPoints; ++i) {
        var p = l.Position(i * step);
        points.push([p.lat2, p.lon2]);
    }

    var polyline = Leaflet.polyline(points, {color: color, weight: 5}).addTo(this.map);
    routeLayers.push(polyline);
    polyline.bindPopup(`Flight Route from ${d.departureCity} to ${d.arrivalCity}<br>
      Flight CO2 Emissions: ${d.flightCO2.toFixed(2)} kg<br>
      Flight Energy Consumption: ${d.flightEnergyResourceConsumption.toFixed(2)} kWh<br>
      Flight Duration: ${d.flightDuration.toFixed(2)} hours`);
    polyline.on('mouseover', (e) => {
      polyline.setStyle({
        weight: 8,
        color: '#545454'
      }) // Highlight all segments
      polyline.openPopup();
    });
    polyline.on('mouseout', (e) => {
      polyline.setStyle({
        weight: 5,
        color: this.getEmissionColor(d.flightCO2)
      }) // Reset all segments
      polyline.closePopup();
    });
    let arrPin =  Leaflet.marker(arrCoord, {icon: this.customSmallIcon});
    routeLayers.push(arrPin);
    arrPin.addTo(this.map);
    let depPin = Leaflet.marker(depCoord, {icon: this.customSmallIcon});
    routeLayers.push(depPin);
    depPin.addTo(this.map);
    // polyline.bindTooltip(d.id+" ("+d.chosenCO2+"): "+d.avgCO2W, {permanent: false, direction: 'auto', sticky: true, className: 'my-label'});
    this.map.fitBounds(polyline.getBounds().pad(0.2));
    return routeLayers;
  }

  plotTrain(route: EcoRoute) {
    const kmlFilename = `assets/kml_files_new/${route.departureCity.replace(/ /g, '_')}_to_${route.arrivalCity.replace(/ /g, '_')}.kml`;
    let routeLayers: any[] = []; // Array to store each route segment as L.Path

    let l = omnivore.kml(kmlFilename, null, Leaflet.geoJson(null, {
      filter: (feature) => feature.geometry.type !== 'Point',

      style: () => ({
        color: this.getEmissionColor(route.trainCO2),
        weight: 4, // Increased for better mouse interaction
        opacity: 0.7
      }),
      onEachFeature: (feature, layer: L.Path) => { // Ensuring that layer is treated as L.Path
        
          routeLayers.push(layer); // Store reference to this segment
          layer.on('mouseover', (e) => {
            routeLayers.forEach(l => {
              if(l.feature){
                l.setStyle({
                  weight: 8,
                  color: '#545454'
                })
              }
          }); // Highlight all segments
            layer.openPopup();
          });
          layer.on('mouseout', (e) => {
            routeLayers.forEach(l => {
              if(l.feature){
                l.setStyle({
                weight: 4,
                color: this.getEmissionColor(route.trainCO2)
                })
              }
          }); // Reset all segments
            layer.closePopup();
          });
          layer.bindPopup(`Train Route from ${route.departureCity} to ${route.arrivalCity}<br>
          Train CO2 Emissions: ${route.trainCO2.toFixed(2)} kg<br>
          Train Energy Consumption: ${route.trainEnergyResourceConsumption.toFixed(2)} kWh<br>
          Train Duration: ${route.trainDuration.toFixed(2)} hours`);
        
      }
    }))

    // this.map.fitBounds(routeLayers[0].getBounds());
    
    l.addTo(this.map).on('ready', () => {
      
      let coords = (routeLayers[0] as L.Polyline).getLatLngs()
      const depCoord = coords[0] as L.LatLng;
      const arrCoord = coords[coords.length-1] as L.LatLng;  

      this.map.fitBounds((routeLayers[0] as L.Polyline).getBounds().pad(0.2));

      let depPin = Leaflet.marker(arrCoord, { icon: this.customSmallIcon })
      depPin.addTo(this.map);
      routeLayers.push(depPin);
      let arrPin = Leaflet.marker(depCoord, { icon: this.customSmallIcon })
      arrPin.addTo(this.map);
      routeLayers.push(arrPin);
    });
  

    return routeLayers;
  }

  private getEmissionColor(co2Value: number): string {
    const maxCo2 = 150; // Adjust this value based on data
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

  parseCoordinates(coordString: string): [ latitude: number, longitude: number ] {
    // Regular expression to extract numbers from the coordinate string
    const regex = /\[(-?\d+\.\d+),\s*(-?\d+\.\d+)\]/;
    const match = coordString.match(regex);

    if (match) {
        // Convert string matches to numbers
        const latitude = parseFloat(match[1]);
        const longitude = parseFloat(match[2]);

        return [ latitude, longitude ];
    } else {
        // Return null if the string format is incorrect
        return [ -1, -1];
    }
  }

}
