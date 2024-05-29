import { Component } from '@angular/core';
import { RoutesInputComponent } from '../routes-input/routes-input.component';
import { ListRoutesComponent } from '../list-routes/list-routes.component';
import { RouteMapComponent } from '../route-map/route-map.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RoutesInputComponent,ListRoutesComponent,RouteMapComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

}
