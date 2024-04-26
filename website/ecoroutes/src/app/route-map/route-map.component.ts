import { Component, Input } from '@angular/core';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import * as Leaflet from 'leaflet'; 
import * as d3 from 'd3';
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

  constructor(private mapRoutesService: MapRoutesService) {}

  ngAfterViewInit() {
    this.mapRoutesService.getRoutesObservable().subscribe(route => {
      let res;
      if (route.avgCO2W>200){
        res = this.plotLine(route,'red');
      } else if (route.avgCO2W>150){
        res = this.plotLine(route,'yellow');
      } else{
        res = this.plotLine(route,'green');
      }
      this.routes[route.id] = res;
      
    })

    this.mapRoutesService.getDeleteRouteObservable().subscribe(route => {
      let res = this.routes[route.id];
      res.forEach(r => this.map.removeLayer(r));
      delete this.routes[route.id];
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

  plotLine(d:EcoRoute,color:string='blue'){
    let depCoord = this.parseCoordinates(d.departureCoordinates)
    let arrCoord = this.parseCoordinates(d.arrivalCoordinates)

    var latlngs = [
      depCoord,
      arrCoord
    ];

    var depCirc = Leaflet.circle(depCoord, {
      color: color,
      fillColor: color,
      fillOpacity: 0.5,
      radius: 50000
    }).addTo(this.map);

    var arrCirc = Leaflet.circle(arrCoord, {
      color: color,
      fillColor: color,
      fillOpacity: 0.5,
      radius: 50000
    }).addTo(this.map);

    var polyline = Leaflet.polyline(latlngs, {color: color}).addTo(this.map);
    
    polyline.bindTooltip(d.id+": "+d.avgCO2W, {permanent: false, direction: 'auto', sticky: true, className: 'my-label'});

    return [depCirc,arrCirc,polyline];
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
