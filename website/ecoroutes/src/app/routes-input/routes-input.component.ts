import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as d3 from 'd3';
import { EcoRoute } from '../ecoroute.model';
import { MapRoutesService } from '../map-routes.service';

@Component({
  selector: 'app-routes-input',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './routes-input.component.html',
  styleUrl: './routes-input.component.scss'
})
export class RoutesInputComponent {

  constructor(private mapRouteService: MapRoutesService) {}

  data: {[key: string]: EcoRoute} = {};

  route = {
    departure: '',
    destination: '',
    transport: {
      plane: false,
      train: false,
      average: false
    }
  };

  ngAfterViewInit() {
    d3.csv('assets/final_dataset_new.csv').then(data => {
      data.forEach(d => {
        let route = new EcoRoute(d);
        this.data[route.id] = route;
      });
      let d2 = new EcoRoute(data[2194]);
      this.mapRouteService.addRoute(d2);
      let d3 = new EcoRoute(data[1912]);
      this.mapRouteService.addRoute(d3);
    })
  }

  addRoute() {
    console.log('Adding route:', this.route);
    let id = this.route.departure + ' to ' + this.route.destination;
    let route = this.data[id];
    if (!route) {
      console.log('Route not found:', id);
      return;
    }
    this.mapRouteService.addRoute(route);
    // Implement your logic to handle the route addition here
  }

}
