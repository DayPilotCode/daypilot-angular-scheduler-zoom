import {Injectable} from '@angular/core';
import {DayPilot} from '@daypilot/daypilot-lite-angular';
import {Observable, of} from 'rxjs';

@Injectable()
export class DataService {
  private start = new DayPilot.Date("2026-11-01");

  private resources: DayPilot.ResourceData[] = [
    {name: "Resource 1", id: "R1"},
    {name: "Resource 2", id: "R2"},
    {name: "Resource 3", id: "R3"},
    {name: "Resource 4", id: "R4"}
  ];

  private events: DayPilot.EventData[] = [
    {id: "1", resource: "R1", start: this.start.addDays(2), end: this.start.addDays(7), text: "Scheduler Event 1"},
    {id: "2", resource: "R2", start: this.start.addDays(1), end: this.start.addDays(4), text: "Scheduler Event 2"},
    {id: "3", resource: "R2", start: this.start.addDays(5), end: this.start.addDays(8), text: "Scheduler Event 3"}
  ];

  getResources(): Observable<DayPilot.ResourceData[]> {
    return of(this.resources);
  }

  getEvents(_from: DayPilot.Date, _to: DayPilot.Date): Observable<DayPilot.EventData[]> {
    // Return the whole in-memory event set so every zoom level can display it.
    return of(this.events);
  }
}
