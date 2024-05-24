import { Component, Input } from '@angular/core';
import { EcoRoute } from '../ecoroute.model';
import { MapRoutesService } from '../map-routes.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-list-routes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './list-routes.component.html',
  styleUrl: './list-routes.component.scss'
})
export class ListRoutesComponent {

  routes: EcoRoute[] = [];

  constructor(
    private mapRoutesService: MapRoutesService
  ) {
    this.mapRoutesService.getRoutesObservable().subscribe(route => {
      this.routes.push(route);
    });
  }

  deleteRoute(route: EcoRoute) {
    this.routes = this.routes.filter(r => (r.id !== route.id || r.chosenCO2 !== route.chosenCO2));
    this.mapRoutesService.deleteRoute(route);
    console.log('Route with ID:', route.id, 'has been deleted.');
  }

  getCO2(route: EcoRoute): number{
    if(route.chosenCO2=='flight'){
      return this.trunc(route.flightCO2)
    } else if(route.chosenCO2=='train'){
      return this.trunc(route.trainCO2)
    } else{
      return this.trunc(route.avgCO2)
    }
  }

  trunc(value: number): number {
    return Math.trunc(value);
  }

}
