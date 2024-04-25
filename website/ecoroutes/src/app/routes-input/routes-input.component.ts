import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-routes-input',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './routes-input.component.html',
  styleUrl: './routes-input.component.scss'
})
export class RoutesInputComponent {

  route = {
    departure: '',
    destination: '',
    transport: {
      plane: false,
      train: false,
      average: false
    }
  };

  addRoute() {
    console.log('Adding route:', this.route);
    // Implement your logic to handle the route addition here
  }

}
