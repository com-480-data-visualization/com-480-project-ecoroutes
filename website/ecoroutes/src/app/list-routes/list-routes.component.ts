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
    this.routes = this.routes.filter(r => r.id !== route.id);
    this.mapRoutesService.deleteRoute(route);
    console.log('Route with ID:', route.id, 'has been deleted.');
  }

}
