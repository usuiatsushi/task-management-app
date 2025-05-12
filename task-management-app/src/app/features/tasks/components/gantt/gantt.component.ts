import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import 'dhtmlx-gantt';
import { TimelineControlsComponent } from '../timeline-controls/timeline-controls.component';
import { CalendarSyncDialogComponent } from '../calendar-sync-dialog/calendar-sync-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TaskService } from '../../services/task.service';
import { CalendarService } from '../../services/calendar.service';

declare let gantt: any;

@Component({
  selector: 'app-gantt',
  standalone: true,
  imports: [TimelineControlsComponent],
  templateUrl: './gantt.component.html',
  styleUrl: './gantt.component.scss'
})
export class GanttComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('gantt_here', { static: true }) ganttContainer!: ElementRef;
  @Input() active = false; // タブのアクティブ状態を受け取る
  @Input() tasks: any[] = []; // タスクデータを受け取る
  @Output() taskUpdated = new EventEmitter<any>();

  private isUpdating = false;
  public startDate: Date | null = null;
  public endDate: Date | null = null;

  private keydownHandler = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowLeft':
        this.shiftTimeline(-1);
        event.preventDefault();
        break;
      case 'ArrowRight':
        this.shiftTimeline(1);
        event.preventDefault();
        break;
      case 'ArrowUp':
        this.shiftTimeline(-7);
        event.preventDefault();
        break;
      case 'ArrowDown':
        this.shiftTimeline(7);
        event.preventDefault();
        break;
    }
  };

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private taskService: TaskService,
    private calendarService: CalendarService
  ) {}

  ngOnInit() {
    this.configureGantt();

    gantt.attachEvent('onTaskDrag', (id: string, mode: string, task: any, original: any) => {
      const taskStart = (task.start_date instanceof Date) ? task.start_date : new Date(task.start_date);
      const taskEnd = (task.end_date instanceof Date) ? task.end_date : new Date(task.end_date);
      const rangeStart = (gantt.config.start_date instanceof Date) ? gantt.config.start_date : new Date(gantt.config.start_date);
      const rangeEnd = (gantt.config.end_date instanceof Date) ? gantt.config.end_date : new Date(gantt.config.end_date);

      // 右端が表示範囲の最終日の2日前「以降」
      const rangeEndMinus2 = new Date(rangeEnd);
      rangeEndMinus2.setDate(rangeEnd.getDate() - 2);
      if ((mode === 'resize' || mode === 'move') && taskEnd.getTime() > rangeEndMinus2.getTime()) {
        this.shiftTimeline(1);
      }
      // 左端が表示範囲の最初の日の2日後「以前」
      const rangeStartPlus2 = new Date(rangeStart);
      rangeStartPlus2.setDate(rangeStart.getDate() + 2);
      if ((mode === 'resize' || mode === 'move') && taskStart.getTime() < rangeStartPlus2.getTime()) {
        this.shiftTimeline(-1);
      }
      return true;
    });

    gantt.attachEvent('onBeforeTaskDrag', (id: string, mode: string, e: any) => {
      const task = gantt.getTask(id);
      if (task.status === '完了') {
        return false;
      }
      return true;
    });
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
    this.startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
    this.endDate = new Date(this.startDate.getFullYear(), this.startDate.getMonth(), this.startDate.getDate() + 30);

    gantt.config.start_date = this.startDate;
    gantt.config.end_date = this.endDate;

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

  private async handleTaskUpdate(id: string, task: any) {
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

      // カレンダー連携の確認ダイアログを表示
      const dialogRef = this.dialog.open(CalendarSyncDialogComponent, {
        width: '350px',
        data: { taskTitle: updatedTask.title }
      });

      const result = await dialogRef.afterClosed().toPromise();
      const shouldSyncWithCalendar = result === true;

      if (shouldSyncWithCalendar) {
        // 最新のタスク情報を取得
        const currentTask = await this.taskService.getTask(id);
        const oldCalendarEventId = currentTask.calendarEventId;
        
        // 古いカレンダーイベントを削除
        if (oldCalendarEventId) {
          try {
            await this.calendarService.deleteCalendarEvent({ ...currentTask, calendarEventId: oldCalendarEventId });
          } catch (error) {
            console.error('古いカレンダーイベントの削除に失敗しました:', error);
            this.snackBar.open('古いカレンダーイベントの削除に失敗しました', '閉じる', { duration: 3000 });
            return;
          }
        }

        // 新しいカレンダーイベントを作成
        try {
          const newTask = { ...currentTask, dueDate: endTimestamp, calendarEventId: '' };
          await this.calendarService.addTaskToCalendar(newTask);
        } catch (error) {
          console.error('新しいカレンダーイベントの作成に失敗しました:', error);
          this.snackBar.open('新しいカレンダーイベントの作成に失敗しました', '閉じる', { duration: 3000 });
          return;
        }
      }

      // タスクリストを直接更新
      const taskIndex = this.tasks.findIndex(t => t.id === id);
      if (taskIndex !== -1) {
        this.tasks[taskIndex] = updatedTask;
      }

      this.taskUpdated.emit(updatedTask);

      // タイムラインを即時更新
      this.updateGanttData();
    } catch (error) {
      console.error('タスクの更新に失敗しました:', error);
      this.snackBar.open('タスクの更新に失敗しました', '閉じる', { duration: 3000 });
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
    // キーボード操作対応
    if (this.ganttContainer?.nativeElement) {
      this.ganttContainer.nativeElement.setAttribute('tabindex', '0');
      this.ganttContainer.nativeElement.addEventListener('keydown', this.keydownHandler);
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

    // ステータス順にソート（未着手→進行中→完了）
    const statusOrder: { [key: string]: number } = { '未着手': 1, '進行中': 2, '完了': 3 };
    const sortedTasks = [...this.tasks].sort((a, b) => {
      return (statusOrder[a.status as string] || 99) - (statusOrder[b.status as string] || 99);
    });

    console.log('タイムライン更新開始:', sortedTasks);
    
    const ganttData = sortedTasks.map((task, i) => {
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
    if (this.ganttContainer?.nativeElement) {
      this.ganttContainer.nativeElement.removeEventListener('keydown', this.keydownHandler);
    }
    gantt.clearAll();
  }

  onDateRangeChange(range: { start: Date; end: Date }) {
    this.startDate = range.start;
    this.endDate = range.end;
    // dhtmlx-ganttの表示範囲を更新
    gantt.config.start_date = this.startDate;
    gantt.config.end_date = this.endDate;
    this.updateGanttData();
  }

  private shiftTimeline(days: number) {
    const start = new Date(this.startDate!);
    const end = new Date(this.endDate!);
    start.setDate(start.getDate() + days);
    end.setDate(end.getDate() + days);
    this.startDate = start;
    this.endDate = end;
    gantt.config.start_date = start;
    gantt.config.end_date = end;
    gantt.render();
  }
}
