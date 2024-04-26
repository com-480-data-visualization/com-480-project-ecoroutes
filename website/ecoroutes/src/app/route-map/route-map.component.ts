import { Component } from '@angular/core';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import * as Leaflet from 'leaflet'; 
import * as d3 from 'd3';

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
    d3.csv('assets/final_dataset.csv').then(data => {
      let d1 = data[0];
      // d3.csvParse(data[0], d => {
      // })
      console.log(d1);
      this.plotLine(d1);
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

  plotLine(d:any){
    const svg = d3.select(this.map.getPanes().overlayPane).append("svg"),
        g = svg.append("g").attr("class", "leaflet-zoom-hide");

    let depCoord = this.parseCoordinates(d['Departure Coordinates'])
    let arrCoord = this.parseCoordinates(d['Arrival Coordinates'])

    console.log(depCoord, arrCoord)

    let x1 = this.map.latLngToLayerPoint(depCoord).x;
    let y1 = this.map.latLngToLayerPoint(depCoord).y;
    let x2 = this.map.latLngToLayerPoint(arrCoord).x;
    let y2 = this.map.latLngToLayerPoint(arrCoord).y;

    var latlngs = [
      depCoord,
      arrCoord
    ];

    var polyline = Leaflet.polyline(latlngs, {color: 'blue'}).addTo(this.map);

    // svg.selectAll('line')
    //   .data([d])
    //   .enter()
    //   .append('line')
    //   .attr('x1', x1)
    //   .attr('y1', y1)
    //   .attr('x2', x2)
    //   .attr('y2', y2)
    //   .attr('stroke-width', 2)
    //   .attr('stroke', 'blue')

    // g.append("line")
    //   .attr("x1", x1)
    //   .attr("y1", y1)
    //   .attr("x2", x2)
    //   .attr("y2", y2)
    //   .attr("stroke", "blue")
    //   .attr("stroke-width", 3);

  }

  parseCoordinates(coordString: string): [ latitude: number, longitude: number ] {
    // Regular expression to extract numbers from the coordinate string
    const regex = /\{(-?\d+\.\d+),\s*(-?\d+\.\d+)\}/;
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
