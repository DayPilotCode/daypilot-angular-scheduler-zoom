import {Component, ViewChild, AfterViewInit, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {DayPilot, DayPilotModule, DayPilotSchedulerComponent} from '@daypilot/daypilot-lite-angular';
import {DataService} from './data.service';

@Component({
  selector: 'scheduler-component',
  standalone: true,
  imports: [DayPilotModule, FormsModule],
  providers: [DataService],
  template: `
    <div class="controls" role="group" aria-label="Timeline zoom">
      <span class="controls-label">Zoom</span>
      <button id="minus" (click)="minus()" [disabled]="config().zoom === 0" aria-label="Zoom out">-</button>
      <input type="range" min="0" [max]="zoomLevels.length - 1" step="1"
             [ngModel]="config().zoom" (ngModelChange)="setZoom($event)" aria-label="Zoom level" />
      <button id="plus" (click)="plus()" [disabled]="config().zoom === zoomLevels.length - 1" aria-label="Zoom in">+</button>
      <span id="label" aria-live="polite">{{currentZoomLevelName}}</span>
    </div>

    <daypilot-scheduler [config]="config" [events]="events" #scheduler></daypilot-scheduler>`,
  styles: [`
    .controls {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      box-sizing: border-box;
      max-width: 100%;
      margin: 0 0 12px;
      padding: 8px 10px;
      border: 1px solid #dce3eb;
      border-radius: 8px;
      background: #f5f7fa;
    }
    .controls-label {
      margin-right: 4px;
      color: #475569;
      font-size: 13px;
      font-weight: 600;
    }
    .controls input[type=range] {
      width: 120px;
      min-width: 60px;
      margin: 0;
      accent-color: #3c78d8;
      cursor: pointer;
    }
    .controls button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      padding: 0;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background: #ffffff;
      color: #2459a6;
      font-size: 20px;
      line-height: 1;
      cursor: pointer;
      transition: background-color 120ms, border-color 120ms;
    }
    .controls button:hover:not(:disabled) {
      border-color: #3c78d8;
      background: #e8f0fc;
    }
    .controls button:focus-visible,
    .controls input[type=range]:focus-visible {
      outline: 2px solid #3c78d8;
      outline-offset: 3px;
    }
    .controls button:disabled {
      border-color: #e2e8f0;
      background: #f1f5f9;
      color: #94a3b8;
      cursor: default;
    }
    #label {
      box-sizing: border-box;
      min-width: 60px;
      padding: 5px 10px;
      border-radius: 5px;
      background: #e6eefb;
      color: #234f8e;
      font-size: 13px;
      font-weight: 600;
      text-align: center;
    }
  `]
})
export class SchedulerComponent implements AfterViewInit {

  @ViewChild('scheduler')
  scheduler!: DayPilotSchedulerComponent;

  events = signal<DayPilot.EventData[]>([]);

  zoomLevels: ZoomLevel[] = [
      {
        name: "Year",
        properties: {
          scale: "Day",
          cellWidth: 40,
          timeHeaders: [{groupBy: "Year"}, {groupBy: "Month", format: "MMMM"}, {groupBy: "Day", format: "d"}],
          startDate: (args: ZoomLevelCallbackArgs) => { return args.date.firstDayOfYear(); },
          days: (args: ZoomLevelCallbackArgs) => { return args.date.daysInYear(); },
        }
      },
      {
        name: "Month",
        properties: {
          scale: "CellDuration",
          cellDuration: 720,
          cellWidth: 40,
          timeHeaders: [{groupBy: "Month"}, {groupBy: "Day", format: "ddd d"}, {groupBy: "Cell", format: "tt"}],
          startDate: (args: ZoomLevelCallbackArgs) => { return args.date.firstDayOfMonth(); },
          days: (args: ZoomLevelCallbackArgs) => { return args.date.daysInMonth();},
        }
      },
      {
        name: "Week",
        properties: {
          scale: "Hour",
          cellWidth: 40,
          timeHeaders: [{groupBy: "Month"}, {groupBy: "Day", format: "dddd d"}, {groupBy: "Hour"}],
          startDate: (args: ZoomLevelCallbackArgs) => { return args.date.firstDayOfWeek(); },
          days: (_args: ZoomLevelCallbackArgs) => { return 7; },
        }
      },
      {
        name: "Hour",
        properties: {
          scale: "CellDuration",
          cellDuration: 15,
          cellWidth: 40,
          timeHeaders: [{groupBy: "Day", format: "dddd MMMM d, yyyy"}, {groupBy: "Hour"}, {groupBy: "Cell"}],
          startDate: (args: ZoomLevelCallbackArgs) => { return args.date.getDatePart(); },
          days: (_args: ZoomLevelCallbackArgs) => { return 1; },
        }
      },
    ];

  config = signal<DayPilot.SchedulerConfig>({
    startDate: "2026-11-01",
    zoom: 1,
    rowHeaderWidth: 120,
    zoomPosition: "left",
    zoomLevels: this.zoomLevels,
    onTimeRangeSelected: async args => {
      const scheduler = args.control;
      const modal = await DayPilot.Modal.prompt("Create a new event:", "Event 1");
      scheduler.clearSelection();
      if (modal.canceled) {
        return;
      }
      scheduler.events.add({
        start: args.start,
        end: args.end,
        id: DayPilot.guid(),
        resource: args.resource,
        text: modal.result
      });
    }
  });

  constructor(private ds: DataService) {
  }

  setZoom(value: number): void {
    const zoom = Math.max(0, Math.min(Number(value), this.zoomLevels.length - 1));
    this.config.update(config => ({ ...config, zoom }));
  }

  plus(): void {
    this.setZoom(Number(this.config().zoom) + 1);
  }

  minus(): void {
    this.setZoom(Number(this.config().zoom) - 1);
  }

  get currentZoomLevelName(): string {
    return this.zoomLevels[Number(this.config().zoom)].name;
  }

  ngAfterViewInit(): void {
    this.ds.getResources().subscribe(resources => {
      this.config.update(config => ({ ...config, resources }));
    });

    const from = this.scheduler.control.visibleStart();
    const to = this.scheduler.control.visibleEnd();
    this.ds.getEvents(from, to).subscribe(events => this.events.set(events));
  }
}

export interface ZoomLevel extends DayPilot.ZoomLevel {
  name: string;
}

export interface ZoomLevelCallbackArgs {
  date: DayPilot.Date;
  level: DayPilot.ZoomLevel;
}
