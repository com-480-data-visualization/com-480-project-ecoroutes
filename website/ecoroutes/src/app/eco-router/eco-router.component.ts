import { Component } from '@angular/core';
import { RoutesInputComponent } from '../routes-input/routes-input.component';
import { ListRoutesComponent } from '../list-routes/list-routes.component';
import { RouteMapComponent } from '../route-map/route-map.component';

@Component({
  selector: 'app-eco-router',
  standalone: true,
  imports: [RoutesInputComponent,ListRoutesComponent,RouteMapComponent],
  templateUrl: './eco-router.component.html',
  styleUrl: './eco-router.component.scss'
})
export class EcoRouterComponent {

}
