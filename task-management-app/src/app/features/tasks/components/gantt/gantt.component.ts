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
  @Input() tasks: any[] = []; // タスクデータを受け取る

  ngOnInit() {
    // 見た目・カレンダー部分のカスタマイズ
    gantt.config.row_height = 36;
    gantt.config.bar_height = 24;
    gantt.config.grid_width = 320;
    gantt.config.scale_height = 40;
    gantt.config.scales = [
      { unit: "month", step: 1, format: "%Y年%m月" },
      { unit: "day", step: 1, format: "%j日(%D)" }
    ];
    gantt.templates.scale_cell_class = function(date: any){
      if(date.getDay() === 0 || date.getDay() === 6){
        return "gantt-weekend";
      }
      if(gantt.date.date_part(new Date(), date) === 0){
        return "gantt-today";
      }
      return "";
    };
    gantt.templates.task_class = function (start: any, end: any, task: any) {
      if (task.status === '完了') return "gantt-bar-complete";
      if (task.status === '進行中') return "gantt-bar-progress";
      return "gantt-bar-default";
    };
  }

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

    // タスクデータをdhtmlx-gantt用に変換
    const ganttData = this.tasks.map((task, i) => ({
      id: task.id || i + 1,
      text: task.title,
      start_date: this.formatDate(task.dueDate || task.startDate),
      duration: task.duration || 3,
      status: task.status || ''
    }));

    gantt.parse({ data: ganttData });
  }

  formatDate(date: any): string {
    // Firestore TimestampやDate型を "YYYY-MM-DD" 形式に変換
    if (!date) return "2024-07-01";
    const d = date instanceof Date ? date : new Date(date.seconds ? date.seconds * 1000 : date);
    return d.toISOString().slice(0, 10);
  }

  ngOnDestroy() {
    gantt.clearAll();
  }
}
