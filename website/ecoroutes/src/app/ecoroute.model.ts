export class EcoRoute {
    arrivalCity: string = "";
    arrivalCoordinates: string = "";
    arrivalCountry: string = "";
    arrivalRegion: string = "";
    carCO2: number = -1;
    carDuration: number = -1;
    carEnergyResourceConsumption: number = -1;
    carProducts: string = "";
    departureCity: string = "";
    departureCoordinates: string = "";
    departureCountry: string = "";
    departureRegion: string = "";
    flightCO2: number = -1;
    flightDuration: number = -1;
    flightEnergyResourceConsumption: number = -1;
    flightProducts: string = "";
    id: string = "";
    trainCO2: number = -1;
    trainDuration: number = -1;
    trainEnergyResourceConsumption: number = -1;
    trainProducts: string = "";
    avgCO2: number = -1;
    avgERC: number = -1;
    avgCO2W: number = -1;
    avgERCW: number = -1;
    distance: number = -1;
    flightMarketShare: number = -1;
    trainFlightDurationDelta: number = -1;
    trainMarketShare: number = -1;
    chosenCO2: 'train' | 'avg' | 'flight' = 'avg';

    constructor(data: any) {
        if (data) {
            this.id = data?.ID || '';
            this.departureCity = data?.['Departure City'] || '';
            this.arrivalCity = data?.['Arrival City'] || '';
            this.departureCoordinates = data?.['Departure Coordinates'] || '';
            this.arrivalCoordinates = data?.['Arrival Coordinates'] || '';
            this.trainCO2 = parseFloat(data?.['Train CO2']) || 0;
            this.trainEnergyResourceConsumption = parseFloat(data?.['Train Energy Resource Consumption']) || 0;
            this.trainProducts = data?.['Train Products'] || '';
            this.trainDuration = parseFloat(data?.['Train Duration']) || 0;
            this.carCO2 = parseFloat(data?.['Car CO2']) || 0;
            this.carEnergyResourceConsumption = parseFloat(data?.['Car Energy Resource Consumption']) || 0;
            this.carProducts = data?.['Car Products'] || '';
            this.carDuration = parseFloat(data?.['Car Duration']) || 0;
            this.flightCO2 = parseFloat(data?.['Flight CO2']) || 0;
            this.flightEnergyResourceConsumption = parseFloat(data?.['Flight Energy Resource Consumption']) || 0;
            this.flightProducts = data?.['Flight Products'] || '';
            this.flightDuration = parseFloat(data?.['Flight Duration']) || 0;
            this.departureCountry = data?.['Departure Country'] || '';
            this.arrivalCountry = data?.['Arrival Country'] || '';
            this.departureRegion = data?.['Departure Region'] || '';
            this.arrivalRegion = data?.['Arrival Region'] || '';
            this.trainFlightDurationDelta = parseFloat(data?.['train_flight_duration_delta']) || 0;
            this.trainMarketShare = parseFloat(data?.['train_market_share']) || 0;
            this.flightMarketShare = parseFloat(data?.['flight_market_share']) || 0;
            this.avgCO2 = parseFloat(data?.['avg_co2']) || 0;
            this.avgERC = parseFloat(data?.['avg_erc']) || 0;
            this.avgCO2W = parseFloat(data?.['avg_co2_w']) || 0;
            this.avgERCW = parseFloat(data?.['avg_erc_w']) || 0;
            this.distance = parseFloat(data?.['distance']) || 0;
        }
    }
}
