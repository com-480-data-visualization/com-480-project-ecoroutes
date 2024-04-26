import { Routes } from '@angular/router';
import { EcoRouterComponent } from './eco-router/eco-router.component';
import { CitiesComponent } from './cities/cities.component';
import { RegionsComponent } from './regions/regions.component';

export const routes: Routes = [
    {path: '', redirectTo: 'eco-router', pathMatch: 'full'},
    {path: 'eco-router', component: EcoRouterComponent},
    {path: 'cities', component: CitiesComponent},
    {path: 'regions', component: RegionsComponent},
];
