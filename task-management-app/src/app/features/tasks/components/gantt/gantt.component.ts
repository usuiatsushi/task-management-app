import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import 'dhtmlx-gantt';

declare let gantt: any;

@Component({
  selector: 'app-gantt',
  standalone: true,
  imports: [],
  templateUrl: './gantt.component.html',
  styleUrl: './gantt.component.scss'
})
export class GanttComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('gantt_here', { static: true }) ganttContainer!: ElementRef;
  @Input() active = false; // タブのアクティブ状態を受け取る

  ngOnInit() {}

  ngAfterViewInit() {
    if (this.active) {
      this.initGantt();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['active'] && this.active) {
      setTimeout(() => this.initGantt(), 0); // DOMが描画された後に初期化
    }
  }

  initGantt() {
    gantt.clearAll();
    gantt.init(this.ganttContainer.nativeElement);
    gantt.parse({
      data: [
        { id: 1, text: "タスクA", start_date: "2024-07-01", duration: 3 },
        { id: 2, text: "タスクB", start_date: "2024-07-04", duration: 2 }
      ]
    });
  }

  ngOnDestroy() {
    gantt.clearAll();
  }
}
