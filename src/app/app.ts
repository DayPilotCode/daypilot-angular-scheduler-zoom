import { Component } from '@angular/core';
import { SchedulerComponent } from './scheduler/scheduler.component';

@Component({
  selector: 'app-root',
  imports: [SchedulerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
}
