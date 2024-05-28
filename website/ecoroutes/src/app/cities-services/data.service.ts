import { Injectable } from '@angular/core';
import * as d3 from 'd3';
import { EcoRoute } from '../ecoroute.model';

interface LinkData {
  source: string;
  target: string;
  weight: number;
  sourceCountry: string;
  targetCountry: string;
  sourceRegion: string;
  targetRegion: string;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private ecoRoutes: EcoRoute[] = [];
  cityNodes: string[] = [];
  cityLinks: LinkData[] = [];
  countryNodes: string[] = [];
  countryLinks: LinkData[] = [];
  regionNodes: string[] = [];
  regionLinks: LinkData[] = [];

  constructor() { }

  public getEcoRoutes(): EcoRoute[] {
    return this.ecoRoutes;
  }

  getCountryByCity(city: string): string {
    return this.ecoRoutes.find(route => route.departureCity === city)?.departureCountry || '';
  }

  // // DataService for connectivty map if needed.
  // public getAllRoutesWithinDistance(maxDistance: number): EcoRoute[] {
  //   return this.ecoRoutes.filter(route => route.distance <= maxDistance);
  // }

  public getSortedCityNodes(): any[] {
    // Assuming you have a way to associate each city with a country, e.g., a map or a method
    return this.cityNodes
      .map(city => ({
        name: city,
        country: this.getCountryByCity(city) // This method needs to correctly return the country for each city
      }))
      .sort((a, b) => {
        // First sort by country, then by city name within the same country
        const countryCompare = a.country.localeCompare(b.country);
        if (countryCompare !== 0) return countryCompare;
        return a.name.localeCompare(b.name);
      })
      .map(city => city.name);
  }


  async loadCSVData(): Promise<void> {
    const data = await d3.csv('assets/final_dataset_new.csv');
    const citySet = new Set<string>();
    const countrySet = new Set<string>();
    const regionSet = new Set<string>();
    const seenRoutes = new Set<string>();

    data.forEach(d => {
      const route = new EcoRoute(d);
      citySet.add(route.departureCity);
      citySet.add(route.arrivalCity);
      countrySet.add(route.departureCountry);
      countrySet.add(route.arrivalCountry);
      regionSet.add(route.departureRegion);
      regionSet.add(route.arrivalRegion);

      const routeKey = `${route.departureCity}-${route.arrivalCity}`;
      const reverseRouteKey = `${route.arrivalCity}-${route.departureCity}`;

      if (!seenRoutes.has(routeKey) && !seenRoutes.has(reverseRouteKey) && route.distance <= 5000) {
        this.cityLinks.push({
          source: route.departureCity,
          target: route.arrivalCity,
          weight: route.avgCO2,
          sourceCountry: route.departureCountry,
          targetCountry: route.arrivalCountry,
          sourceRegion: route.departureRegion,
          targetRegion: route.arrivalRegion,
        });
        seenRoutes.add(routeKey);
      }
      this.ecoRoutes.push(route);
    });

    this.cityNodes = Array.from(citySet);
    this.prepareCountryData();
    this.prepareRegionData();
  }

  private prepareCountryData(): void {
    const countryLinksMap = new Map<string, { weight: number; count: number; source: string; target: string; sourceCountry: string; targetCountry: string; sourceRegion: string; targetRegion: string }>();

    this.cityLinks.forEach(link => {
      const { sourceCountry, targetCountry, weight, sourceRegion, targetRegion } = link;

      if (sourceCountry === targetCountry) return;

      const countryLinkKey = `${sourceCountry}-${targetCountry}`;
      if (!countryLinksMap.has(countryLinkKey)) {
        countryLinksMap.set(countryLinkKey, {
          weight: 0,
          count: 0,
          source: sourceCountry,
          target: targetCountry,
          sourceCountry,
          targetCountry,
          sourceRegion,
          targetRegion
        });
      }
      const countryLink = countryLinksMap.get(countryLinkKey);
      if (countryLink) {
        countryLink.weight += weight;
        countryLink.count += 1;
      }
    });

    this.countryNodes = Array.from(new Set(this.cityLinks.map(link => link.sourceCountry).concat(this.cityLinks.map(link => link.targetCountry))));
    this.countryLinks = Array.from(countryLinksMap.values()).map(link => ({
      source: link.source,
      target: link.target,
      weight: link.weight / link.count,
      sourceCountry: link.sourceCountry,
      targetCountry: link.targetCountry,
      sourceRegion: link.sourceRegion,
      targetRegion: link.targetRegion
    }));
  }

  prepareRegionData(): void {
    const regionLinksMap = new Map<string, { weight: number; count: number; source: string; target: string }>();

    // Define the valid regions
    const validRegions = new Set(['Eastern Europe', 'Southern Europe', 'Western Europe', 'British Isles', 'Northern Europe']);

    this.cityLinks.forEach(link => {
      const { sourceRegion, targetRegion, weight } = link;

      // Filter out links that are not between the valid regions
      if (!validRegions.has(sourceRegion) || !validRegions.has(targetRegion) || sourceRegion === targetRegion) return;

      const regionLinkKey = `${sourceRegion}-${targetRegion}`;
      if (!regionLinksMap.has(regionLinkKey)) {
        regionLinksMap.set(regionLinkKey, {
          weight: 0,
          count: 0,
          source: sourceRegion,
          target: targetRegion
        });
      }
      const regionLink = regionLinksMap.get(regionLinkKey);
      if (regionLink) {
        regionLink.weight += weight;
        regionLink.count++;
      }
    });

    // Filter regionNodes to include only valid regions
    this.regionNodes = Array.from(new Set(this.cityLinks.map(link => link.sourceRegion).concat(this.cityLinks.map(link => link.targetRegion))))
      .filter(region => validRegions.has(region));

    this.regionLinks = Array.from(regionLinksMap.values()).map(link => ({
      source: link.source,
      target: link.target,
      weight: link.weight / link.count,
      sourceCountry: 'Unknown', // Placeholder value
      targetCountry: 'Unknown', // Placeholder value
      sourceRegion: link.source,
      targetRegion: link.target
    }));
  }

}