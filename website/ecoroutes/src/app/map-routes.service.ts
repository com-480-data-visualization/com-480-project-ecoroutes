import { Injectable } from '@angular/core';
import { BehaviorSubject, ReplaySubject, Subject } from 'rxjs';
import { EcoRoute } from './ecoroute.model';

@Injectable({
  providedIn: 'root'
})
export class MapRoutesService {

  _routes: ReplaySubject<EcoRoute> = new ReplaySubject<EcoRoute>();
  _deleteRoute: Subject<EcoRoute> = new Subject<EcoRoute>();
  routes: EcoRoute[] = [];


  constructor() { }

  addRoute(route: EcoRoute) {
    console.log('Adding route:', route);
    this.routes.push(route);
    this._routes.next(route);
  }

  getRoutes() {
    return this.routes;
  }

  getRoutesObservable() {
    return this._routes.asObservable();
  }

  getDeleteRouteObservable() {
    return this._deleteRoute.asObservable();
  }

  deleteRoute(route: EcoRoute) {
    this.routes = this.routes.filter(r => r.id !== route.id);
    this._deleteRoute.next(route);
  }
}