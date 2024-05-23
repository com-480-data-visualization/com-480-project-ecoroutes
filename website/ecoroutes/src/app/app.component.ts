import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './navbar/navbar.component';
import { RoutesInputComponent } from './routes-input/routes-input.component';
import { RouteMapComponent } from './route-map/route-map.component';
import { ListRoutesComponent } from './list-routes/list-routes.component';
import { CitiesComponent } from './cities/cities.component';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, RouterOutlet, HttpClientModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'ecoroutes';
}
