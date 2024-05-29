import { Routes } from '@angular/router';
import { EcoRouterComponent } from './eco-router/eco-router.component';
import { CitiesComponent } from './cities/cities.component';
import { RegionsComponent } from './regions/regions.component';
import { HomeComponent } from './home/home.component';

export const routes: Routes = [
    {path: '', redirectTo: 'home', pathMatch: 'full'},
    {path: 'home', component: HomeComponent},
    {path: 'eco-router', component: EcoRouterComponent},
    {path: 'cities', component: CitiesComponent},
    {path: 'regions', component: RegionsComponent},
];
