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

  private isUpdating = false;

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
    gantt.config.edit_on_create = true;
    gantt.config.drag_progress = true;
    gantt.config.drag_resize = true;
    gantt.config.drag_move = true;

    // イベントハンドラの設定
    gantt.attachEvent('onAfterTaskUpdate', (id: string, task: any) => {
      console.log('タスク更新イベント:', { id, task });
      this.handleTaskUpdate(id, task);
      return true;
    });

    gantt.attachEvent('onAfterTaskDrag', (id: string, mode: string, e: any) => {
      console.log('タスクドラッグイベント:', { id, mode, e });
      const task = gantt.getTask(id);
      this.handleTaskUpdate(id, task);
      return true;
    });

    // タスクの移動を許可
    gantt.config.drag_move = true;
    gantt.config.drag_resize = true;
    gantt.config.drag_progress = true;
  }

  private handleTaskUpdate(id: string, task: any) {
    if (this.isUpdating) {
      console.log('更新処理中です。重複更新をスキップします。');
      return;
    }
    this.isUpdating = true;

    try {
      const originalTask = this.tasks.find(t => t.id === id);
      if (!originalTask) return;

      console.log('更新前のタスク:', originalTask);

      // Ganttからの日付データを直接取得
      const ganttTask = gantt.getTask(id);
      console.log('Ganttタスクデータ:', ganttTask);

      // 開始日を取得
      const startDate = new Date(ganttTask.start_date);
      console.log('Gantt開始日:', startDate);

      // 時刻を00:00:00に設定
      startDate.setHours(0, 0, 0, 0);
      
      // 終了日を計算
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + ganttTask.duration - 1);
      endDate.setHours(0, 0, 0, 0);

      console.log('計算後の終了日:', endDate);

      // タイムスタンプに変換
      const startTimestamp = {
        seconds: Math.floor(startDate.getTime() / 1000),
        nanoseconds: 0
      };

      const endTimestamp = {
        seconds: Math.floor(endDate.getTime() / 1000),
        nanoseconds: 0
      };

      console.log('変換後のタイムスタンプ:', {
        start: startTimestamp,
        end: endTimestamp
      });

      const updatedTask = {
        ...originalTask,
        title: ganttTask.text || originalTask.title,
        startDate: startTimestamp,
        duration: ganttTask.duration,
        dueDate: endTimestamp
      };

      console.log('更新後のタスク:', updatedTask);

      // タスクリストを直接更新
      const taskIndex = this.tasks.findIndex(t => t.id === id);
      if (taskIndex !== -1) {
        this.tasks[taskIndex] = updatedTask;
      }

      this.taskUpdated.emit(updatedTask);

      // タイムラインを即時更新
      this.updateGanttData();
    } finally {
      setTimeout(() => {
        this.isUpdating = false;
      }, 500);
    }
  }

  ngAfterViewInit() {
    if (this.active) {
      this.initGantt();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['active'] && changes['active'].currentValue) {
      // タブがアクティブになった時にガントチャートを初期化
      setTimeout(() => {
        this.initGantt();
      }, 0);
    }
    if (changes['tasks']) {
      console.log('タスク変更検知:', changes['tasks'].currentValue);
      if (this.active) {
        this.updateGanttData();
      }
    }
  }

  private initGantt() {
    if (!this.ganttContainer?.nativeElement) return;
    
    try {
      gantt.clearAll();
      gantt.init(this.ganttContainer.nativeElement);
      this.updateGanttData();
    } catch (error) {
      console.error('ガントチャートの初期化に失敗しました:', error);
    }
  }

  private updateGanttData() {
    if (!this.tasks?.length) return;

    console.log('タイムライン更新開始:', this.tasks);
    
    const ganttData = this.tasks.map((task, i) => {
      try {
        // 開始日の処理
        let startDate: Date;
        if (task.startDate) {
          if (task.startDate instanceof Date) {
            startDate = new Date(task.startDate);
          } else if (task.startDate.seconds) {
            startDate = new Date(task.startDate.seconds * 1000);
          } else {
            startDate = new Date(task.startDate);
          }
        } else {
          // デフォルト値として現在の日付を使用
          startDate = new Date();
        }

        // 終了日の処理
        let endDate: Date;
        if (task.dueDate) {
          if (task.dueDate instanceof Date) {
            endDate = new Date(task.dueDate);
          } else if (task.dueDate.seconds) {
            endDate = new Date(task.dueDate.seconds * 1000);
          } else {
            endDate = new Date(task.dueDate);
          }
        } else {
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + (task.duration || 7) - 1);
        }

        // 時刻を00:00:00に設定
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);

        const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        const ganttTask = {
          id: task.id || i + 1,
          text: task.title,
          start_date: startDate,
          duration: task.duration || duration,
          status: task.status || '未着手',
          progress: task.status === '完了' ? 1 : (task.status === '進行中' ? 0.5 : 0)
        };

        console.log('Ganttタスクデータ:', ganttTask);
        console.log('タスクデータ:', task);
        console.log('開始日:', task.startDate);
        console.log('変換後の開始日:', startDate);
        return ganttTask;
      } catch (error) {
        console.error('タスクデータ変換エラー:', error, task);
        return {
          id: task.id || i + 1,
          text: task.title || '無題のタスク',
          start_date: new Date(),
          duration: 7,
          status: '未着手',
          progress: 0
        };
      }
    });

    console.log('Ganttデータ更新:', ganttData);
    gantt.clearAll();
    gantt.parse({ data: ganttData });
  }

  private getDateFromTask(task: any, field: 'start_date' | 'end_date'): Date {
    let date: Date;
    
    if (task[field]) {
      date = task[field] instanceof Date ? task[field] : new Date(task[field]);
    } else if (field === 'start_date' && task.startDate) {
      date = task.startDate instanceof Date ? task.startDate : new Date(task.startDate);
    } else if (field === 'end_date' && task.dueDate) {
      date = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
    } else {
      date = new Date();
    }
    
    // 日本時間に調整（UTC+9）
    const jstDate = new Date(date.getTime() + (9 * 60 * 60 * 1000));
    // 時刻を00:00:00に設定
    jstDate.setHours(0, 0, 0, 0);
    return jstDate;
  }

  ngOnDestroy() {
    gantt.clearAll();
  }
}
