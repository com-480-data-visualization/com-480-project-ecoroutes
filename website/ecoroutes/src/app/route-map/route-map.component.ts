import { Component } from '@angular/core';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import * as Leaflet from 'leaflet'; 


// import * as L from 'leaflet';

@Component({
  selector: 'app-route-map',
  standalone: true,
  imports: [LeafletModule],
  templateUrl: './route-map.component.html',
  styleUrl: './route-map.component.scss'
})
export class RouteMapComponent {

  constructor() {}

  ngAfterViewInit() {
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

  initMarkers() {
    const initialMarkers = [
      {
        position: { lat: 50.520008, lng: 13.404954 },
        draggable: true
      },
    ];
    for (let index = 0; index < initialMarkers.length; index++) {
      const data = initialMarkers[index];
      const marker = this.generateMarker(data, index);
      marker.addTo(this.map).bindPopup(`<b>${data.position.lat},  ${data.position.lng}</b>`);
      this.map.panTo(data.position);
      this.markers.push(marker)
    }
  }

  generateMarker(data: any, index: number) {
    return Leaflet.marker(data.position, { draggable: data.draggable })
      .on('click', (event) => this.markerClicked(event, index))
      .on('dragend', (event) => this.markerDragEnd(event, index));
  }

  onMapReady($event: Leaflet.Map) {
    this.map = $event;
    // this.initMarkers();
  }

  mapClicked($event: any) {
    console.log($event.latlng.lat, $event.latlng.lng);
  }

  markerClicked($event: any, index: number) {
    console.log($event.latlng.lat, $event.latlng.lng);
  }

  markerDragEnd($event: any, index: number) {
    console.log($event.target.getLatLng());
  } 

}
