import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as d3 from 'd3';
import { EcoRoute } from '../ecoroute.model';
import { MapRoutesService } from '../map-routes.service';
import { Observable, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-routes-input',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './routes-input.component.html',
  styleUrl: './routes-input.component.scss'
})
export class RoutesInputComponent {

  constructor(
    private mapRouteService: MapRoutesService,
    private http: HttpClient
  ) {
  }

  data: { [key: string]: EcoRoute } = {};
  cities: string[] = [];
  filteredCities: string[] = [];
  searching: any;

  route = {
    departure: '',
    destination: '',
    transport: {
      plane: false,
      train: false,
      average: false
    }
  };

  ngOnInit() {
    this.getCities().subscribe(cities => {
      this.cities = cities;
    });
  }

  ngAfterViewInit() {
    d3.csv('assets/final_dataset_new.csv').then(data => {
      data.forEach(d => {
        let route = new EcoRoute(d);
        this.data[route.id] = route;
      });

      // this.route = {
      //   departure: 'Lausanne',
      //   destination: 'Berlin',
      //   transport: {
      //     plane: true,
      //     train: true,
      //     average: true
      //   }
      // }
      // this.addRoute();

      // this.route = {
      //   departure: 'Lausanne',
      //   destination: 'Paris',
      //   transport: {
      //     plane: true,
      //     train: true,
      //     average: true
      //   }
      // }
      // this.addRoute();

    })
  }

  addRoute() {
    console.log('Adding route:', this.route);
    let id = this.route.departure + ' to ' + this.route.destination;
    let route = this.data[id];

    console.log(route);
    if (!route) {
      alert('No route available between these cities in our database');
      return;
    }
    if (this.route.transport.plane) {

      if (route.flightCO2 == 0) {
        alert("No flights available between these cities")
        return;
      }

      route = JSON.parse(JSON.stringify(route))
      route.chosenCO2 = 'flight';
      this.mapRouteService.addRoute(route);
    }
    if (this.route.transport.train) {
      route = JSON.parse(JSON.stringify(route))
      route.chosenCO2 = 'train';
      this.mapRouteService.addRoute(route);
    }
    if (this.route.transport.average && route.flightCO2 != 0) {
      route = JSON.parse(JSON.stringify(route))
      route.avgCO2 = (route.flightCO2 + route.trainCO2) / 2;
      route.chosenCO2 = 'avg';
      this.mapRouteService.addRoute(route);
    }

    // Implement your logic to handle the route addition here
  }

  selectCity(city: string, writeTo: any): void {
    if (writeTo === 'departure') this.route.departure = city;
    else this.route.destination = city;
    this.filteredCities = [];
  }

  search(term: any, searching: any) {
    if (!term) {
      this.filteredCities = [];
      this.searching = null;
    } else {
      this.searching = searching;
      console.log(searching)
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
}
