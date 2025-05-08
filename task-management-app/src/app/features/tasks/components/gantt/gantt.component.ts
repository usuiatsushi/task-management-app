import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
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
  @Output() taskUpdated = new EventEmitter<any>();

  ngOnInit() {
    this.configureGantt();
  }

  private configureGantt() {
    gantt.config.row_height = 36;
    gantt.config.bar_height = 24;
    gantt.config.grid_width = 320;
    gantt.config.scale_height = 40;
    gantt.config.min_column_width = 16;
    gantt.config.scales = [
      { unit: "month", step: 1, format: "%Y年%m月" },
      { unit: "day", step: 1, format: "%d" }
    ];

    // 表示期間の設定
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 30);

    gantt.config.start_date = startDate;
    gantt.config.end_date = endDate;

    // 週末と今日のスタイル設定
    gantt.templates.scale_cell_class = function(date: any) {
      if (date.getDay() === 0 || date.getDay() === 6) {
        return "gantt-weekend";
      }
      if (gantt.date.date_part(new Date(), date) === 0) {
        return "gantt-today";
      }
      return "";
    };

    // タスクのスタイル設定
    gantt.templates.task_class = function(start: any, end: any, task: any) {
      if (task.status === '完了') return "gantt-bar-complete";
      if (task.status === '進行中') return "gantt-bar-progress";
      return "gantt-bar-default";
    };

    // タスクの表示設定
    gantt.config.columns = [
      { name: "text", label: "タスク名", tree: true, width: 200 },
      { name: "start_date", label: "開始日", align: "center", width: 100 },
      { name: "duration", label: "期間", align: "center", width: 60 }
    ];

    // 日付フォーマットの設定
    gantt.config.date_format = "%Y-%m-%d %H:%i";

    // タスクの編集を許可
    gantt.config.editable = true;
    gantt.config.drag_progress = true;
    gantt.config.drag_resize = true;
    gantt.config.drag_move = true;

    // イベントハンドラの設定
    gantt.attachEvent("onAfterTaskUpdate", (id: string, task: any) => {
      this.handleTaskUpdate(id, task);
    });

    gantt.attachEvent("onAfterTaskDrag", (id: string, mode: string, e: any) => {
      const task = gantt.getTask(id);
      this.handleTaskUpdate(id, task);
    });
  }

  private handleTaskUpdate(id: string, task: any) {
    const originalTask = this.tasks.find(t => t.id === id);
    if (!originalTask) return;

    const updatedTask = {
      ...originalTask,
      title: task.text,
      startDate: task.start_date,
      duration: task.duration,
      dueDate: new Date(task.start_date.getTime() + task.duration * 24 * 60 * 60 * 1000)
    };

    this.taskUpdated.emit(updatedTask);
  }

  ngAfterViewInit() {
    if (this.active) {
      this.initGantt();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['active'] && this.active) {
      setTimeout(() => this.initGantt(), 0);
    }
    if (changes['tasks']) {
      this.updateGanttData();
    }
  }

  private initGantt() {
    if (!this.ganttContainer?.nativeElement) return;
    
    gantt.clearAll();
    gantt.init(this.ganttContainer.nativeElement);
    this.updateGanttData();
  }

  private updateGanttData() {
    if (!this.tasks?.length) return;

    const ganttData = this.tasks.map((task, i) => {
      const startDate = this.getDateFromTask(task);
      return {
        id: task.id || i + 1,
        text: task.title,
        start_date: startDate,
        duration: task.duration || 7,
        status: task.status || '未着手',
        progress: task.status === '完了' ? 1 : (task.status === '進行中' ? 0.5 : 0)
      };
    });

    gantt.parse({ data: ganttData });
  }

  private getDateFromTask(task: any): Date {
    let date: Date;
    
    if (task.startDate) {
      date = task.startDate instanceof Date ? task.startDate : new Date(task.startDate.seconds * 1000);
    } else if (task.dueDate) {
      date = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate.seconds * 1000);
    } else {
      date = new Date();
    }

    // 時刻を00:00:00に設定
    date.setHours(0, 0, 0, 0);
    return date;
  }

  ngOnDestroy() {
    gantt.clearAll();
  }
}
